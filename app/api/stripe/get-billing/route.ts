import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: Request) {
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing customerId" },
        { status: 400 }
      )
    }

    // -------------------------
    // 1. Get subscriptions
    // -------------------------
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    })

    const subscription = subscriptions.data[0]

    // -------------------------
    // 2. Get invoices
    // -------------------------
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    })
    export async function POST(req: Request) {
        try {
          console.log("🔥 get-billing hit")
      
          const { customerId } = await req.json()
          console.log("customerId:", customerId)
      
          if (!customerId) {
            console.log("❌ missing customerId")
            return NextResponse.json({ error: "Missing customerId" }, { status: 400 })
          }
      
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
          })
      
          console.log("subscriptions fetched")
      
          return NextResponse.json({
            subscription: null,
            invoices: [],
            paymentMethod: null,
            usage: {
              baseHires: 10,
              usedHires: 0,
              additionalHires: 0,
            },
          })
        } catch (err) {
          console.error("🔥 Stripe billing error:", err)
      
          return NextResponse.json(
            { error: "Failed to load billing" },
            { status: 500 }
          )
        }
      }
    // -------------------------
    // 3. Get payment method
    // -------------------------
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })

    const paymentMethod = paymentMethods.data?.[0] ?? null
    // -------------------------
    // 4. Format response
    // -------------------------
    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            name: subscription.items.data[0]?.price.nickname || "Pro Plan",
            price: subscription.items.data[0]?.price.unit_amount
              ? subscription.items.data[0].price.unit_amount / 100
              : 0,
          }
        : null,

      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.total / 100,
        date: new Date(inv.created * 1000).toLocaleDateString(),
        pdf: inv.hosted_invoice_url,
      })),

      paymentMethod: paymentMethod
        ? {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
          }
        : null,

      // 🔥 THIS is your custom logic (you define it)
      usage: {
        baseHires: 10,
        usedHires: 3,
        additionalHires: 0,
      },
    })
  } catch (err: any) {
    console.error("Stripe billing error:", err)

    return NextResponse.json(
      { error: "Failed to load billing" },
      { status: 500 }
    )
  }
}