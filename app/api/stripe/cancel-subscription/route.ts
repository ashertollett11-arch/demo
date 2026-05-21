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
 
    // cancel_at_period_end: true means they keep access until billing period ends.
    // This fires customer.subscription.updated with cancel_at_period_end: true,
    // which your webhook catches and sets subscription_status = "canceled".
    //
    // If you want to cut off access immediately, replace with:
    //   await stripe.subscriptions.cancel(subscriptionId)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
 
    return NextResponse.json({ success: true, subscription })
  } catch (err: any) {
    console.error("CANCEL SUBSCRIPTION ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}