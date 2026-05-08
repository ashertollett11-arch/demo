import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: Request) {
  try {
    console.log("🔥 checkout route hit")

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      "https://demo-tau-lac.vercel.app"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/billing?canceled=true`,

      metadata: {
        userId,
      },
    })

    console.log("SESSION CREATED:", session.id)

    return NextResponse.json({
      url: session.url,
    })
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}