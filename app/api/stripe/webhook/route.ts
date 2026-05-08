import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

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
    return new NextResponse("Webhook Error", { status: 400 })
  }

  // -------------------------
  // HANDLE EVENTS
  // -------------------------

  switch (event.type) {
    case "checkout.session.completed":
      console.log("✅ Checkout completed")
      break

    case "customer.subscription.created":
      console.log("✅ Subscription created")
      break

    case "customer.subscription.deleted":
      console.log("❌ Subscription canceled")
      break

    case "invoice.paid":
      console.log("💰 Invoice paid")
      break

    default:
      console.log("Unhandled event:", event.type)
  }

  return NextResponse.json({ received: true })
}