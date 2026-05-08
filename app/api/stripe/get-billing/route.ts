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
    // Subscription
    // -------------------------
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    })

    const subscription = subscriptions.data[0]

    // -------------------------
    // Invoices
    // -------------------------
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    })

    // -------------------------
    // Payment method
    // -------------------------
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })

    const paymentMethod = paymentMethods.data[0]

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            name:
              subscription.items.data[0]?.price?.nickname ||
              "Active Plan",
            price:
              (subscription.items.data[0]?.price?.unit_amount ?? 0) /
              100,
            status: subscription.status,
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

      usage: {
        baseHires: 10,
        usedHires: 0,
        additionalHires: 0,
      },
    })
  } catch (err: any) {
    console.error("Billing error:", err)

    return NextResponse.json(
      { error: "Failed to load billing" },
      { status: 500 }
    )
  }
}