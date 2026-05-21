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
// SAFE STATUS NORMALIZER
// -------------------------
function getSubscriptionStatus(sub: Stripe.Subscription) {
  const isCanceled =
    sub.status === "canceled" ||
    sub.status === "unpaid" ||
    sub.cancel_at_period_end === true ||
    sub.ended_at !== null

  return isCanceled ? "canceled" : "active"
}

// -------------------------
// WEBHOOK ROUTE
// -------------------------
export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      )
    }

    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log("\n🔥 STRIPE EVENT:", event.type)

    // =====================================================
    // CHECKOUT COMPLETE
    // =====================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const plan = session.metadata?.plan

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id

      console.log("🧾 CHECKOUT DATA:", {
        userId,
        customerId,
        subscriptionId,
      })

      if (!userId) {
        console.error("❌ Missing userId in metadata")
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
        console.error("❌ Checkout update error:", error)
      
      }
    }

    // =====================================================
    // SUBSCRIPTION UPDATED
    // =====================================================
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription

      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : sub.customer.id

      const status = getSubscriptionStatus(sub)

      console.log("🔄 SUB UPDATED:", {
        id: sub.id,
        customerId,
        status,
        cancel_at_period_end: sub.cancel_at_period_end,
      })

      // DEBUG: show all stored customers
      const { data: all } = await supabase
        .from("job")
        .select("id, stripe_customer_id, subscription_status")

      console.log(
        "📦 ALL DB CUSTOMERS:",
        all?.map((r) => r.stripe_customer_id)
      )

      // DEBUG: check match
      const { data: match } = await supabase
        .from("job")
        .select("*")
        .eq("stripe_customer_id", customerId)

      console.log("🎯 MATCHING ROWS:", match)

      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: status,
        })
        .eq("stripe_customer_id", customerId)
        .select()

      console.log("✅ UPDATED ROWS:", data)
      console.log("SUPABASE URL:", process.env.SUPABASE_URL)
     
      console.log("EVENT TRACE:", event.type, {
        status: sub?.status,
        cancel_at_period_end: sub?.cancel_at_period_end,
      })
      if (error) {
        console.error("❌ UPDATE ERROR:", error)
      }
    }

    // =====================================================
    // SUBSCRIPTION DELETED
    // =====================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : sub.customer.id

      console.log("🗑 SUB DELETED:", {
        id: sub.id,
        customerId,
      })

      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_customer_id", customerId)
        .select()

      console.log("❌ CANCELLED ROWS:", data)

      if (error) {
        console.error("❌ CANCEL ERROR:", error)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("❌ WEBHOOK ERROR:", err.message)
    console.log("EVENT TRACE:", event.type, {
      status: sub?.status,
      cancel_at_period_end: sub?.cancel_at_period_end,
    })
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}