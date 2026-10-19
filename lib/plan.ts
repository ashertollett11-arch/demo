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
export async function fetchVisibleLocationIds(): Promise<Set<string> | null> {
  try {
    const res = await fetch("/api/active-locations")
    if (!res.ok) return null
    const body = await res.json()
    if (!Array.isArray(body?.activeIds)) return null
    return new Set<string>(body.activeIds.map(String))
  } catch {
    return null
  }
}
