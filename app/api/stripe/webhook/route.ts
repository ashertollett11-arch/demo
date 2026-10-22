import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { proWelcome, cancelConfirm, proWinback, checkoutAbandoned, paymentFailed } from "@/lib/emails/templates"
import { claimEmail, releaseEmail } from "@/lib/emails/claim"
import { canEmail, PREF_COLUMNS, type EmailCategory } from "@/lib/emails/prefs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe sends canceled status OR cancel_at_period_end when user cancels
function getStatus(sub: Stripe.Subscription): string {
  // A lapsed Pro drops to the free tier, not "canceled" — "canceled" fails
  // hasEmployerAccess() and would lock them out of the employer area entirely.
  // cancel_at_period_end is deliberately NOT treated as ended: they have paid
  // through the period and keep Pro until Stripe actually ends the sub.
  if (sub.status === "canceled" || sub.ended_at) {
    return "freeactive"
  }
  if (sub.status === "past_due" || sub.status === "unpaid") {
    return "past_due"
  }
  if (sub.status === "active" || sub.status === "trialing") {
    return "active"
  }
  return sub.status
}

// Update profile by subscription ID, fall back to customer ID if no row matched
async function updateProfile(
  subId: string,
  customerId: string,
  fields: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("stripe_subscription_id", subId)
    .select()

  if (error) {
    console.error("DB UPDATE ERROR (by sub id):", error)
    return
  }

  if (!data || data.length === 0) {
    console.warn(`No profile found for sub ${subId}, retrying with customer ID ${customerId}`)
    const { data: data2, error: error2 } = await supabase
      .from("profiles")
      .update({ ...fields, stripe_subscription_id: subId })
      .eq("stripe_customer_id", customerId)
      .select()

    if (error2) console.error("DB UPDATE ERROR (by customer id):", error2)
    else console.log("UPDATED (by customer id):", data2)
  } else {
    console.log("UPDATED (by sub id):", data)
  }
}



/**
 * Period end, wherever this API version puts it.
 *
 * Stripe moved current_period_end off the subscription and onto its items in
 * 2025. The webhook endpoint's own API version decides the shape we receive,
 * which can differ from the version this SDK is pinned to — so read both and
 * take whichever exists.
 */
function periodEndISO(sub: Stripe.Subscription): string | null {
  const fromSub = (sub as any).current_period_end as number | undefined
  const fromItem = sub.items?.data?.[0]
    ? ((sub.items.data[0] as any).current_period_end as number | undefined)
    : undefined
  const unix = fromSub ?? fromItem
  return unix ? new Date(unix * 1000).toISOString() : null
}

const FROM = "SimplyApply <noreply@simplyapply.app>"

/**
 * Sends one lifecycle email, once. Never throws: a non-2xx from this webhook
 * makes Stripe retry the whole handler, and the unique (user_id, kind) row is
 * what actually prevents a retry sending twice.
 */
