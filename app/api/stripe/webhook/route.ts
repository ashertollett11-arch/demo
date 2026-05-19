import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

// server-side supabase (IMPORTANT: use service role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get("stripe-signature")

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature error:", err.message)
    return new NextResponse("Webhook Error", { status: 400 })
  }

  // =========================
  // 1. Checkout completed
  // =========================
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!userId) {
      console.error("Missing userId in metadata")
      return NextResponse.json({ ok: false })
    }

    await supabase
      .from("job")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
      })
      .eq("user_id", userId)
  }

  // =========================
  // 2. Subscription updated
  // =========================
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription

    await supabase
      .from("job")
      .update({
        subscription_status: sub.status,
      })
      .eq("stripe_subscription_id", sub.id)
  }

  // =========================
  // 3. Subscription deleted/canceled
  // =========================
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription

    await supabase
      .from("job")
      .update({
        subscription_status: "canceled",
      })
      .eq("stripe_subscription_id", sub.id)
  }

  return NextResponse.json({ received: true })
}