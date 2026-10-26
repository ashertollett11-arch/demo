import { Resend } from "resend"
import { claimEmail, releaseEmail } from "@/lib/emails/claim"

/**
 * Tells the founders a new account exists, with whatever is known about it.
 *
 * Fired from two places so nothing is missed and nothing doubles up:
 *   - the welcome route, the moment onboarding completes (full detail)
 *   - the daily cron, for anyone who confirmed their email days ago and
 *     never finished (sparse detail, but these are the ones worth chasing)
 *
 * Exactly-once comes from the same claim the user-facing emails use: the
 * unique (user_id, kind) index on onboarding_emails. Whichever path reaches
 * a user first wins, and the other skips.
 */

const FROM = "SimplyApply <noreply@simplyapply.app>"
const KIND = "admin_signup_alert"

/** Comma-separated override, so the recipients aren't a code change. */
export function adminRecipients(): string[] {
  return (process.env.ADMIN_ALERT_EMAILS ||
    "ashertollett11@gmail.com,asher.tollett@seasideschools.net")
    .split(",").map(e => e.trim()).filter(Boolean)
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function table(rows: [string, unknown][]) {
  const shown = rows.filter(([, v]) =>
    v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
  if (!shown.length) return `<p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Nothing filled in yet.</p>`
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">${
    shown.map(([k, v]) => `<tr>
      <td style="padding:7px 12px 7px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">${esc(k)}</td>
      <td style="padding:7px 0;font-size:14px;color:#111827;font-weight:500;">${esc(Array.isArray(v) ? v.join(", ") : v)}</td>
    </tr>`).join("")}</table>`
}

/** Days a student marked available, as "Thu, Fri, Sat 3:00 PM-10:00 PM". */
function availabilitySummary(availability: any): string | null {
  if (!Array.isArray(availability)) return null
  const on = availability.filter((a: any) => a?.available)
  if (!on.length) return null
  const days = on.map((a: any) => String(a.day).slice(0, 3)).join(", ")
  const w = `${on[0].start}-${on[0].end}`
  const mixed = on.some((a: any) => `${a.start}-${a.end}` !== w)
  return mixed ? `${days} (varies)` : `${days}  ${w}`
}

export async function notifyAdminOfSignup(
  supabase: any,
  userId: string,
  opts: { trigger: "onboarding" | "cron" } = { trigger: "onboarding" }
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const to = adminRecipients()
    if (!to.length) return { sent: false, reason: "no recipients" }

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const account = authUser?.user
    if (!account) return { sent: false, reason: "no auth user" }

    const { data: roleRow } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()
    const role = roleRow?.role ?? null

    let heading = "New signup"
    let rows: [string, unknown][] = []

    if (role === "student") {
      const { data: s } = await supabase.from("Students")
        .select("name, age, gender, school, gpa, email, phone, location, zip_code, availability, shift_preference, interests, preferred_jobs, profile_complete")
        .eq("user_id", userId).maybeSingle()
      heading = s?.name ? `New student: ${s.name}` : "New student"
      rows = [
        ["Role", "Student"],
        ["Name", s?.name], ["Age", s?.age], ["School", s?.school], ["GPA", s?.gpa],
        ["Email", s?.email || account.email], ["Phone", s?.phone],
        ["Address", s?.location], ["Zip", s?.zip_code],
        ["Available", availabilitySummary(s?.availability)],
        ["Prefers", s?.shift_preference],
        ["Wants jobs", s?.preferred_jobs], ["Interests", s?.interests],
        ["Finished setup", s?.profile_complete ? "Yes" : "No — still incomplete"],
      ]
    } else if (role === "employer") {
      const { data: j } = await supabase.from("job")
        .select("id, company, business_type, owner_name, email, phone").eq("user_id", userId).maybeSingle()
      const { data: locs } = j?.id
        ? await supabase.from("locations")
            .select("name, address, zip_code, hourly_pay, has_tips, preferred_jobs, shift_preference, max_distance_miles")
            .eq("employer_id", j.id)
        : { data: [] }
      const { data: prof } = await supabase.from("profiles")
        .select("subscription_status, profile_complete").eq("id", userId).maybeSingle()
      const first = (locs ?? [])[0]
      heading = j?.company ? `New employer: ${j.company}` : "New employer"
      rows = [
        ["Role", "Employer"],
        ["Company", j?.company], ["Type", j?.business_type], ["Contact", j?.owner_name],
        ["Email", j?.email || account.email], ["Phone", j?.phone],
        ["Locations", (locs ?? []).length || null],
        ["First location", first ? `${first.name} — ${first.address}, ${first.zip_code}` : null],
        ["Pay", first?.hourly_pay ? `$${first.hourly_pay}/hr${first.has_tips ? " + tips" : ""}` : null],
        ["Hiring for", first?.preferred_jobs],
        ["Shifts", first?.shift_preference],
        ["Radius", first?.max_distance_miles ? `${first.max_distance_miles} mi` : null],
        ["Plan", prof?.subscription_status],
        ["Finished setup", prof?.profile_complete ? "Yes" : "No — still incomplete"],
      ]
    } else {
      // Confirmed their email but never picked a side.
      const { data: s } = await supabase.from("Students").select("name").eq("user_id", userId).maybeSingle()
      heading = "New signup — no role chosen yet"
      rows = [["Role", "Not chosen yet"], ["Name", s?.name], ["Email", account.email],
              ["Finished setup", "No — stopped at choose-role"]]
    }

    // Claim before sending, same as every other one-shot email here.
    if (!(await claimEmail(supabase, userId, KIND))) return { sent: false, reason: "already alerted" }

    const when = new Date(account.created_at).toLocaleString("en-US",
      { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#111827;padding:20px 32px;">
  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;">SimplyApply · internal</p>
  <p style="margin:4px 0 0;font-size:19px;font-weight:700;color:#fff;">${esc(heading)}</p>
</td></tr>
<tr><td style="padding:28px 32px;">
  ${table(rows)}
  ${table([["Signed up", when], ["Account email", account.email],
           ["Email confirmed", account.email_confirmed_at ? "Yes" : "No"],
           ["Noticed by", opts.trigger === "cron" ? "daily sweep" : "finished onboarding"]])}
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">Sent to the SimplyApply team only. The person signing up never sees this.</p>
</td></tr>
</table></td></tr></table></body></html>`

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM, to, subject: heading, html,
    })
    if (error) {
      console.error("ADMIN ALERT SEND ERROR:", userId, error.message)
      await releaseEmail(supabase, userId, KIND)
      return { sent: false, reason: error.message }
    }
    return { sent: true }
  } catch (e: any) {
    console.error("ADMIN ALERT ERROR:", userId, e?.message)
    return { sent: false, reason: e?.message }
  }
}
