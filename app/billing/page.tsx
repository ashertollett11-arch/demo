"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BillingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [companyName, setCompanyName] = useState("Company")
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)

  // -------------------------
  // AUTH CHECK
  // -------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.replace("/login")
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
      .select("stripe_customer_id, stripe_subscription_id, subscription_status, company")
      .eq("user_id", userId)
      .single()

    if (profile?.company) setCompanyName(profile.company)
    if (profile?.stripe_subscription_id) setSubscriptionId(profile.stripe_subscription_id)

    if (!profile?.stripe_customer_id) {
      toast.error("Please set up billing to continue using employer features.")
      setLoading(false)
      return
    }

    const res = await fetch("/api/stripe/get-billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: profile.stripe_customer_id }),
    })

    const data = await res.json()

    if (profile.subscription_status !== "active") {
      toast.error("Please set up billing to continue using employer features.")
    }

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

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    if (!data.url) {
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
  // CANCEL SUBSCRIPTION
  // -------------------------
  const cancelSubscription = async () => {
    if (!subscriptionId) {
      toast.error("No active subscription found.")
      return
    }

    setCanceling(true)
    setShowConfirm(false)

    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to cancel subscription.")
        return
      }

      toast.success("Subscription canceled. You'll have access until the end of your billing period.")
      // Refresh billing info to reflect new status
      await loadBilling()
    } catch (err) {
      console.error("Cancel error:", err)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setCanceling(false)
    }
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

  const isCanceled = subscription?.status === "canceled" || !subscription

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

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
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          ) : (
            <Button onClick={startCheckout}>Subscribe</Button>
          )}
        </CardContent>
      </Card>

      {/* PORTAL */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" onClick={openPortal}>
              Open Billing Portal
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Update payment method or manage your plan
            </p>
          </div>

          {/* CANCEL SECTION — only show if there's an active subscription */}
          {subscription && !isCanceled && (
            <div className="border-t pt-4">
              {!showConfirm ? (
                <div>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-0"
                    onClick={() => setShowConfirm(true)}
                  >
                    Cancel Subscription
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll keep access until the end of your current billing period.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to cancel?
                  </p>
                  <p className="text-xs text-red-600">
                    Your subscription will remain active until the end of the billing period, then your account will be downgraded.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={cancelSubscription}
                      disabled={canceling}
                    >
                      {canceling ? "Canceling..." : "Yes, cancel my subscription"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowConfirm(false)}
                      disabled={canceling}
                    >
                      Keep my subscription
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BACK */}
      <div className="flex items-center gap-4">
        <Link href="/employer" className="text-sm text-muted-foreground hover:text-black">
          ← Back to dashboard
        </Link>
        <Link href="/employer/profile" className="text-sm text-muted-foreground hover:text-black">
          ← Go to profile
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-black">
          ← Log out
        </Link>
      </div>
    </div>
  )
}