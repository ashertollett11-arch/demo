"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, Download } from "lucide-react"

export default function BillingPage() {
  const [loading, setLoading] = useState(true)

  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<any>(null)

  const [usage, setUsage] = useState({
    baseHires: 10,
    usedHires: 0,
    additionalHires: 0,
  })

  const projectedTotal =
    (subscription?.price || 0) + usage.additionalHires * 10

  // -------------------------
  // LOAD BILLING
  // -------------------------
  const loadBilling = async () => {
    try {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) return

      const { data: profile } = await supabase
        .from("job")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .single()

      if (!profile?.stripe_customer_id) return

      const res = await fetch("/api/stripe/get-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
        }),
      })

      const data = await res.json()

      setSubscription(data.subscription ?? null)
      setInvoices(data.invoices ?? [])
      setPaymentMethod(data.paymentMethod ?? null)
      setUsage(data.usage ?? usage)
    } catch (err) {
      console.error("Billing load error:", err)
    } finally {
      setLoading(false)
    }
  }

  // -------------------------
  // INIT
  // -------------------------
  useEffect(() => {
    loadBilling()

    // refresh after Stripe redirect
    const url = new URL(window.location.href)
    if (url.searchParams.get("success") === "true") {
      loadBilling()
      window.history.replaceState({}, "", "/billing")
    }
  }, [])

  // -------------------------
  // STRIPE ACTIONS
  // -------------------------
  const openCustomerPortal = async () => {
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    })

    const data = await res.json()
    window.location.href = data.url
  }

  const startCheckout = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    window.location.href = data.url
  }

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading billing...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b p-4 flex justify-between">
        <Link href="/employer">
          <Button variant="ghost">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Button onClick={openCustomerPortal} variant="outline">
          Manage Billing
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* PLAN */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>

          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-xl font-bold">
                {subscription?.name || "No active plan"}
              </p>
              <p className="text-muted-foreground">
                ${subscription?.price || 0}/month
              </p>
            </div>

            {subscription ? (
              <Badge className="bg-green-100 text-green-700">
                Active
              </Badge>
            ) : (
              <Button onClick={startCheckout}>
                Start Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        {/* USAGE */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-xl">
              <p>Used</p>
              <p className="font-bold">
                {usage.usedHires}/{usage.baseHires}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-xl">
              <p>Extra</p>
              <p className="font-bold">{usage.additionalHires}</p>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl">
              <p>Total</p>
              <p className="font-bold text-primary">
                ${projectedTotal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PAYMENT METHOD */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>

          <CardContent>
            {paymentMethod ? (
              <p>
                {paymentMethod.brand} •••• {paymentMethod.last4}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No payment method
              </p>
            )}
          </CardContent>
        </Card>

        {/* INVOICES */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>

          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices</p>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between py-2 border-b"
                >
                  <div>
                    <p>{inv.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.date}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <p>${inv.amount}</p>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(inv.pdf, "_blank")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}