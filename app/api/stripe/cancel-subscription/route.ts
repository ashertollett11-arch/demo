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

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Get the customer ID from Supabase
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 })
    }

    // Fetch the CURRENT active subscription directly from Stripe
    // This avoids using a stale subscription ID from the DB
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    })

    const activeSubscription = subscriptions.data[0]

    if (!activeSubscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    // Cancel at end of billing period
    const subscription = await stripe.subscriptions.update(activeSubscription.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ success: true, subscription })
  } catch (err: any) {
    console.error("CANCEL SUBSCRIPTION ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}