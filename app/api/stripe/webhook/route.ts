import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe sends canceled status OR cancel_at_period_end when user cancels
function getStatus(sub: Stripe.Subscription): string {
  if (sub.status === "canceled" || sub.cancel_at_period_end || sub.ended_at) {
    return "canceled"
  }
  if (sub.status === "active" || sub.status === "trialing") {
    return "active"
  }
  return sub.status // past_due, unpaid, incomplete, etc.
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
          periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null
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

      await updateProfile(sub.id, customerId, {
        subscription_status: status,
        price_id: sub.items.data[0]?.price?.id ?? null,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
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

      await updateProfile(sub.id, customerId, {
        subscription_status: "canceled",
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      })
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}