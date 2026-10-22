const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://simplyapply.app"

/**
 * Shared shell for every transactional email, matching the house style the
 * application/contacted/recommendation emails already use: blue gradient
 * header, 560px card, #eff6ff callouts.
 */
export function shell({
  heading,
  intro,
  body,
  ctaLabel,
  ctaHref,
  ctaNote,
  footerReason,
  prefsPath = "/student/profile",
}: {
  heading: string
  intro: string
  body: string
  ctaLabel: string
  ctaHref: string
  /** Small reassurance under the button, e.g. where the link goes. */
  ctaNote?: string
  footerReason: string
  /**
   * Where "Manage email preferences" points. Employers and students have
   * separate settings pages; this used to be hardcoded to the student one,
   * so every employer and billing email sent them to a page that isn't
   * theirs. Pass "" to drop the link entirely — the recommendation email
   * goes to someone with no account at all.
   */
  prefsPath?: string
}) {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">SimplyApply</p>
            <p style="margin:6px 0 0;font-size:13px;color:#bfdbfe;">Connecting students with local employers</p>
          </td></tr>

          <tr><td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">${heading}</p>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">${intro}</p>
            ${body}
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="${ctaHref}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${ctaLabel}</a>
            </td></tr></table>
            ${ctaNote ? `<p style="margin:14px 0 0;font-size:13px;color:#9ca3af;text-align:center;">${ctaNote}</p>` : ""}
          </td></tr>

          <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${footerReason}</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ${prefsPath ? `<a href="${SITE}${prefsPath}" style="color:#9ca3af;">Manage email preferences</a>&nbsp;·&nbsp;` : ""}© ${new Date().getFullYear()} SimplyApply
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

/** A numbered "what happens next" list. */
export function steps(items: string[]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    ${items.map((text, i) => `<tr><td style="padding:0 0 12px;font-size:15px;color:#374151;line-height:1.5;">
      <strong style="color:#2563eb;">${i + 1}.</strong> &nbsp;${text}
    </td></tr>`).join("")}
  </table>`
}

/** The blue highlight block used for "here's what we set up". */
export function callout(label: string, title: string, detail?: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${label}</p>
      <p style="margin:0${detail ? " 0 14px" : ""};font-size:18px;font-weight:700;color:#1e40af;">${title}</p>
      ${detail ? `<p style="margin:0;font-size:14px;color:#1e3a8a;">${detail}</p>` : ""}
    </td></tr>
  </table>`
}

/** First name only, for greetings. Empty string when we have no name. */
export function firstName(name?: string | null) {
  return (name || "").trim().split(/\s+/)[0] || ""
}

export const siteUrl = SITE
