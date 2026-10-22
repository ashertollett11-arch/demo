import { shell, steps, callout, siteUrl, firstName } from "./layout"
import { PROMO_CODE } from "./prefs"

/** Where each audience manages their own email settings. */
const STUDENT_PREFS = "/student/profile"
const EMPLOYER_PREFS = "/employer/profile"

const para = (text: string) =>
  `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`

const leadIn = (text: string) =>
  `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">${text}</p>`

/** Student finished their profile. */
export function studentWelcome({ name }: { name?: string | null }) {
  const first = firstName(name)
  return {
    subject: first ? `${first}, your SimplyApply profile is live` : "Your SimplyApply profile is live",
    html: shell({
      heading: first ? `Your profile is live, ${first}. Now what?` : "Your profile is live. Now what?",
      intro: "You're officially on the map. Employers near you can find your profile starting now.",
      body:
        leadIn("Here's how the job hunt works:") +
        steps([
          `<strong>Go looking.</strong> Your jobs page already filters for the hours you said you're free. No point looking at shifts you can't work.`,
          `<strong>Let them come to you.</strong> Local businesses can find you, too. Just keep an eye on your phone and email.`,
        ]) +
        para("One little tip: ask a teacher, coach, or old boss for a recommendation. It takes them about two minutes, and it could be the thing that gets you picked over someone else."),
      ctaLabel: "Browse jobs near you",
      ctaHref: `${siteUrl}/matching/student`,
      footerReason: "You're receiving this because you created a student account on SimplyApply.",
      prefsPath: STUDENT_PREFS,
    }),
  }
}

