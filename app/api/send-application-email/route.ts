import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { canEmail, PREF_COLUMNS } from "@/lib/emails/prefs"
import { shell, callout, firstName } from "@/lib/emails/layout"
import { REPLY_TO } from "@/lib/emails/sender"

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { employerUserId, employerEmail, studentName, studentId, locationName, companyName } = await request.json()

    if (!employerUserId || !employerEmail || !studentName || !studentId || !locationName || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if employer has email notifications enabled
    const { data: profile } = await supabase
      .from("profiles")
      .select(PREF_COLUMNS)
      .eq("id", employerUserId)
      .maybeSingle()

    if (!canEmail(profile, "hiring")) {
      return NextResponse.json({ success: true, skipped: "opted out" })
    }

    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/matching/employer/${studentId}`

    const first = firstName(studentName)

    const { error } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      reply_to: REPLY_TO,
      to: employerEmail,
      subject: `New applicant for ${locationName}: ${studentName}`,
      html: shell({
        heading: "Someone's interested in joining your team.",
        intro: `${studentName} just applied for your ${locationName} listing.`,
        body:
          callout("Applicant", studentName, `Applied to ${locationName} — ${companyName}`) +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Want to see if they're a fit? Head to SimplyApply to check out their profile, availability, GPA, match score, and contact information.</p>`,
        ctaLabel: first ? `View ${first}'s application` : "View the application",
        ctaHref: profileUrl,
        footerReason: "You're receiving this because you have an employer account on SimplyApply.",
        prefsPath: "/employer/profile",
      }),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}