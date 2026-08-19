import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { studentEmail, studentName, companyName, businessType } = await request.json()

    if (!studentEmail || !studentName || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: studentEmail,
      subject: `${companyName} has reached out to you on SimplyApply`,
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
                        <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">Good news, ${studentName}! 🎉</p>
                        <p style="margin: 0 0 24px; font-size: 16px; color: #6b7280;">An employer on SimplyApply has already reached out to you.</p>

                        <!-- EMPLOYER CARD -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 20px 24px;">
                              <p style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #1e40af;">${companyName}</p>
                              ${businessType ? `<p style="margin: 0; font-size: 13px; color: #3b82f6; text-transform: capitalize;">${businessType}</p>` : ""}
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
                          They've already tried to contact you by phone or email — make sure to check both and respond as soon as you can. Employers move quickly, so a fast response gives you the best chance.
                        </p>

                        <p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.6;">
                          You can also check your SimplyApply profile to see the full details about this opportunity.
                        </p>

                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="https://simplyapply.app/matching/student" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                                View Jobs on SimplyApply
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="padding: 20px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          You're receiving this because you have a profile on SimplyApply.<br/>
                          © ${new Date().getFullYear()} SimplyApply · All rights reserved.
                        </p>
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