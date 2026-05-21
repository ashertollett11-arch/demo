import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 })
    }

    // Cancels at end of current billing period — user keeps access until then.
    // To cancel immediately instead, use: stripe.subscriptions.cancel(subscriptionId)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ success: true, subscription })
  } catch (err: any) {
    console.error("CANCEL SUBSCRIPTION ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}