import { NextResponse } from "next/server"
import { Resend } from "resend"
import { shell, callout, firstName } from "@/lib/emails/layout"
import { REPLY_TO } from "@/lib/emails/sender"

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
      reply_to: REPLY_TO,
      to: studentEmail,
      // Flat statement of fact, not a hook. The two SimplyApply emails that
      // landed in Gmail's Promotions tab both opened "Name, ..." and read
      // like marketing; the ones that reached Primary state what happened.
      subject: `${companyName} tried to contact you about a job`,
      html: shell({
        heading: first ? `${companyName} tried to contact you, ${first}` : `${companyName} tried to contact you`,
        intro: `They marked you as contacted on SimplyApply, which means they have already tried you by phone or email.`,
        body:
          callout("Reached out to you", companyName, businessType || undefined) +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Check both when you get a chance, and get back to them as soon as you can. Employers often move quickly, and a quick reply could help you get your foot in the door.</p>` +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">You can also pull up the full details of this opportunity on your SimplyApply profile.</p>` +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">If you missed a call from a number you did not recognise in the last day or two, that was probably them.</p>`,
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