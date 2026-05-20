import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

// Admin Supabase client (IMPORTANT: service role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // 1. Get Stripe signature
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      )
    }

    // 2. Raw body is REQUIRED for Stripe webhooks
    const body = await req.text()

    // 3. Verify event
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log("✅ Stripe event:", event.type)

    // 4. Handle checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
    
      const plan = session.metadata?.plan
      const userId = session.metadata?.userId
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
        .eq("user_id", userId)   // ✅ THIS is the correct key here
    
      if (error) {
        console.error("❌ Supabase update error:", error)
      }
    }

    // 5. Optional: handle subscription updates
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription

      const customerId = subscription.customer as string

      const { error } = await supabase
        .from("job")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_subscription_id", subscription.id)
        .or(`stripe_customer_id.eq.${subscription.customer}`)      if (error) {
        console.error("❌ Cancel update error:", error)
      }
    }
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription
    
      console.log("-------- SUB UPDATE --------")
      console.log("Subscription ID:", subscription.id)
      console.log("Customer ID:", subscription.customer)
      console.log("Status:", subscription.status)
      console.log("Cancel at period end:", subscription.cancel_at_period_end)
    
      const isCanceled =
        subscription.cancel_at_period_end === true ||
        subscription.status === "canceled"
    
      const { data, error } = await supabase
        .from("job")
        .update({
          subscription_status: isCanceled ? "canceled" : "active",
        })
        .eq("stripe_subscription_id", subscription.id)
        .select()
    
      console.log("Updated rows:", data)
    
      if (error) {
        console.error("❌ Subscription update error:", error)
      }
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}