"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Settings,
  LogOut,
  Building2,
  Bell,
  ChevronDown,
  Receipt,
  TrendingUp,
} from "lucide-react"
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

  const [usage, setUsage] = useState({
    baseHires: 10,
    usedHires: 0,
    additionalHires: 0,
  })

  const projectedTotal =
    (subscription?.price || 0) + usage.additionalHires * 10

  // -------------------------
  // LOAD STRIPE DATA
  // -------------------------
  useEffect(() => {
    const loadBilling = async () => {
      try {
        setLoading(true)
    
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
    
        if (!userId) {
          setLoading(false)
          return
        }
    
        const { data: profile, error } = await supabase
          .from("job")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .single()
    
        if (error || !profile?.stripe_customer_id) {
          console.log("No Stripe customer:", error)
          setLoading(false)
          return
        }
    
        const res = await fetch("/api/stripe/get-billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: profile.stripe_customer_id,
          }),
        })
    
        if (!res.ok) {
          console.log("Stripe API failed")
          setLoading(false)
          return
        }
    
        const data = await res.json()
    
        setSubscription(data.subscription ?? null)
        setInvoices(data.invoices ?? [])
        setPaymentMethod(data.paymentMethod ?? null)
        setUsage(data.usage ?? {
          baseHires: 10,
          usedHires: 0,
          additionalHires: 0,
        })
    
      } catch (err) {
        console.error("Billing load error:", err)
      } finally {
        setLoading(false) // ✅ ALWAYS runs
      }
    }
    loadBilling()
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
      }),
    })
  
    const data = await res.json()
  
    window.location.href = data.url
  }

  // -------------------------
  // LOADING STATE
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/employer">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>

            <h1 className="text-lg font-semibold">Billing</h1>
          </div>

          <Button variant="outline" onClick={openCustomerPortal}>
            Manage Billing
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your Stripe subscription and invoices
          </p>
        </div>

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

            {!subscription ? (
  <div className="flex gap-2">
    <Button onClick={startCheckout}>
      Start Subscription
    </Button>

    <Button
      variant="outline"
      onClick={startCheckout}
    >
      Upgrade Now
    </Button>
  </div>
) : (
  <div className="flex items-center gap-3">
    <Badge className="bg-green-100 text-green-700">
      Active
    </Badge>

    <Button variant="outline" onClick={startCheckout}>
      Upgrade Plan
    </Button>
  </div>
)}
          </CardContent>
        </Card>

        {/* USAGE */}
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Used hires</p>
              <p className="text-xl font-bold">
                {usage.usedHires}/{usage.baseHires}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">
                Additional hires
              </p>
              <p className="text-xl font-bold">
                {usage.additionalHires}
              </p>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Estimated total
              </p>
              <p className="text-xl font-bold text-primary">
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
              <div className="flex justify-between items-center">
                <p>
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </p>

                <Button variant="outline" onClick={openCustomerPortal}>
                  Update
                </Button>
              </div>
            ) : (
              <Button onClick={openCustomerPortal}>
                Add Payment Method
              </Button>
            )}
          </CardContent>
        </Card>

        {/* INVOICES */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground">
                No invoices yet
              </p>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p>${inv.amount}</p>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        window.open(inv.pdf, "_blank")
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CANCEL */}
        <Card className="border-red-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="font-semibold">Cancel subscription</p>
              <p className="text-sm text-muted-foreground">
                You will lose access to premium features
              </p>
            </div>

            <Button variant="destructive" onClick={openCustomerPortal}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}