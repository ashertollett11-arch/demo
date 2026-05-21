import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    console.log("✅ Stripe event:", event.type)

    // -------------------------
    // CHECKOUT COMPLETED
    // -------------------------
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
        .eq("user_id", userId)

      if (error) {
        console.error("❌ Supabase update error:", error)
      }
    }

    // -------------------------
    // SUBSCRIPTION DELETED
    // -------------------------
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription
    
      console.log("-------- SUB UPDATE --------")
      console.log("Subscription ID:", subscription.id)
      console.log("Customer ID:", subscription.customer)
      console.log("Status:", subscription.status)
    
      // SEE ALL ROWS
      const { data: allRows } = await supabase
        .from("job")
        .select(`
          id,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status
        `)
    
      console.log("ALL JOB ROWS:", allRows)
    
      // TEST MATCH
      const { data: matchingRows } = await supabase
        .from("job")
        .select("*")
        .eq("stripe_customer_id", subscription.customer as string)
    
      console.log("MATCHING ROWS:", matchingRows)
    
      const isCanceled =
        subscription.status === "canceled" ||
        subscription.cancel_at_period_end === true
    
      const { data: updatedRows, error } = await supabase
        .from("job")
        .update({
          subscription_status: isCanceled ? "canceled" : "active",
        })
        .eq("stripe_customer_id", subscription.customer as string)
        .select()
    
      console.log("UPDATED ROWS:", updatedRows)
    
      if (error) {
        console.error("❌ UPDATE ERROR:", error)
      }
    }

    // -------------------------
    // SUBSCRIPTION UPDATED
    // -------------------------
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
    
      console.log("🗑 Deleted subscription:", subscription.id)
    
      const { data: existing } = await supabase
        .from("job")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
    
      console.log("Matching rows:", existing)
    
      const { data: updatedRows, error } = await supabase
      .from("job")
      .update({
        subscription_status: "canceled",
      })
      .eq("stripe_customer_id", subscription.customer)
      .select()
      .eq("stripe_customer_id", subscription.customer)
      .select()
      console.log("MATCH RESULT:", updatedRows)
      console.log("Deleted rows:", deletedRows)
    
      if (error) {
        console.error("❌ Cancel update error:", error)
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