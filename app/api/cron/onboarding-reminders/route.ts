import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { studentUnfinished, employerUnfinished, chooseRoleUnfinished } from "@/lib/emails/templates"
import { isSuppressed } from "@/lib/emails/suppress"
import { proValue } from "@/lib/emails/templates"
import { canEmail, PREF_COLUMNS } from "@/lib/emails/prefs"
import { claimEmail, releaseEmail } from "@/lib/emails/claim"

const FROM = "SimplyApply <noreply@simplyapply.app>"
const REMIND_AFTER_HOURS = 24
const MAX_AGE_DAYS = 14 // don't email people who signed up and vanished months ago
const PRO_INTEREST_THRESHOLD = 3 // paywall views before the value email is worth sending

/**
 * Daily sweep: nudge anyone who signed up, confirmed their email, and never
 * finished onboarding. Sent once per user — `onboarding_emails` records it.
 *
 * Scheduled by vercel.json; protected by CRON_SECRET so it can't be triggered
 * by anyone who finds the URL.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://simplyapply.app"

/**
 * A one-click sign-in link, so a reminder doesn't drop someone on a login
 * form. These people already stalled once; asking for a password they may
 * never have set is another reason to give up.
 *
 * Returns null on failure, and the caller falls back to the plain URL. The
 * link expires (Supabase's OTP setting, 1h by default), but an expired one
 * now lands on /login?redirect=... rather than a dead end.
 */
