import { NextResponse } from "next/server"
import {
  studentWelcome, studentUnfinished, employerWelcome, employerUnfinished, chooseRoleUnfinished,
} from "@/lib/emails/templates"

/**
 * Dev-only preview of every onboarding email, so templates can be eyeballed
 * without sending anything. Returns 404 in production.
 */
export async function GET() {
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
    ["No role chosen (day 1)", chooseRoleUnfinished({ name: "Maya Rodriguez" })],
  ]

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
