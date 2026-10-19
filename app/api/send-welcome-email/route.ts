import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { getCallerId } from "@/lib/apiAuth"
import { studentWelcome, employerWelcome } from "@/lib/emails/templates"

const FROM = "SimplyApply <noreply@simplyapply.app>"

/**
 * Sent once, when a student or employer finishes onboarding. The role and all
 * the content come from the database using the caller's verified id — nothing
 * is taken from the request body.
 */
export async function POST(request: Request) {
  try {
    const userId = await getCallerId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Never send the same onboarding email twice, even if the client retries.
    const { data: already } = await supabase
      .from("onboarding_emails")
      .select("id").eq("user_id", userId).eq("kind", "welcome").maybeSingle()
    if (already) return NextResponse.json({ success: true, skipped: "already sent" })

    const { data: roleRow } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()
    const role = roleRow?.role
    if (role !== "student" && role !== "employer") {
      return NextResponse.json({ error: "No role" }, { status: 400 })
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    let to = authUser?.user?.email ?? null
    let email: { subject: string; html: string }

    if (role === "student") {
      const { data: student } = await supabase
        .from("Students").select("name, email, profile_complete").eq("user_id", userId).maybeSingle()
      if (!student?.profile_complete) return NextResponse.json({ error: "Profile not complete" }, { status: 400 })
      to = student.email || to
      email = studentWelcome({ name: student.name })
    } else {
      const { data: profile } = await supabase
        .from("profiles").select("email, email_notifications, profile_complete").eq("id", userId).maybeSingle()
      if (profile?.email_notifications === false) {
        return NextResponse.json({ success: true, skipped: "opted out" })
      }
      const { data: job } = await supabase
        .from("job").select("id, company, email").eq("user_id", userId).maybeSingle()
      const { data: location } = await supabase
        .from("locations").select("name, hourly_pay, has_tips, preferred_jobs")
        .eq("employer_id", job?.id ?? "").order("created_at", { ascending: true }).limit(1).maybeSingle()
      to = job?.email || profile?.email || to
      email = employerWelcome({
        company: job?.company,
        locationName: location?.name,
        hourlyPay: location?.hourly_pay,
        hasTips: Boolean(location?.has_tips),
        roles: location?.preferred_jobs,
      })
    }

    if (!to) return NextResponse.json({ error: "No address" }, { status: 400 })

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM, to, subject: email.subject, html: email.html,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from("onboarding_emails").insert({ user_id: userId, kind: "welcome" })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
