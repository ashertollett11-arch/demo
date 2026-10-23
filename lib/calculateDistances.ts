import { authedFetch } from "./authedFetch"

/**
 * Trigger the distance calculation for a location, and say whether it worked.
 *
 * This matters more than it looks. The student job board drops any location
 * with no row in `employer_student_distances` — see the distance filter in
 * app/matching/student/page.tsx — so a location whose distances were never
 * calculated is invisible to every student, permanently.
 *
 * Both callers used to be `fetch(...).catch(() => {})`, which swallowed
 * network errors and never checked the response at all. A failed Google
 * lookup therefore produced a location that saved cleanly, told the employer
 * it was live, and could never be seen by anyone. Nothing surfaced it.
 *
 * One retry covers the common transient case (a cold start or a brief Google
 * blip). Anything still failing after that is reported to the caller so the
 * employer can be told their listing is not live yet.
 */
export type DistanceResult =
  | { ok: true; calculated: number }
  | { ok: false; error: string }

async function attempt(locationId: string): Promise<DistanceResult> {
  const res = await authedFetch("/api/calculate-distances", {
    method: "POST",
    body: JSON.stringify({ locationId }),
  })
  // A 400/500 here still resolves the promise, which is exactly what the old
  // `.catch()` missed.
  const body = await res.json().catch(() => null)
  if (!res.ok) return { ok: false, error: body?.error || `Request failed (${res.status})` }
  return { ok: true, calculated: body?.calculated ?? 0 }
}

export async function calculateDistancesFor(locationId: string): Promise<DistanceResult> {
  for (let tryNo = 1; tryNo <= 2; tryNo++) {
    try {
      const result = await attempt(locationId)
      if (result.ok) return result
      if (tryNo === 2) {
        console.error("calculate-distances failed:", locationId, result.error)
        return result
      }
    } catch (e: any) {
      if (tryNo === 2) {
        const error = e?.message || "Network error"
        console.error("calculate-distances threw:", locationId, error)
        return { ok: false, error }
      }
    }
    await new Promise((r) => setTimeout(r, 1200))
  }
  return { ok: false, error: "Unreachable" }
}

/**
 * Shown when the calculation fails. Deliberately explicit that the listing is
 * not visible yet: the whole bug was an employer believing they were live.
 */
export const DISTANCE_FAILED_MESSAGE =
  "Saved, but we couldn't work out how far students are from this location, so it won't appear on the job board yet. Open the location and save it again to retry."
