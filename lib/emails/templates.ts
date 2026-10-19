import { shell, steps, callout, siteUrl } from "./layout"

const firstName = (name?: string | null) =>
  (name || "").trim().split(/\s+/)[0] || ""

/** Student finished their profile. */
export function studentWelcome({ name }: { name?: string | null }) {
  const first = firstName(name)
  return {
    // Subject and heading are deliberately plain: the celebratory version of
    // this email ("You're all set — time to find a job 🎉") was classified as
    // Promotions by Gmail, while the task-shaped reminder reached Primary.
    subject: first ? `${first}, your SimplyApply profile is live` : "Your SimplyApply profile is live",
    html: shell({
      heading: first ? `Your profile is live, ${first}` : "Your profile is live",
      intro: "Local employers can see you from now on, and you can start applying.",
      body:
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">There are two ways to get hired</p>` +
        steps([
          `<strong>Apply to jobs near you.</strong> We match listings to the days and hours you said you're free, so everything you see already fits your schedule.`,
          `<strong>Let employers come to you.</strong> Businesses nearby can see your profile and will call or email you directly — keep an eye on both.`,
        ]) +
        `<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">One thing that helps a lot: ask a teacher, coach or former manager for a recommendation. Profiles with one stand out to employers.</p>`,
      ctaLabel: "Browse jobs near you",
      ctaHref: `${siteUrl}/matching/student`,
      footerReason: "You're receiving this because you created a student account on SimplyApply.",
    }),
  }
}

/** Student signed up but never finished onboarding. */
export function studentUnfinished({ name }: { name?: string | null }) {
  const first = firstName(name)
  return {
    subject: first ? `${first}, finish setting up your SimplyApply profile` : "Finish setting up your SimplyApply profile",
    html: shell({
      heading: first ? `Hey ${first}, you're almost there` : "You're almost there",
      intro: "Your SimplyApply account is created, but your profile isn't finished yet.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Until it's complete, employers can't see you and we can't match you to jobs. It takes about two minutes — just your availability and a few details. No resume needed.</p>` +
        callout("What you get once it's done", "Jobs that fit your schedule", "Local employers can find you, and you can apply in a couple of taps."),
      ctaLabel: "Finish my profile",
      ctaHref: `${siteUrl}/student/onboarding`,
      footerReason: "You're receiving this because you started creating a student account on SimplyApply.",
    }),
  }
}

/** Employer finished onboarding and has their first location live. */
export function employerWelcome({
  company, locationName, hourlyPay, hasTips, roles,
}: {
  company?: string | null
  locationName?: string | null
  hourlyPay?: number | string | null
  hasTips?: boolean
  roles?: string[] | null
}) {
  const name = (company || "").trim()
  const pay = hourlyPay ? `$${hourlyPay}/hr${hasTips ? " + tips" : ""}` : null
  const detail = [roles?.length ? roles.join(" · ") : null, pay].filter(Boolean).join("  |  ")
  return {
    subject: name ? `${name} is live on SimplyApply` : "Your listing is live on SimplyApply",
    html: shell({
      heading: name ? `${name} is live` : "Your listing is live",
      intro: locationName
        ? `Students near ${locationName} can see your listing and start applying today.`
        : "Students nearby can see your listing and start applying today.",
      body:
        (locationName ? callout("Now hiring", `${locationName}${pay ? ` — ${pay}` : ""}`, detail || undefined) : "") +
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">What happens next</p>` +
        steps([
          "Students matching your shifts show up in your dashboard automatically — you don't have to search.",
          "Reach out by phone or email. You have their contact details as soon as they match.",
          "Mark them contacted or hired to keep your pipeline straight.",
        ]),
      ctaLabel: "See your candidates",
      ctaHref: `${siteUrl}/matching/employer`,
      footerReason: "You're receiving this because you created an employer account on SimplyApply.",
    }),
  }
}

/** Employer signed up but never finished onboarding. */
export function employerUnfinished({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `Finish setting up ${name} on SimplyApply` : "Finish setting up your SimplyApply account",
    html: shell({
      heading: name ? `${name} isn't live yet` : "Your account isn't live yet",
      intro: "You started setting up an employer account, but it's not finished.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We need your company details and one hiring location before students can find you. It takes a few minutes, and matching students show up straight away — you don't have to post a job or sift through applications.</p>` +
        callout("Once you're set up", "Students matched to your shifts", "Sorted by how well they fit the hours you actually need covered."),
      ctaLabel: "Finish setup",
      ctaHref: `${siteUrl}/employer/onboarding`,
      footerReason: "You're receiving this because you started creating an employer account on SimplyApply.",
    }),
  }
}

/**
 * Confirmed their email but never chose a role, so we don't know whether they
 * came to find work or to hire. One tap resolves it.
 */
export function chooseRoleUnfinished({ name }: { name?: string | null }) {
  const first = firstName(name)
  return {
    subject: "One step left on SimplyApply",
    html: shell({
      heading: first ? `Hey ${first}, one step left` : "One step left",
      intro: "Your account is confirmed — we just don't know yet what you came here for.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Tell us whether you're looking for a job or hiring, and we'll set the right thing up. It's one tap, and you can change it later.</p>` +
        `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="padding:0 0 12px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;"><tr><td style="padding:16px 20px;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1e40af;">I'm a student</p>
              <p style="margin:0;font-size:14px;color:#1e3a8a;">Find local jobs that fit around school. No resume needed.</p>
            </td></tr></table>
          </td></tr>
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;"><tr><td style="padding:16px 20px;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827;">I'm hiring</p>
              <p style="margin:0;font-size:14px;color:#6b7280;">Get matched to students who are free when you need cover.</p>
            </td></tr></table>
          </td></tr>
        </table>`,
      ctaLabel: "Choose how I'll use SimplyApply",
      ctaHref: `${siteUrl}/choose-role`,
      footerReason: "You're receiving this because you created an account on SimplyApply.",
    }),
  }
}
