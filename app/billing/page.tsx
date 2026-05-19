"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BillingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [companyName, setCompanyName] = useState("Company")

  // -------------------------
  // AUTH CHECK
  // -------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.replace("/login")
      }
    }

    checkAuth()
  }, [router])

  // -------------------------
  // LOAD SUBSCRIPTION
  // -------------------------
  const loadBilling = async () => {
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("job")
      .select("stripe_customer_id, company")
      .eq("user_id", userId)
      .single()

    if (profile?.company) setCompanyName(profile.company)

    if (!profile?.stripe_customer_id) {
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

    const data = await res.json()

    setSubscription(data.subscription || null)
    setLoading(false)
  }

  useEffect(() => {
    loadBilling()
  }, [])

  // -------------------------
  // START CHECKOUT
  // -------------------------
  const startCheckout = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
  
    if (!userId) {
      console.error("No user logged in")
      return
    }
  
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })
  
    const data = await res.json()
  
    console.log("RAW RESPONSE:", data)
  
    if (!data?.url) {
      console.error("Stripe error:", data)
      return
    }
  
    window.location.href = data.url
  }
  // -------------------------
  // CUSTOMER PORTAL
  // -------------------------
  const openPortal = async () => {
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    })

    const data = await res.json()

    if (!data?.url) {
      console.error("Portal error:", data)
      return
    }

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

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        Billing
      </h1>

      {/* PLAN CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              {subscription?.name || "No Active Plan"}
            </p>

            <p className="text-sm text-muted-foreground">
              {subscription?.price ? `$${subscription.price}/month` : "Free"}
            </p>
          </div>

          {subscription ? (
            <Badge className="bg-green-100 text-green-700">
              Active
            </Badge>
          ) : (
            <Button onClick={startCheckout}>
              Subscribe
            </Button>
          )}
        </CardContent>
      </Card>

      {/* PORTAL */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
        </CardHeader>

        <CardContent>
          <Button variant="outline" onClick={openPortal}>
            Open Billing Portal
          </Button>

          <p className="text-xs text-muted-foreground mt-2">
            Update payment method or cancel subscription
          </p>
        </CardContent>
      </Card>

      {/* BACK */}
      <Link
        href="/employer"
        className="text-sm text-muted-foreground hover:text-black"
      >
        ← Back to dashboard
      </Link>

    </div>
  )
}