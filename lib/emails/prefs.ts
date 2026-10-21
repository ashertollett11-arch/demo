/**
 * Employer email categories.
 *
 *  hiring  — activity about students: a new applicant, someone you contacted
 *  other   — value, abandoned checkout and win-back emails
 *  account — purchase and cancellation confirmations
 *
 * `account` always sends. Someone who just paid, or whose access is about to
 * stop, needs to be told regardless of what they've switched off.
 */
export type EmailCategory = "hiring" | "other" | "account"

export type EmailPrefs = {
  email_notifications?: boolean | null  // master switch
  email_hiring?: boolean | null
  email_other?: boolean | null
}

export function canEmail(prefs: EmailPrefs | null | undefined, category: EmailCategory): boolean {
  if (category === "account") return true
  if (prefs?.email_notifications === false) return false
  if (category === "hiring") return prefs?.email_hiring !== false
  return prefs?.email_other !== false
}

/** Columns to select wherever a send decision is made. */
export const PREF_COLUMNS = "email_notifications, email_hiring, email_other"

/**
 * First-month discount offered in the "other" emails. The code itself lives in
 * Stripe; this is only the string shown to the employer.
 */
export const PROMO_CODE = process.env.PRO_PROMO_CODE || "PRO25"
export const PROMO_DESCRIPTION = "25% off your first month"
