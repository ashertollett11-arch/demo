import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCaller } from "@/lib/apiAuth"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // Acting user comes from the verified token, never the request body.
    const caller = await getCaller(req)

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId, email } = caller

    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 })
    }

    // Reuse existing Stripe customer if we already have one
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      })
      customerId = customer.id

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // lets the discount code from the lifecycle emails be entered
      allow_promotion_codes: true,
      // 30 minutes is Stripe's minimum. A session only expires if it was never
      // completed, so this controls how soon the abandoned-checkout email can
      // fire — not whether it fires for people who paid.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing/mobile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing/mobile?canceled=true`,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("CREATE CHECKOUT ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}