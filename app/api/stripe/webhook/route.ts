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

// helper: normalize status safely
function getSubscriptionStatus(sub: Stripe.Subscription) {
  const isCanceled =
    sub.status === "canceled" ||
    sub.cancel_at_period_end === true ||
    sub.ended_at !== null

  return isCanceled ? "canceled" : "active"
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature")
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log("🔥 Stripe event:", event.type)

    // -----------------------------
    // CHECKOUT COMPLETE (INITIAL SAVE)
    // -----------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const plan = session.metadata?.plan

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (!userId) {
        console.error("Missing userId in metadata")
        return NextResponse.json({ received: true })
      }

      const { error } = await supabase
        .from("job")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          plan: plan || "unknown",
        })
        .eq("user_id", userId)

      if (error) {
        console.error("❌ Checkout DB update error:", error)
      }
    }

    // -----------------------------
    // SUBSCRIPTION UPDATED
    // (ONLY REFLECT CURRENT STATE)
    // -----------------------------
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription

      const status = getSubscriptionStatus(sub)

      console.log("🔄 Subscription updated:", {
        id: sub.id,
        status,
        cancel_at_period_end: sub.cancel_at_period_end,
      })

      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: status,
        })
        .eq("stripe_customer_id", sub.customer as string)
        .select()

      console.log("UPDATED ROWS:", data)

      if (error) {
        console.error("❌ Update error:", error)
      }
    }

    // -----------------------------
    // SUBSCRIPTION DELETED
    // (FINAL SOURCE OF TRUTH = ALWAYS CANCEL)
    // -----------------------------
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      console.log("🗑 Subscription deleted:", sub.id)

      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_customer_id", sub.customer as string)
        .select()

      console.log("CANCELLED ROWS:", data)

      if (error) {
        console.error("❌ Delete error:", error)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("❌ Webhook crash:", err.message)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}