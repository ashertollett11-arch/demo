import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { studentUnfinished, employerUnfinished, chooseRoleUnfinished } from "@/lib/emails/templates"

const FROM = "SimplyApply <noreply@simplyapply.app>"
const REMIND_AFTER_HOURS = 24
const MAX_AGE_DAYS = 14 // don't email people who signed up and vanished months ago

/**
 * Daily sweep: nudge anyone who signed up, confirmed their email, and never
 * finished onboarding. Sent once per user — `onboarding_emails` records it.
 *
 * Scheduled by vercel.json; protected by CRON_SECRET so it can't be triggered
 * by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ?dry=1 reports exactly who would be emailed, and sends nothing. Use it
  // before any change to the targeting rules.
  const dryRun = new URL(request.url).searchParams.get("dry") === "1"

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
      const created = new Date(u.created_at).getTime()
      return created < olderThan && created > newerThan
    })
    if (!candidates.length) return NextResponse.json({ checked: 0, sent: 0 })

    const ids = candidates.map((u) => u.id)

    const [{ data: roles }, { data: students }, { data: profiles }, { data: jobs }, { data: sentRows }] =
      await Promise.all([
        supabase.from("users").select("id, role").in("id", ids),
        supabase.from("Students").select("user_id, name, profile_complete").in("user_id", ids),
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
    const skipped: Record<string, number> = { complete: 0, alreadySent: 0, optedOut: 0 }
    const would: { email: string; role: string; subject: string }[] = []

    for (const user of candidates) {
      if (alreadySent.has(`${user.id}:reminder`) || alreadySent.has(`${user.id}:welcome`)) {
        skipped.alreadySent++; continue
      }
      const role = roleOf.get(user.id)

      let email: { subject: string; html: string }

      if (role !== "student" && role !== "employer") {
        // Confirmed but never chose a role — ask them which they are.
        // A Students row can exist from /choose-role, so use any saved name.
        email = chooseRoleUnfinished({ name: studentOf.get(user.id)?.name })
      } else if (role === "student") {
        const student = studentOf.get(user.id)
        if (student?.profile_complete) { skipped.complete++; continue }
        email = studentUnfinished({ name: student?.name })
      } else {
        const profile = profileOf.get(user.id)
        if (profile?.profile_complete) { skipped.complete++; continue }
        if (profile?.email_notifications === false) { skipped.optedOut++; continue }
        email = employerUnfinished({ company: jobOf.get(user.id)?.company })
      }

      if (dryRun) {
        would.push({ email: user.email!, role: role ?? "none", subject: email.subject })
        continue
      }

      const { error } = await resend.emails.send({
        from: FROM, to: user.email!, subject: email.subject, html: email.html,
      })
      if (error) { console.error("REMINDER SEND ERROR:", user.id, error.message); continue }

      await supabase.from("onboarding_emails").insert({ user_id: user.id, kind: "reminder" })
      sent++
    }

    if (dryRun) {
      return NextResponse.json({ dryRun: true, checked: candidates.length, wouldSend: would.length, would, skipped })
    }
    return NextResponse.json({ checked: candidates.length, sent, skipped })
  } catch (err: any) {
    console.error("ONBOARDING REMINDERS ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
