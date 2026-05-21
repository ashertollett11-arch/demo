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

// -------------------------
function getStatus(sub: Stripe.Subscription) {
  return sub.status === "canceled" ||
    sub.cancel_at_period_end ||
    sub.ended_at
    ? "canceled"
    : "active"
}

// Shared helper: update by subscription ID, fall back to customer ID if no rows matched
async function updateSubscriptionRow(
  subId: string,
  customerId: string,
  fields: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("job")
    .update(fields)
    .eq("stripe_subscription_id", subId)
    .select()

  if (error) {
    console.error("DB UPDATE ERROR (by sub id):", error)
    return
  }

  if (!data || data.length === 0) {
    // No row matched the subscription ID — fall back to customer ID
    console.warn(`No row found for sub ${subId}, retrying with customer ID ${customerId}`)
    const { data: data2, error: error2 } = await supabase
      .from("job")
      .update({ ...fields, stripe_subscription_id: subId })
      .eq("stripe_customer_id", customerId)
      .select()

    if (error2) console.error("DB UPDATE ERROR (by customer id):", error2)
    else console.log("UPDATED (by customer id):", data2)
  } else {
    console.log("UPDATED (by sub id):", data)
  }
}

// -------------------------
export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature")
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log("🔥 EVENT:", event.type)

    // =====================================================
    // CHECKOUT COMPLETE
    // =====================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id

      console.log("CHECKOUT:", { userId, customerId, subscriptionId })

      if (!userId) return NextResponse.json({ received: true })

      // Fetch the full subscription so we can store period end + plan
      let periodEnd: string | null = null
      let plan: string | null = null
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null
          plan = sub.items.data[0]?.price?.id ?? null
        } catch (e) {
          console.warn("Could not fetch subscription for checkout:", e)
        }
      }

      const { error } = await supabase
        .from("job")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          current_period_end: periodEnd,
          plan,
        })
        .eq("user_id", userId)

      if (error) console.error("CHECKOUT ERROR:", error)
    }

    // =====================================================
    // SUB UPDATED — fires when cancel_at_period_end is set
    // This is the event you get when a user "cancels" before period ends
    // =====================================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription

      const status = getStatus(sub)
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id

      console.log("SUB UPDATE:", { id: sub.id, status, cancel_at_period_end: sub.cancel_at_period_end })

      await updateSubscriptionRow(sub.id, customerId, {
        stripe_customer_id: customerId,
        subscription_status: status,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        plan: sub.items.data[0]?.price?.id ?? null,
      })
    }

    // =====================================================
    // SUB DELETED — fires at end of billing period after cancel
    // =====================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id

      console.log("SUB DELETED:", { id: sub.id, customerId })

      await updateSubscriptionRow(sub.id, customerId, {
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