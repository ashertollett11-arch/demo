import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing?canceled=true`,

      // 🔥 THIS is what connects Stripe → Supabase later
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Checkout error:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}