async function signInLink(supabase: any, email: string, redirectTo: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${SITE}${redirectTo}` },
    })
    if (error) { console.warn("signInLink failed:", email, error.message); return null }
    return data?.properties?.action_link ?? null
  } catch (e: any) {
    console.warn("signInLink threw:", email, e.message)
    return null
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ?dry=1 reports exactly who would be emailed, and sends nothing. Use it
  // before any change to the targeting rules.
  const params = new URL(request.url).searchParams
  const dryRun = params.get("dry") === "1"
  // ?only=<email> targets a single address and ignores the age window, so the
  // flow can be tested without waiting 24h or loosening the real rule.
  // Suppression, opt-out and already-sent checks still apply.
  const only = params.get("only")?.trim().toLowerCase() || null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const resend = new Resend(process.env.RESEND_API_KEY)

    const now = Date.now()
    const olderThan = now - REMIND_AFTER_HOURS * 3600_000
    const newerThan = now - MAX_AGE_DAYS * 24 * 3600_000

    // candidates: confirmed accounts inside the window
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    // A bad service key makes listUsers return nothing, which would otherwise
    // look identical to "no one needs an email" and fail silently forever.
    if (listError) {
      console.error("ONBOARDING REMINDERS: cannot list users:", listError.message)
      return NextResponse.json({ error: `Could not list users: ${listError.message}` }, { status: 500 })
    }

    const candidates = (list?.users ?? []).filter((u) => {
      if (!u.email || !u.email_confirmed_at) return false
      if (only) return u.email.toLowerCase() === only
      const created = new Date(u.created_at).getTime()
      return created < olderThan && created > newerThan
    })
    if (!candidates.length) return NextResponse.json({ checked: 0, sent: 0 })

    const ids = candidates.map((u) => u.id)

    const [{ data: roles }, { data: students }, { data: profiles }, { data: jobs }, { data: sentRows }] =
      await Promise.all([
        supabase.from("users").select("id, role").in("id", ids),
        supabase.from("Students").select("user_id, name, profile_complete, email_notifications").in("user_id", ids),
        supabase.from("profiles").select("id, profile_complete, email_notifications").in("id", ids),
        supabase.from("job").select("user_id, company").in("user_id", ids),
        supabase.from("onboarding_emails").select("user_id, kind").in("user_id", ids),
      ])

    const roleOf = new Map((roles ?? []).map((r: any) => [r.id, r.role]))
    const studentOf = new Map((students ?? []).map((s: any) => [s.user_id, s]))
    const profileOf = new Map((profiles ?? []).map((p: any) => [p.id, p]))
    const jobOf = new Map((jobs ?? []).map((j: any) => [j.user_id, j]))
    const alreadySent = new Set((sentRows ?? []).map((r: any) => `${r.user_id}:${r.kind}`))

    let sent = 0
    const skipped: Record<string, number> = { complete: 0, alreadySent: 0, optedOut: 0, suppressed: 0 }
    const would: { email: string; role: string; subject: string }[] = []

    for (const user of candidates) {
      if (isSuppressed(user.email)) { skipped.suppressed++; continue }
      if (alreadySent.has(`${user.id}:reminder`) || alreadySent.has(`${user.id}:welcome`)) {
        skipped.alreadySent++; continue
      }
      const role = roleOf.get(user.id)

      let email: { subject: string; html: string }

      if (role !== "student" && role !== "employer") {
        // Confirmed but never chose a role — ask them which they are.
        // A Students row can exist from /choose-role, so use any saved name.
        const link = dryRun ? null : await signInLink(supabase, user.email!, "/choose-role")
        email = chooseRoleUnfinished({ name: studentOf.get(user.id)?.name, signInUrl: link })
      } else if (role === "student") {
        const student = studentOf.get(user.id)
        if (student?.profile_complete) { skipped.complete++; continue }
        if (student?.email_notifications === false) { skipped.optedOut++; continue }
        const link = dryRun ? null : await signInLink(supabase, user.email!, "/student/onboarding")
        email = studentUnfinished({ name: student?.name, signInUrl: link })
      } else {
        const profile = profileOf.get(user.id)
        if (profile?.profile_complete) { skipped.complete++; continue }
        if (profile?.email_notifications === false) { skipped.optedOut++; continue }
        const link = dryRun ? null : await signInLink(supabase, user.email!, "/employer/onboarding")
        email = employerUnfinished({ company: jobOf.get(user.id)?.company, signInUrl: link })
      }

      if (dryRun) {
        would.push({ email: user.email!, role: role ?? "none", subject: email.subject })
        continue
      }

      // Claim before sending. The pre-check above is only an optimisation —
      // this is what actually guarantees one send.
      if (!(await claimEmail(supabase, user.id, "reminder"))) { skipped.alreadySent++; continue }

      const { error } = await resend.emails.send({
        from: FROM, to: user.email!, subject: email.subject, html: email.html,
      })
      if (error) {
        console.error("REMINDER SEND ERROR:", user.id, error.message)
        await releaseEmail(supabase, user.id, "reminder")
        continue
      }
      sent++
    }

    // ---- second sweep: free employers who keep hitting the paywall ----
    const { data: interested } = await supabase
      .from("profiles")
      .select(`id, email, pro_paywall_hits, subscription_status, ${PREF_COLUMNS}`)
      .gte("pro_paywall_hits", PRO_INTEREST_THRESHOLD)
      .neq("subscription_status", "active")

    let proValueSent = 0
    const wouldProValue: { email: string; hits: number }[] = []

    if (interested?.length) {
      const ids = interested.map((p: any) => p.id)
      const [{ data: sentPro }, { data: proJobs }] = await Promise.all([
        supabase.from("onboarding_emails").select("user_id").eq("kind", "pro_interest").in("user_id", ids),
        supabase.from("job").select("user_id, company, email").in("user_id", ids),
      ])
      const done = new Set((sentPro ?? []).map((r: any) => r.user_id))
      const jobOf = new Map((proJobs ?? []).map((j: any) => [j.user_id, j]))

      for (const prof of interested) {
        if (done.has(prof.id)) continue
        if (!canEmail(prof, "other")) continue
        const to = jobOf.get(prof.id)?.email || prof.email
        if (!to || isSuppressed(to)) continue

        if (dryRun) { wouldProValue.push({ email: to, hits: prof.pro_paywall_hits }); continue }

        if (!(await claimEmail(supabase, prof.id, "pro_interest"))) continue

        const mail = proValue({ company: jobOf.get(prof.id)?.company })
        const { error } = await resend.emails.send({ from: FROM, to, subject: mail.subject, html: mail.html })
        if (error) {
          console.error("PRO VALUE SEND ERROR:", prof.id, error.message)
          await releaseEmail(supabase, prof.id, "pro_interest")
          continue
        }
        proValueSent++
      }
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true, checked: candidates.length, wouldSend: would.length, would, skipped,
        proValue: { candidates: interested?.length ?? 0, would: wouldProValue },
      })
    }
    return NextResponse.json({ checked: candidates.length, sent, skipped, proValueSent })
  } catch (err: any) {
    console.error("ONBOARDING REMINDERS ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
