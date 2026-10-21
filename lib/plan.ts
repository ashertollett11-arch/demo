/**
 * Employer plan tiers.
 *
 * `profiles.subscription_status` is the single source of truth:
 *   "freeactive" -> Free  (1 location, no match %, redacted student detail)
 *   "active"     -> Pro   ($20/mo, everything unlocked)
 *
 * A lapsed Pro falls back to "freeactive" rather than "canceled" so they keep
 * free access instead of being locked out of the employer area entirely.
 */

export const FREE_LOCATION_LIMIT = 1

/** Paid tier. */
export const isPro = (status?: string | null) => status === "active"

/** Allowed into the employer area at all (free or paid). */
export const hasEmployerAccess = (status?: string | null) =>
  status === "active" || status === "freeactive"

/**
 * The locations that actually count for matching. Free employers keep every
 * location they ever created, but only the oldest stays active — so cancelling
 * locks the extras rather than deleting them.
 */
export function activeLocations<T extends { created_at?: string | null }>(
  locations: T[],
  status?: string | null
): T[] {
  if (isPro(status)) return locations
  if (locations.length <= FREE_LOCATION_LIMIT) return locations
  return [...locations]
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))
    .slice(0, FREE_LOCATION_LIMIT)
}

/**
 * Location ids students are allowed to see, fetched from /api/active-locations.
 * Returns null when the lookup fails, which callers treat as "show everything"
 * — an empty job board is a worse failure than a stale listing.
 */
export async function fetchLocationVisibility(): Promise<
  { activeIds: Set<string>; proIds: Set<string> } | null
> {
  try {
    const res = await fetch("/api/active-locations")
    if (!res.ok) return null
    const body = await res.json()
    if (!Array.isArray(body?.activeIds)) return null
    return {
      activeIds: new Set<string>(body.activeIds.map(String)),
      proIds: new Set<string>((body.proIds ?? []).map(String)),
    }
  } catch {
    return null
  }
}

export async function fetchVisibleLocationIds(): Promise<Set<string> | null> {
  return (await fetchLocationVisibility())?.activeIds ?? null
}

/**
 * Pro listings win ties within this many match points.
 *
 * Ordering only — the percentage a student sees is always their real fit.
 * Inflating the number would make it a worse signal, which is the thing Pro
 * employers are paying for in the first place.
 */
export const PRO_TIEBREAK_BAND = 3

/**
 * Orders listings for the student job board: best fit first, with Pro
 * listings winning ties inside a PRO_TIEBREAK_BAND-point band.
 *
 * The band is derived from the score alone, which keeps this a lexicographic
 * key and therefore a valid total order. A direct "within N points" check
 * would not be transitive, and Array.sort gives unpredictable output on a
 * non-transitive comparator.
 */
export function compareByMatchThenPro(
  a: { matchScore: number; isPro?: boolean },
  b: { matchScore: number; isPro?: boolean }
): number {
  const band = (n: number) => Math.floor(n / PRO_TIEBREAK_BAND)
  if (band(a.matchScore) !== band(b.matchScore)) return b.matchScore - a.matchScore
  if (Boolean(a.isPro) !== Boolean(b.isPro)) return a.isPro ? -1 : 1
  return b.matchScore - a.matchScore
}
