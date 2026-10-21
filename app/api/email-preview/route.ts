import { NextResponse } from "next/server"
import { Resend } from "resend"
import {
  studentWelcome, studentUnfinished, employerWelcome, employerUnfinished, chooseRoleUnfinished, proWelcome, cancelConfirm, proWinback, proValue, checkoutAbandoned, paymentFailed,
} from "@/lib/emails/templates"

/**
 * Dev-only preview of every onboarding email, so templates can be eyeballed
 * without sending anything. Returns 404 in production.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 })
  }

  const all: [string, { subject: string; html: string }][] = [
    ["Student · welcome (profile completed)", studentWelcome({ name: "Maya Rodriguez" })],
    ["Student · unfinished setup (day 1)", studentUnfinished({ name: "Maya Rodriguez" })],
    ["Employer · welcome (onboarding completed)", employerWelcome({
      company: "Cow Girl Kitchen", locationName: "Beachside Location",
      hourlyPay: 13, hasTips: true, roles: ["Barista", "Customer Service"],
    })],
    ["Employer · unfinished setup (day 1)", employerUnfinished({ company: "Cow Girl Kitchen" })],
    // No-role users have no Students row and no auth metadata name, so this
    // one is previewed the way it actually sends: without a greeting.
    ["No role chosen (day 1)", chooseRoleUnfinished({})],
    ["Employer \u00b7 Pro subscription started", proWelcome({ company: "Cow Girl Kitchen" })],
    ["Employer \u00b7 cancellation confirmed", cancelConfirm({ company: "Cow Girl Kitchen", endsAt: "2026-11-21T00:00:00Z" })],
    ["Employer \u00b7 win-back (Pro lapsed)", proWinback({ company: "Cow Girl Kitchen" })],
    ["Employer \u00b7 value email (repeat paywall hits)", proValue({ company: "Cow Girl Kitchen" })],
    ["Employer \u00b7 abandoned checkout", checkoutAbandoned({ company: "Cow Girl Kitchen" })],
    ["Employer \u00b7 payment failed", paymentFailed({ company: "Cow Girl Kitchen", invoiceUrl: "https://invoice.stripe.com/example", nextAttempt: "2026-10-28T00:00:00Z" })],
  ]

  // ?send=<address>&which=<n> delivers one of these for real, so inbox
  // placement and rendering can be checked. Dev only — this route 404s in
  // production — and it writes nothing, so it can't affect the dedupe records.
  const params = new URL(request.url).searchParams
  const sendTo = params.get("send")
  if (sendTo) {
    const which = Number(params.get("which") ?? 0)
    const picked = all[which]
    if (!picked) return NextResponse.json({ error: `which must be 0-${all.length - 1}` }, { status: 400 })
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: sendTo, subject: picked[1].subject, html: picked[1].html,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sent: true, to: sendTo, template: picked[0], subject: picked[1].subject })
  }

  const page = `<!doctype html><meta charset="utf-8"><title>Email preview</title>
<style>
  body{margin:0;background:#e9eaec;font-family:-apple-system,system-ui,sans-serif}
  .lab{max-width:560px;margin:30px auto 4px;font:700 13px system-ui;color:#3f3f46;letter-spacing:.04em;text-transform:uppercase}
  .sub{max-width:560px;margin:0 auto 8px;font:400 13px system-ui;color:#71717a}
  iframe{display:block;width:100%;max-width:600px;margin:0 auto;border:0;background:#f4f4f5}
</style>
${all.map(([label, e], i) => `<div class="lab">${label}</div>
<div class="sub">Subject: ${e.subject}</div>
<iframe id="f${i}" srcdoc="${e.html.replace(/"/g, "&quot;")}" onload="this.style.height=this.contentDocument.body.scrollHeight+'px'"></iframe>`).join("\n")}`

  return new NextResponse(page, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
