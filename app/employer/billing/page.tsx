"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Profile = {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  current_period_end: string | null
  price_id: string | null
}

export default function BillingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  // -------------------------
  // LOAD USER + PROFILE
  // -------------------------
  const loadBilling = async () => {
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      router.replace("/login")
      return
    }

    setUserId(user.id)
    setEmail(user.email ?? null)

    const { data, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, price_id")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("PROFILE LOAD ERROR:", error)
      toast.error("Failed to load billing info.")
      setLoading(false)
      return
    }

    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    loadBilling()
  }, [])

  // -------------------------
  // START CHECKOUT
  // -------------------------
  const startCheckout = async () => {
    if (!userId) return

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    })

    const data = await res.json()

    if (!res.ok || !data.url) {
      toast.error(data.error || "Failed to start checkout.")
      return
    }

    window.location.href = data.url
  }

  // -------------------------
  // OPEN CUSTOMER PORTAL
  // -------------------------
  const openPortal = async () => {
    if (!userId) return

    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()

    if (!res.ok || !data.url) {
      toast.error(data.error || "Failed to open billing portal.")
      return
    }

    window.location.href = data.url
  }

  // -------------------------
  // CANCEL SUBSCRIPTION
  // -------------------------
  const cancelSubscription = async () => {
    if (!profile?.stripe_subscription_id) {
      toast.error("No active subscription found.")
      return
    }

    setCanceling(true)
    setShowConfirm(false)

    const res = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: profile.stripe_subscription_id }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      toast.error(data.error || "Failed to cancel subscription.")
      setCanceling(false)
      return
    }

    toast.success("Subscription canceled. You'll keep access until the end of your billing period.")
    await loadBilling()
    setCanceling(false)
  }

  // -------------------------
  // HELPERS
  // -------------------------
  const isActive = profile?.subscription_status === "active"
  const isCanceled = profile?.subscription_status === "canceled"

  const periodEndFormatted = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

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
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {isActive ? "Pro Plan" : "No Active Plan"}
            </p>

            {isActive && periodEndFormatted && (
              <p className="text-sm text-muted-foreground">
                {isCanceled
                  ? `Access until ${periodEndFormatted}`
                  : `Renews ${periodEndFormatted}`}
              </p>
            )}

            {!isActive && (
              <p className="text-sm text-muted-foreground">
                Subscribe to access employer features.
              </p>
            )}
          </div>

          {isActive ? (
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          ) : isCanceled ? (
            <Badge className="bg-yellow-100 text-yellow-700">Canceled</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
          )}
        </CardContent>
      </Card>

      {/* SUBSCRIBE — only show if no active subscription */}
      {!isActive && !isCanceled && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={startCheckout}>
              Subscribe — $9.99/month
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Billed monthly. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      )}

      {/* MANAGE — only show if active */}
      {isActive && (
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
                Update payment method or download invoices.
              </p>
            </div>

            {/* CANCEL SECTION */}
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
                    You'll keep access until the end of your billing period.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to cancel?
                  </p>
                  <p className="text-xs text-red-600">
                    Your subscription stays active until {periodEndFormatted ?? "the end of your billing period"}, then your account will be downgraded.
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
          </CardContent>
        </Card>
      )}

      {/* RESUBSCRIBE — show if canceled */}
      {isCanceled && (
        <Card>
          <CardHeader>
            <CardTitle>Resubscribe</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={startCheckout}>
              Resubscribe
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Your account will be reactivated immediately.
            </p>
          </CardContent>
        </Card>
      )}

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