/**
 * Addresses that must never receive automated email, from the
 * EMAIL_SUPPRESS_LIST env var (comma-separated).
 *
 * Use this to hold back a real user while testing, rather than faking a row
 * in `onboarding_emails` — that would record a send that never happened and
 * quietly make them unreachable forever. Removing the address here restores
 * them to the normal flow.
 */
const list = (process.env.EMAIL_SUPPRESS_LIST || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isSuppressed(email?: string | null): boolean {
  if (!email) return false
  return list.includes(email.trim().toLowerCase())
}

export const suppressedCount = list.length
