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

      const { error } = await supabase
        .from("job")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
        })
        .eq("user_id", userId)

      if (error) console.error("CHECKOUT ERROR:", error)
    }

    // =====================================================
    // SUB UPDATED (SOURCE OF TRUTH)
    // =====================================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription

      const status = getStatus(sub)

      console.log("SUB UPDATE:", {
        id: sub.id,
        status,
      })

      const { data, error } = await supabase
        .from("job")
        .update({
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
          subscription_status: status,
        })
        .eq("stripe_subscription_id", sub.id)
        .select()

      console.log("UPDATED:", data)

      if (error) console.error("UPDATE ERROR:", error)
    }

    // =====================================================
    // SUB DELETED
    // =====================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_subscription_id", sub.id)
        .select()

      console.log("CANCELED:", data)

      if (error) console.error("DELETE ERROR:", error)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}