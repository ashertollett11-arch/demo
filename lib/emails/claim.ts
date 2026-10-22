/**
 * Reserving a one-shot email before it is sent.
 *
 * These used to send first and record afterwards. That held until a cron run
 * on 2026-10-22 sent the Pro value email and died before the insert landed:
 * the row never appeared, so the sweep matched the same employer again on
 * every later run and would have re-sent daily, forever.
 *
 * Claiming first flips the failure mode. If anything dies between the claim
 * and the send, the worst case is one email that never goes out, instead of
 * one that never stops. That is the direction we want to fail in.
 *
 * Exclusivity comes from the unique (user_id, kind) index on
 * onboarding_emails, so two concurrent runs cannot both claim the same email.
 */

/** True when the claim is ours and the caller should send. */
export async function claimEmail(supabase: any, userId: string, kind: string): Promise<boolean> {
  const { error } = await supabase.from("onboarding_emails").insert({ user_id: userId, kind })
  if (!error) return true
  // 23505 = unique violation: already sent, or another run got there first.
  if (error.code === "23505") return false
  // Anything else means we can't prove it's unsent, so don't send. Unlike the
  // old code, this is logged rather than swallowed.
  console.error(`claimEmail(${kind}) failed for ${userId}:`, error.message)
  return false
}

/** Hand the claim back when the send itself failed, so a later run can retry. */
export async function releaseEmail(supabase: any, userId: string, kind: string) {
  const { error } = await supabase
    .from("onboarding_emails").delete().eq("user_id", userId).eq("kind", kind)
  if (error) console.error(`releaseEmail(${kind}) failed for ${userId}:`, error.message)
}
