"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, Download, Bell, User, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BillingPage() {
  const [loading, setLoading] = useState(true)

  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<any>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [companyName, setCompanyName] = useState("Your Company")

  const [usage, setUsage] = useState({
    baseHires: 10,
    usedHires: 0,
    additionalHires: 0,
  })

  const projectedTotal =
    (subscription?.price || 0) + usage.additionalHires * 10

  const loadBilling = async () => {
    try {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) return

      const { data: profile } = await supabase
        .from("job")
        .select("stripe_customer_id, company")
        .eq("user_id", userId)
        .single()

      if (profile?.company) setCompanyName(profile.company)

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

  useEffect(() => {
    loadBilling()

    const url = new URL(window.location.href)
    if (url.searchParams.get("success") === "true") {
      loadBilling()
      window.history.replaceState({}, "", "/billing")
    }
  }, [])

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

  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading billing...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          {/* LEFT */}
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => (window.location.href = "/employer")}
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>

          {/* CENTER NAV */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>

            <Link href="/matching/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Find Candidates
            </Link>

            <Link href="/billing" className="text-sm font-medium text-foreground">
              Billing
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

           

            {/* PROFILE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold">
                    {companyName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/employer/profile">Company Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/">Log out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* MAIN */}
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
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            ) : (
              <Button onClick={startCheckout}>Start Subscription</Button>
            )}
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
              <p className="text-muted-foreground">No payment method</p>
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
                <div key={inv.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p>{inv.number}</p>
                    <p className="text-sm text-muted-foreground">{inv.date}</p>
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