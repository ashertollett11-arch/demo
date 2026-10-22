import { shell, steps, callout, siteUrl } from "./layout"
import { PROMO_CODE, PROMO_DESCRIPTION } from "./prefs"

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
      intro: "Employers near you can see it from now on.",
      body:
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">Two ways this works</p>` +
        steps([
          `<strong>Go looking.</strong> Everything on your jobs page already fits the hours you said you're free, so you're not scrolling past shifts you can't work.`,
          `<strong>Or let them find you.</strong> Businesses nearby go looking for students themselves. They'll call or email, so keep an eye on both.`,
        ]) +
        `<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">One thing worth doing: ask a teacher, coach or old boss to write you a recommendation. Takes them about two minutes, and it's usually what makes an employer pick you over someone else.</p>`,
      ctaLabel: "Browse jobs near you",
      ctaHref: `${siteUrl}/matching/student`,
      footerReason: "You're receiving this because you created a student account on SimplyApply.",
    }),
  }
}

/** Student signed up but never finished onboarding. */
export function studentUnfinished({ name, signInUrl }: { name?: string | null; signInUrl?: string | null }) {
  const first = firstName(name)
  return {
    subject: first ? `${first}, finish setting up your SimplyApply profile` : "Finish setting up your SimplyApply profile",
    html: shell({
      heading: first ? `Hey ${first}, you're almost there` : "You're almost there",
      intro: "You made an account but didn't finish your profile.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Nothing really happens until it's done. Employers can't see you, and we can't match you to anything. It's about two minutes of work: when you're free, and a few basics. No resume.</p>` +
        callout("What you're missing", "Jobs that fit around school", "Shifts you can actually work, and employers who can actually reach you."),
      ctaLabel: "Finish my profile",
      ctaHref: signInUrl || `${siteUrl}/student/onboarding`,
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
        ? `Students near ${locationName} can see your listing from now on.`
        : "Students nearby can see your listing from now on.",
      body:
        (locationName ? callout("Now hiring", `${locationName}${pay ? ` — ${pay}` : ""}`, detail || undefined) : "") +
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">What happens next</p>` +
        steps([
          "Matching students turn up in your dashboard on their own. You don't have to search, and there's no job post to write.",
          "Call or email whoever looks right. You get their details as soon as they match.",
          "Mark people contacted or hired, so you can tell at a glance who you've already spoken to.",
        ]),
      ctaLabel: "See your candidates",
      ctaHref: `${siteUrl}/matching/employer`,
      footerReason: "You're receiving this because you created an employer account on SimplyApply.",
    }),
  }
}

/** Employer signed up but never finished onboarding. */
export function employerUnfinished({ company, signInUrl }: { company?: string | null; signInUrl?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `Finish setting up ${name} on SimplyApply` : "Finish setting up your SimplyApply account",
    html: shell({
      heading: name ? `${name} isn't live yet` : "Your account isn't live yet",
      intro: "You started setting up an account but didn't finish.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We need your company details and one location before students can see you. It's a few minutes, and matching starts the moment you're done. There's no job ad to write and no pile of applications to read.</p>` +
        callout("Once you're set up", "Students matched to your shifts", "Sorted by how well they cover the hours you actually need filled."),
      ctaLabel: "Finish setup",
      ctaHref: signInUrl || `${siteUrl}/employer/onboarding`,
      footerReason: "You're receiving this because you started creating an employer account on SimplyApply.",
    }),
  }
}

/**
 * Confirmed their email but never chose a role, so we don't know whether they
 * came to find work or to hire. One tap resolves it.
 */
export function chooseRoleUnfinished({ name, signInUrl }: { name?: string | null; signInUrl?: string | null }) {
  const first = firstName(name)
  return {
    // Deliberately task-shaped, matching the reminder that reaches Primary.
    // The earlier version — a teaser subject plus two benefit tiles — was
    // classified as Promotions by Gmail.
    subject: "Finish setting up your SimplyApply account",
    html: shell({
      heading: first ? `Hey ${first}, your account isn't set up yet` : "Your account isn't set up yet",
      intro: "Your email's confirmed. We just don't know yet whether you're after work or hiring for it.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">One tap sorts it, and you can switch later if you pick the wrong one.</p>` +
        callout("What's left", "Student or employer", "Students find jobs that fit around school. Employers get matched to students who are free when they need cover."),
      ctaLabel: "Finish setting up",
      ctaHref: signInUrl || `${siteUrl}/choose-role`,
      footerReason: "You're receiving this because you created an account on SimplyApply.",
    }),
  }
}

/**
 * Sent by the Stripe webhook when a subscription starts. This is a purchase
 * confirmation, so it is sent regardless of the notification preference —
 * the preference governs hiring activity, not billing.
 *
 * Stripe sends the actual receipt separately, if receipts are enabled in the
 * dashboard; this deliberately doesn't restate the amount.
 */
export function proWelcome({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `${name} is on Employer Pro` : "You're on Employer Pro",
    html: shell({
      heading: name ? `${name} is on Employer Pro` : "You're on Employer Pro",
      intro: "That's everything switched on.",
      body:
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">What you just unlocked</p>` +
        steps([
          "<strong>Every location.</strong> Add as many sites as you hire for. Each one gets matched to the students near it.",
          "<strong>Match scores.</strong> Every student gets a number for how well they cover your shifts, best first. No more guessing who to ring.",
          "<strong>The whole profile.</strong> What they're into, what they want to do, and how to find them online.",
          "<strong>You go first.</strong> When a student's choosing between similar jobs nearby, yours sits at the top.",
        ]) +
        `<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">Card, invoices and cancelling all live under Billing. If you ever do cancel, Pro runs to the end of the period and your extra locations just pause. Nothing gets deleted.</p>`,
      ctaLabel: "Go to your dashboard",
      ctaHref: `${siteUrl}/employer`,
      footerReason: "You're receiving this because you started an Employer Pro subscription on SimplyApply.",
    }),
  }
}

