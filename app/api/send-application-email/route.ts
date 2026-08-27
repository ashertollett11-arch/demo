import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

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
      .select("email_notifications")
      .eq("id", employerUserId)
      .maybeSingle()

    if (profile?.email_notifications === false) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/matching/employer/${studentId}`

    const { error } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: employerEmail,
      subject: `New application for ${locationName} — ${studentName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

                    <!-- HEADER -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">SimplyApply</p>
                        <p style="margin: 6px 0 0; font-size: 13px; color: #bfdbfe;">Connecting students with local employers</p>
                      </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">New Application Received</p>
                        <p style="margin: 0 0 24px; font-size: 16px; color: #6b7280;">A student has applied to one of your listings on SimplyApply.</p>

                        <!-- DETAIL CARD -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 20px 24px;">
                              <p style="margin: 0 0 4px; font-size: 13px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Applicant</p>
                              <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #1e40af;">${studentName}</p>
                              <p style="margin: 0 0 4px; font-size: 13px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Applied To</p>
                              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e3a8a;">${locationName} — ${companyName}</p>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.6;">
                          View their full profile on SimplyApply to see their availability, GPA, match score, and contact information.
                        </p>

                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${profileUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                                View Applicant Profile
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="padding: 20px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
                        <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">
                          You're receiving this because you have an employer account on SimplyApply.
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          To turn off these emails, visit your profile settings.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} SimplyApply · All rights reserved.</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}