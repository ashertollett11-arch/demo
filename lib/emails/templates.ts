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
    // Deliberately task-shaped, matching the reminder that reaches Primary.
    // The earlier version — a teaser subject plus two benefit tiles — was
    // classified as Promotions by Gmail.
    subject: "Finish setting up your SimplyApply account",
    html: shell({
      heading: first ? `Hey ${first}, your account isn't set up yet` : "Your account isn't set up yet",
      intro: "Your email is confirmed, but you haven't told us how you'll use SimplyApply.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We need to know whether you're looking for a job or hiring, so we can set up the right account. It's one tap and you can change it later.</p>` +
        callout("What's left", "Choose student or employer", "Students find local jobs that fit around school. Employers get matched to students who are free when they need cover."),
      ctaLabel: "Finish setting up",
      ctaHref: `${siteUrl}/choose-role`,
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
      intro: "Your subscription is active and everything is unlocked right now.",
      body:
        `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">What you just unlocked</p>` +
        steps([
          "<strong>Unlimited locations.</strong> Every site you hire for gets matched to students separately.",
          "<strong>Match scores.</strong> See how well each student fits the shifts you actually need covered, ranked best first.",
          "<strong>Full student profiles.</strong> Bio, interests, social links and preferred roles.",
          "<strong>Priority placement.</strong> Your listings come first when students are weighing up similar jobs nearby.",
        ]) +
        `<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">You can update your card, download invoices or cancel any time from Billing. If you cancel, Pro stays active until the end of the period and your extra locations pause rather than disappear.</p>`,
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
        ? `${name || "Your account"} keeps full Pro access until ${date}.`
        : `${name || "Your account"} keeps full Pro access until the end of the current billing period.`,
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">You won't be charged again. When Pro ends you'll move to the free plan \u2014 one hiring location stays live, and any others pause rather than being deleted. Nothing is lost, and resubscribing brings them straight back.</p>` +
        callout("After Pro ends", "You keep your free account", "Your oldest location, unlimited candidate browsing, availability matching and the full hiring pipeline."),
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
      intro: "Your extra locations are paused and match scores are hidden again.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Nothing was deleted. Every location you added is still there, and resubscribing makes them live again straight away \u2014 along with match scores on every candidate and full student profiles.</p>` +
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
    subject: name ? `Getting more out of SimplyApply, ${name}` : "Getting more out of SimplyApply",
    html: shell({
      heading: "You keep running into the locked parts",
      intro: "Here's what Pro actually changes about hiring, so you can judge whether it's worth it.",
      body:
        steps([
          "<strong>Stop guessing who fits.</strong> Match scores rank every student by how well they cover the shifts you actually need, so you call the right person first instead of working down a list.",
          "<strong>See who you're calling.</strong> Full profiles include their bio, interests and preferred roles \u2014 useful context before you pick up the phone.",
          "<strong>Hire for every site.</strong> Unlimited locations, each matched to students near it.",
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
        ? `${name} started upgrading to Pro but didn't finish checking out.`
        : "You started upgrading to Pro but didn't finish checking out.",
      body:
        `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Nothing was charged. If something got in the way, replying to this email reaches a person \u2014 and if you were just weighing it up, here's a reason to decide now.</p>` +
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
          ? `Pro is still active. We'll try again on ${retry}, but updating your card now avoids any interruption.`
          : `Pro is still active for now, but it will end if we can't collect payment.`) +
        `</p>` +
        callout(
          "If payment keeps failing",
          "You'll move to the free plan",
          "Nothing is deleted — your extra locations pause and come straight back once payment succeeds."
        ),
      ctaLabel: invoiceUrl ? "Pay now" : "Update payment method",
      ctaHref: invoiceUrl || `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you have an Employer Pro subscription on SimplyApply.",
    }),
  }
}
