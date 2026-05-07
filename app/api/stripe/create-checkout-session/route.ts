import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json()

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
    
      line_items: [
        {
          price: "price_1TUb8vEKLeUKN8MYtVUY1YxY",
          quantity: 1,
        },
      ],
    
      metadata: {
        userId,
      },
    
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Stripe error:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}