async function sendOnce(
  supabase: any,
  userId: string,
  kind: string,
  category: EmailCategory,
  build: (company?: string | null) => { subject: string; html: string }
) {
  try {
    const { data: already } = await supabase
      .from("onboarding_emails").select("id").eq("user_id", userId).eq("kind", kind).maybeSingle()
    if (already) return

    const { data: profile } = await supabase
      .from("profiles").select(`email, subscription_status, ${PREF_COLUMNS}`).eq("id", userId).maybeSingle()
    if (!canEmail(profile, category)) return

    // Nothing in the sales category should ever reach someone who is already
    // paying. Account emails are exempt: those are about their subscription.
    if (category === "other" && profile?.subscription_status === "active") {
      console.log(`${kind}: skipped, already subscribed`)
      return
    }

    const { data: job } = await supabase
      .from("job").select("company, email").eq("user_id", userId).maybeSingle()

    const to = job?.email || profile?.email || null
    if (!to) { console.warn(`${kind}: no address for`, userId); return }

    const mail = build(job?.company)

    // Claim before sending. The `already` check above saves the work in the
    // common case; this is what makes it exactly-once under a retried or
    // interrupted webhook.
    if (!(await claimEmail(supabase, userId, kind))) return

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM, to, subject: mail.subject, html: mail.html,
    })
    if (error) {
      console.error(`${kind} SEND ERROR:`, error.message)
      await releaseEmail(supabase, userId, kind)
      return
    }
  } catch (e: any) {
    console.error(`${kind} ERROR:`, e.message)
  }
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature")
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
    }

    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log("🔥 WEBHOOK EVENT:", event.type)

    // =====================================================
    // CHECKOUT COMPLETE — first time a user subscribes
    // =====================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id

      console.log("CHECKOUT COMPLETE:", { userId, customerId, subscriptionId })

      if (!userId) {
        console.error("No userId in session metadata")
        return NextResponse.json({ received: true })
      }

      // Fetch full subscription for period end + price
      let periodEnd: string | null = null
      let priceId: string | null = null
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          periodEnd = periodEndISO(sub)
          priceId = sub.items.data[0]?.price?.id ?? null
        } catch (e) {
          console.warn("Could not retrieve subscription:", e)
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          price_id: priceId,
          current_period_end: periodEnd,
        })
        .eq("id", userId)

      if (error) console.error("CHECKOUT DB ERROR:", error)

      await sendOnce(supabase, userId, "pro_welcome", "account", (company) => proWelcome({ company }))
    }

    // =====================================================
    // SUBSCRIPTION UPDATED
    // Fires when: plan changes, cancel_at_period_end set, payment fails, etc.
    // =====================================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id
      const status = getStatus(sub)

      console.log("SUB UPDATED:", { id: sub.id, status, cancel_at_period_end: sub.cancel_at_period_end })

      // Cancellation requested: Pro runs to the end of the period, so confirm
      // now and leave the win-back for when it actually lapses.
      if (sub.cancel_at_period_end) {
        const { data: row } = await supabase
          .from("profiles").select("id").eq("stripe_subscription_id", sub.id).maybeSingle()
        const endsAt = periodEndISO(sub)
        if (row?.id) {
          await sendOnce(supabase, row.id, "cancel_confirm", "account",
            (company) => cancelConfirm({ company, endsAt }))
        }
      }

      await updateProfile(sub.id, customerId, {
        subscription_status: status,
        price_id: sub.items.data[0]?.price?.id ?? null,
        current_period_end: periodEndISO(sub),
      })
    }

    // =====================================================
    // SUBSCRIPTION DELETED
    // Fires at end of billing period after cancel_at_period_end
    // =====================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id

      console.log("SUB DELETED:", { id: sub.id, customerId })

      const { data: lapsed } = await supabase
        .from("profiles").select("id").eq("stripe_subscription_id", sub.id).maybeSingle()

      await updateProfile(sub.id, customerId, {
        subscription_status: "freeactive",
        current_period_end: periodEndISO(sub),
      })

      // Sent after the downgrade, not before: the sales-category guard reads
      // subscription_status, and this row is still "active" until the line
      // above runs.
      if (lapsed?.id) {
        await sendOnce(supabase, lapsed.id, "winback", "other", (company) => proWinback({ company }))
      }
    }

    // =====================================================
    // PAYMENT FAILED — a renewal was declined
    // =====================================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice

      // Stripe retries a failed invoice several times and fires this event on
      // each attempt. Only the first one is worth an email — the rest would
      // just be the same message again while they're already dealing with it.
      const firstAttempt = (invoice.attempt_count ?? 1) <= 1

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id

      if (firstAttempt && customerId) {
        // This one is NOT routed through sendOnce: a card can fail again
        // months later, and the once-per-kind record would suppress it.
        try {
          const { data: profile } = await supabase
            .from("profiles").select("id, email").eq("stripe_customer_id", customerId).maybeSingle()

          if (profile?.id) {
            const { data: job } = await supabase
              .from("job").select("company, email").eq("user_id", profile.id).maybeSingle()
            const to = job?.email || profile.email

            if (to) {
              const next = (invoice as any).next_payment_attempt as number | undefined
              const mail = paymentFailed({
                company: job?.company,
                invoiceUrl: invoice.hosted_invoice_url,
                nextAttempt: next ? new Date(next * 1000).toISOString() : null,
              })
              const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
                from: FROM, to, subject: mail.subject, html: mail.html,
              })
              if (error) console.error("PAYMENT FAILED SEND ERROR:", error.message)
            } else {
              console.warn("payment_failed: no address for", profile.id)
            }
          } else {
            console.warn("payment_failed: no profile for customer", customerId)
          }
        } catch (e: any) {
          console.error("PAYMENT FAILED ERROR:", e.message)
        }
      }
    }

    // =====================================================
    // CHECKOUT EXPIRED — started an upgrade and never finished
    // =====================================================
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId) {
        // Stripe never expires a completed session, but someone can abandon
        // one session and buy on a second. The first then expires afterwards,
        // which would send "you were one step away" to a paying customer.
        const { data: profile } = await supabase
          .from("profiles").select("subscription_status").eq("id", userId).maybeSingle()

        if (profile?.subscription_status === "active") {
          console.log("checkout_abandoned: skipped, already subscribed", userId)
        } else {
          await sendOnce(supabase, userId, "checkout_abandoned", "other",
            (company) => checkoutAbandoned({ company }))
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}