/** The discount block shown in the "other" emails. */
function promoBlock() {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px dashed #93c5fd;border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:18px 22px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${PROMO_DESCRIPTION}</p>
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#1e40af;letter-spacing:2px;">${PROMO_CODE}</p>
      <p style="margin:0;font-size:13px;color:#1e3a8a;">Enter it at checkout. One use per business.</p>
    </td></tr>
  </table>`
}

/**
 * Cancellation confirmed. Account category — always sends, because it tells
 * them when access actually stops.
 */
export function cancelConfirm({ company, endsAt }: { company?: string | null; endsAt?: string | null }) {
  const name = (company || "").trim()
  const date = endsAt
    ? new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null
  return {
    subject: "Your Employer Pro subscription is cancelled",
    html: shell({
      heading: "Your cancellation is confirmed",
      intro: date
        ? `You've still got everything until ${date}.`
        : "You've still got everything until the end of the current billing period.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">You won't be charged again. When it ends you'll drop back to the free plan: your oldest location stays live and the rest pause. Nothing gets deleted, so if you come back they switch on again the same minute.</p>` +
        callout("After Pro ends", "You keep a free account", "One live location, as much candidate browsing as you like, and the same hiring pipeline."),
      ctaLabel: "Manage billing",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you cancelled an Employer Pro subscription on SimplyApply.",
    }),
  }
}

/** Pro has actually lapsed. Other category. */
export function proWinback({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `${name} is back on the free plan` : "You're back on the free plan",
    html: shell({
      heading: "Pro has ended",
      intro: "Your extra locations are paused and the match scores are gone.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Everything you set up is still sitting there. Turn Pro back on and your locations go live again the same minute, scores and all.</p>` +
        promoBlock(),
      ctaLabel: "Restart Employer Pro",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you had an Employer Pro subscription on SimplyApply.",
    }),
  }
}

/** Repeatedly hit the paywall without subscribing. Other category. */
export function proValue({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `Is Pro worth it for ${name}?` : "Is Pro worth it?",
    html: shell({
      heading: "You keep running into the locked parts",
      intro: "Fair enough. Here's what it actually changes, so you can decide.",
      body:
        steps([
          "<strong>You stop guessing.</strong> Match scores rank students by how well they cover your shifts, so you ring the right person first instead of working down a list.",
          "<strong>You know who you're ringing.</strong> Their full profile is there before you pick up the phone, not after.",
          "<strong>You can hire for every site.</strong> As many locations as you need, each matched to students near it.",
        ]) +
        promoBlock(),
      ctaLabel: "See what Pro costs",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you have an employer account on SimplyApply.",
    }),
  }
}

/** Started checkout and didn't finish. Other category. */
export function checkoutAbandoned({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: "You were one step from Employer Pro",
    html: shell({
      heading: "So close",
      intro: name
        ? `${name} started upgrading and didn't finish.`
        : "You started upgrading and didn't finish.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Nothing was charged. If something went wrong at checkout, just reply to this and a person will read it. If you were only half sure, here's a nudge.</p>` +
        promoBlock(),
      ctaLabel: "Finish upgrading",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you started an Employer Pro checkout on SimplyApply.",
    }),
  }
}

/**
 * A renewal payment was declined.
 *
 * Account category — this is about losing access, not marketing, so it sends
 * regardless of preferences. Deliberately leads with the fix rather than the
 * problem: the hosted invoice URL lets them pay without hunting for Billing.
 */
export function paymentFailed({
  company, invoiceUrl, nextAttempt,
}: {
  company?: string | null
  invoiceUrl?: string | null
  nextAttempt?: string | null
}) {
  const name = (company || "").trim()
  const retry = nextAttempt
    ? new Date(nextAttempt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null
  return {
    subject: "Your SimplyApply payment didn't go through",
    html: shell({
      heading: "We couldn't take this month's payment",
      intro: name
        ? `The card on file for ${name} was declined.`
        : "The card on file for your account was declined.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">` +
        (retry
          ? `Pro is still running. We'll try the card again on ${retry}, but you can sort it now and stop thinking about it.`
          : "Pro is still running for now, but it'll stop if we can't take payment.") +
        `</p>` +
        callout(
          "If payment keeps failing",
          "You'll move to the free plan",
          "Nothing gets deleted. Your extra locations pause, and come back the moment a payment goes through."
        ),
      ctaLabel: invoiceUrl ? "Pay now" : "Update payment method",
      ctaHref: invoiceUrl || `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you have an Employer Pro subscription on SimplyApply.",
    }),
  }
}
