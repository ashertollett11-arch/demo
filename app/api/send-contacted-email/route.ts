import { NextResponse } from "next/server"
import { Resend } from "resend"
import { shell, callout, firstName } from "@/lib/emails/layout"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { studentEmail, studentName, companyName, businessType } = await request.json()

    if (!studentEmail || !studentName || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const first = firstName(studentName)

    const { error } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: studentEmail,
      subject: first
        ? `${first}, ${companyName} wants to reach you`
        : `${companyName} wants to reach you`,
      html: shell({
        heading: first ? `Hey ${first}, you've caught an employer's eye!` : "You've caught an employer's eye!",
        intro: `${companyName} has marked you as contacted on SimplyApply. That means they've tried reaching you by phone or email.`,
        body:
          callout("Reached out to you", companyName, businessType || undefined) +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Check both when you get a chance, and get back to them as soon as you can. Employers often move quickly, and a quick reply could help you get your foot in the door.</p>` +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">You can also pull up the full details of this opportunity on your SimplyApply profile.</p>` +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Good luck!</p>`,
        ctaLabel: "See the details",
        ctaHref: `${process.env.NEXT_PUBLIC_SITE_URL || "https://simplyapply.app"}/student/activity`,
        footerReason: "You're receiving this because you have a student profile on SimplyApply.",
        prefsPath: "/student/profile",
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