/** Student signed up but never finished onboarding. */
export function studentUnfinished({ name, signInUrl }: { name?: string | null; signInUrl?: string | null }) {
  const first = firstName(name)
  return {
    subject: first ? `${first}, you left your profile hanging` : "You left your profile hanging",
    html: shell({
      heading: first ? `Hey ${first}, we're not quite there yet.` : "We're not quite there yet.",
      intro: "You made your account, but your profile never made it across the finish line.",
      body:
        para("No finished profile means no employer matches. The good news? You're only about two minutes away.") +
        para("Just add when you're free and a few basics. No resume, no essay, no life story required.") +
        callout("What you're missing", "Jobs that work around school", "Find shifts that fit your schedule and employers who can actually reach you."),
      ctaLabel: "Finish my profile",
      ctaHref: signInUrl || `${siteUrl}/student/onboarding`,
      ctaNote: signInUrl ? "Your magic sign-in link takes you straight back in." : undefined,
      footerReason: "You're receiving this because you started creating a student account on SimplyApply.",
      prefsPath: STUDENT_PREFS,
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
  return {
    subject: name ? `${name} is live. Let's find your next hire.` : "You're live. Let's find your next hire.",
    html: shell({
      heading: name ? `You're officially live, ${name}.` : "You're officially live.",
      intro: locationName
        ? `Students near ${locationName} can now find your listing. Consider this your new shortcut to hiring.`
        : "Students nearby can now find your listing. Consider this your new shortcut to hiring.",
      body:
        (locationName
          ? callout("Now hiring", `${locationName}${pay ? ` — ${pay}` : ""}`, roles?.length ? roles.join(" · ") : undefined)
          : "") +
        leadIn("So, what happens now?") +
        steps([
          "<strong>Students come to you.</strong> Matching students show up in your dashboard automatically. No job ad to write and no endless searching.",
          "<strong>You make the call.</strong> Find someone who looks like a fit? Their contact details are right there.",
          "<strong>Stay organized.</strong> Mark students as contacted or hired so you always know where things stand.",
        ]) +
        para("Less time hunting for help. More time running your business."),
      ctaLabel: "See your candidates",
      ctaHref: `${siteUrl}/matching/employer`,
      footerReason: "You're receiving this because you created an employer account on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/** Employer signed up but never finished onboarding. */
export function employerUnfinished({ company, signInUrl }: { company?: string | null; signInUrl?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `${name}, one last step before you're live` : "One last step before you're live",
    html: shell({
      heading: name ? `Hey, ${name}. You're almost open for hiring.` : "You're almost open for hiring.",
      intro: "You started setting up your account but didn't quite finish.",
      body:
        para("We just need your company details and one location before students can see you. It should only take a few minutes.") +
        para("Then the matching starts. No job ad to write, no mountain of applications to sort through.") +
        callout("What happens when you're live", "Students matched to your shifts", "We help you find students who are actually available when you need them."),
      ctaLabel: "Finish setup",
      ctaHref: signInUrl || `${siteUrl}/employer/onboarding`,
      ctaNote: signInUrl ? "Pick up right where you left off with your magic sign-in link." : undefined,
      footerReason: "You're receiving this because you started creating an employer account on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/**
 * Confirmed their email but never chose a role, so we don't know whether they
 * came to find work or to hire. One tap resolves it.
 *
 * No preferences link in the footer: with no role there's no settings page
 * that belongs to them yet.
 */
export function chooseRoleUnfinished({ name, signInUrl }: { name?: string | null; signInUrl?: string | null }) {
  const first = firstName(name)
  return {
    subject: first ? `${first}, one quick question before we get started` : "One quick question before we get started",
    html: shell({
      heading: first ? `Hey ${first}, what brings you to SimplyApply?` : "What brings you to SimplyApply?",
      intro: "Your email is confirmed, so that part's done. We just need to know which side of the job hunt you're on.",
      body:
        para("<strong>Looking for work?</strong> We'll help you find jobs that fit around school.") +
        para("<strong>Hiring students?</strong> We'll match you with people who are free when you need them.") +
        para("Not sure? No worries. You can switch roles later.") +
        callout("Just pick your side", "Student or employer?", "One tap and you're on your way."),
      ctaLabel: "Finish setting up",
      ctaHref: signInUrl || `${siteUrl}/choose-role`,
      footerReason: "You're receiving this because you created an account on SimplyApply.",
      prefsPath: "",
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
    subject: name ? `${name}, welcome to Employer Pro` : "Welcome to Employer Pro",
    html: shell({
      heading: "Well, look at you. You're on Pro.",
      intro: "Your upgrade went through, and all your Pro features are ready to go.",
      body:
        leadIn("Here's what you've unlocked:") +
        steps([
          "<strong>Every location.</strong> Hiring at multiple sites? Add as many locations as you need, each matched with students nearby.",
          "<strong>Match scores.</strong> See who's the best fit for your shifts at a glance. Less guessing, better calls.",
          "<strong>The full picture.</strong> Get access to students' full profiles, including their interests, goals, and online profiles.",
          "<strong>A little head start.</strong> Your business gets priority when students are choosing between similar nearby jobs.",
        ]) +
        para("Need to manage your card, invoices, or subscription? It's all under Billing.") +
        para("And if you ever cancel, your Pro features stick around until the end of your billing period. After that, your oldest location stays live, your extras pause, and nothing gets deleted.") +
        para("For now, go find your next great hire."),
      ctaLabel: "Go to your dashboard",
      ctaHref: `${siteUrl}/employer`,
      footerReason: "You're receiving this because you started an Employer Pro subscription on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/**
 * The discount block shown in the "other" emails. Each one frames the offer
 * slightly differently, so the wording is passed in rather than fixed.
 */
function promoBlock(label: string, codeLabel: string, footnote: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px dashed #93c5fd;border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:18px 22px;text-align:center;">
      <p style="margin:0 0 10px;font-size:13px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${label}</p>
      <p style="margin:0 0 2px;font-size:12px;color:#60a5fa;">${codeLabel}</p>
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#1e40af;letter-spacing:2px;">${PROMO_CODE}</p>
      <p style="margin:0;font-size:13px;color:#1e3a8a;">${footnote}</p>
    </td></tr>
  </table>`
}

/**
 * Cancellation confirmed. Account category — always sends, because it tells
 * them when access actually stops.
 */
export function cancelConfirm({ company, endsAt }: { company?: string | null; endsAt?: string | null }) {
  const date = endsAt
    ? new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null
  return {
    subject: "Your Employer Pro cancellation is confirmed",
    html: shell({
      heading: "Got it. Your Pro subscription is cancelled.",
      intro: date
        ? `Your access stays active until ${date}, and you won't be charged again.`
        : "Your access stays active until the end of the current billing period, and you won't be charged again.",
      body:
        para("When Pro ends, you'll move back to the free plan. Your oldest location stays live, and any extra locations pause.") +
        para("The good news? We're not throwing anything away. Your setup stays right where it is, so if you come back to Pro, your paused locations can go live again.") +
        callout("What you keep", "Your free SimplyApply account", "One live location, candidate browsing, and your existing hiring pipeline.") +
        para("Thanks for giving Pro a try. You're always welcome back."),
      ctaLabel: "Manage billing",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you cancelled an Employer Pro subscription on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/** Pro has actually lapsed. Other category. */
export function proWinback({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `${name}, Pro has ended` : "Pro has ended",
    html: shell({
      heading: "Your Pro features have clocked out.",
      intro: "Your subscription has ended, so your extra locations are paused and match scores are no longer available.",
      body:
        para("But don't worry. Your setup is still here. Your locations, your information, your work so far — none of it has been deleted.") +
        para("Ready to get everything running again? Turn Pro back on, and your extra locations will reactivate.") +
        para("And if price was the sticking point, we've got something for you.") +
        promoBlock("Come back for 25% off", "Use code", "25% off your first month. One use per business."),
      ctaLabel: "Restart Employer Pro",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you had an Employer Pro subscription on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/** Repeatedly hit the paywall without subscribing. Other category. */
export function proValue({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: name ? `${name}, running into the Pro wall?` : "Running into the Pro wall?",
    html: shell({
      heading: "You've bumped into the locked features a few times.",
      intro: "We noticed. And hey, that's fair. If you're wondering whether Pro is worth it, here's the short version.",
      body:
        steps([
          "<strong>Stop guessing who's the best fit.</strong> Match scores rank students by how well they cover your shifts, so you know who to contact first.",
          "<strong>Know who you're calling.</strong> See the full student profile before you pick up the phone. More context, fewer surprises.",
          "<strong>Hire across all your locations.</strong> Add as many locations as you need, with students matched to each one.",
        ]) +
        para("And if you've been on the fence, here's a little push:") +
        promoBlock("25% off your first month", "Use code", "Enter at checkout. One use per business."),
      ctaLabel: "See what Pro costs",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you have an employer account on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}

/** Started checkout and didn't finish. Other category. */
export function checkoutAbandoned({ company }: { company?: string | null }) {
  const name = (company || "").trim()
  return {
    subject: "You were this close to Employer Pro",
    html: shell({
      heading: name ? `Hey, ${name}. We saved your spot.` : "We saved your spot.",
      intro: "You started upgrading to Employer Pro but didn't quite finish.",
      body:
        para("No worries. Nothing was charged, and your free account is still right where you left it.") +
        para("If checkout gave you trouble, just reply to this email. A real person will read it and help you sort things out.") +
        para("Still deciding? We get it. Here's 25% off your first month to make that decision a little easier.") +
        promoBlock("Your first month, 25% off", "Your discount code", "One use per business."),
      ctaLabel: "Finish upgrading",
      ctaHref: `${siteUrl}/pricing/mobile`,
      footerReason: "You're receiving this because you started an Employer Pro checkout on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
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
    subject: name ? `${name}, your payment needs a quick fix` : "Your payment needs a quick fix",
    html: shell({
      heading: "Uh-oh. Your latest payment didn't go through.",
      intro: "The card on file was declined, but don't panic. Your Pro features are still running for now.",
      body:
        para(
          retry
            ? `We'll try charging the card again on ${retry}. If you want to get ahead of it, you can update your payment details now and forget about it.`
            : "You can update your payment details now and forget about it."
        ) +
        callout(
          "What if the payment keeps failing?",
          "You'll move back to the free plan",
          "Your extra locations will pause, but nothing gets deleted. Once your payment goes through again, they can come right back."
        ),
      ctaLabel: invoiceUrl ? "Fix my payment" : "Update payment method",
      ctaHref: invoiceUrl || `${siteUrl}/pricing/mobile`,
      ctaNote: invoiceUrl ? "This link takes you to your secure Stripe invoice." : undefined,
      footerReason: "You're receiving this because you have an Employer Pro subscription on SimplyApply.",
      prefsPath: EMPLOYER_PREFS,
    }),
  }
}
