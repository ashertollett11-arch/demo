import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()

  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature error:", err.message)

    return new NextResponse("Webhook Error", {
      status: 400,
    })
  }

  // =========================================
  // CHECKOUT COMPLETED
  // =========================================

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    console.log("✅ Checkout completed")

    const userId = session.metadata?.userId

    if (!userId) {
      console.log("❌ No userId found")
      return NextResponse.json({ received: true })
    }

    // save Stripe info into Supabase
    const { error } = await supabase
      .from("job")
      .update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_status: "active",
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Supabase update error:", error)
    } else {
      console.log("✅ Supabase updated")
    }
  }

  // =========================================
  // SUBSCRIPTION CANCELED
  // =========================================

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription

    await supabase
      .from("job")
      .update({
        subscription_status: "canceled",
      })
      .eq("stripe_subscription_id", subscription.id)

    console.log("❌ Subscription canceled")
  }

  return NextResponse.json({
    received: true,
  })
}