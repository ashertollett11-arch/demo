

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

import {
  Briefcase,
  CheckCircle2,
  Users,
  Zap,
  Star,
  ArrowRight,
} from "lucide-react"

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
  const [checkingOut, setCheckingOut] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
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
  // SUCCESS/CANCEL URL HANDLING
  // -------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("success") === "true") {
      toast.success("You're subscribed! Welcome to SimplyApply.")
      window.history.replaceState({}, "", "/billing")
    }

    if (params.get("canceled") === "true") {
      toast.error("Checkout canceled. No charges were made.")
      window.history.replaceState({}, "", "/billing")
    }
  }, [])

  // -------------------------
  // START CHECKOUT
  // -------------------------
  const startCheckout = async () => {
    if (!userId || checkingOut) return
    setCheckingOut(true)

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    })

    const data = await res.json()

    if (!res.ok || !data.url) {
      toast.error(data.error || "Failed to start checkout.")
      setCheckingOut(false)
      return
    }

    window.location.href = data.url
  }

  // -------------------------
  // OPEN CUSTOMER PORTAL
  // -------------------------
  const openPortal = async () => {
    if (!userId || openingPortal) return
    setOpeningPortal(true)

    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()

    if (!res.ok || !data.url) {
      toast.error(data.error || "Failed to open billing portal.")
      setOpeningPortal(false)
      return
    }

    window.location.href = data.url
  }

  // -------------------------
  // CANCEL SUBSCRIPTION
  // -------------------------
  const cancelSubscription = async () => {
    if (!userId) {
      toast.error("No active subscription found.")
      return
    }

    setCanceling(true)
    setShowConfirm(false)

    const res = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
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
  const isPastDue = profile?.subscription_status === "past_due"
  const needsSubscription = !isActive && !isCanceled && !isPastDue

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading billing...</p>
      </div>
    )
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center">
          <Image
  src="/icon-192x192.png"
  alt="SimplyApply logo"
  width={28}
  height={28}
  className="object-contain"
/>
</div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          {isActive && (
            <Link href="/employer" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to dashboard
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">

        {/* HERO — only show if not yet subscribed */}
        {needsSubscription && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/20 p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              One step away from finding your next hire
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Set up your subscription to unlock full access to SimplyApply — browse verified student profiles, use smart matching, and manage your entire hiring pipeline.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {[
                "Access all student profiles",
                "Smart availability matching",
                "Hiring pipeline tools",
                "Cancel anytime",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE HERO */}
        {isActive && (
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-background border border-green-200 p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Your subscription is active</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                You have full access to SimplyApply.{periodEndFormatted ? ` Renews ${periodEndFormatted}.` : ""}
              </p>
            </div>
          </div>
        )}

        {/* CANCELED HERO */}
        {isCanceled && (
          <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-background border border-yellow-200 p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 shrink-0">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Your subscription has been canceled</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {periodEndFormatted
                  ? `You have access until ${periodEndFormatted}. Resubscribe to keep hiring.`
                  : "Resubscribe to regain access to your hiring tools."}
              </p>
            </div>
          </div>
        )}

        {/* PAST DUE BANNER */}
        {isPastDue && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 shrink-0">
              <Zap className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-800">Payment failed</h2>
              <p className="text-sm text-red-600 mt-1">
                Your last payment didn't go through. Update your payment method to keep access to your hiring tools.
              </p>
              <Button size="sm" variant="destructive" className="mt-3" onClick={openPortal} disabled={openingPortal}>
                {openingPortal ? "Opening..." : "Update Payment Method"}
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT — PLAN + ACTIONS */}
          <div className="space-y-6">

            {/* PLAN CARD */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {isActive ? "Employer Pro" : isCanceled ? "Employer Pro (Canceled)" : "No Active Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isActive && periodEndFormatted ? `Renews ${periodEndFormatted}` :
                     isCanceled && periodEndFormatted ? `Access until ${periodEndFormatted}` :
                     "$9.99 / month"}
                  </p>
                </div>
                {isActive ? (
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                ) : isCanceled ? (
                  <Badge className="bg-yellow-100 text-yellow-700">Canceled</Badge>
                ) : isPastDue ? (
                  <Badge className="bg-red-100 text-red-700">Payment Failed</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                )}
              </CardContent>
            </Card>

            {/* SUBSCRIBE */}
            {needsSubscription && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="font-semibold text-foreground text-lg">Employer Pro</p>
                    <p className="text-3xl font-bold text-primary mt-1">$9.99<span className="text-base font-normal text-muted-foreground">/month</span></p>
                  </div>
                  <Button className="w-full" size="lg" onClick={startCheckout} disabled={checkingOut}>
                    {checkingOut ? "Redirecting..." : "Subscribe Now"}
                    {!checkingOut && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Billed monthly. Cancel anytime. No contracts.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* MANAGE */}
            {isActive && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Button variant="outline" onClick={openPortal} disabled={openingPortal}>
                      {openingPortal ? "Opening..." : "Open Billing Portal"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Update payment method or download invoices.
                    </p>
                  </div>

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
                        <p className="text-sm font-medium text-red-800">Are you sure you want to cancel?</p>
                        <p className="text-xs text-red-600">
                          Your subscription stays active until {periodEndFormatted ?? "the end of your billing period"}, then your account will be downgraded.
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={cancelSubscription} disabled={canceling}>
                            {canceling ? "Canceling..." : "Yes, cancel"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)} disabled={canceling}>
                            Keep my subscription
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RESUBSCRIBE */}
            {isCanceled && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 space-y-3">
                  <p className="font-semibold text-foreground">Resubscribe to Employer Pro</p>
                  <p className="text-sm text-muted-foreground">Regain full access to all hiring tools immediately.</p>
                  <Button className="w-full" onClick={startCheckout} disabled={checkingOut}>
                    {checkingOut ? "Redirecting..." : "Resubscribe — $9.99/month"}
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT — WHAT'S INCLUDED */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    icon: Users,
                    title: "Full Candidate Access",
                    description: "Browse all verified student profiles in your area with complete availability and GPA info.",
                  },
                  {
                    icon: Zap,
                    title: "Smart Matching",
                    description: "Our algorithm scores candidates based on schedule fit, GPA, and job preferences — so you find the right person fast.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Hiring Pipeline",
                    description: "Track every candidate from new to contacted to hired in one simple view.",
                  },
                  {
                    icon: Star,
                    title: "Verified Student Badges",
                    description: "Students with recommendations are marked so you can hire with confidence.",
                  },
                  {
                    icon: Briefcase,
                    title: "Company Profile",
                    description: "Showcase your business, pay rate, available shifts, and the roles you're hiring for.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* BACK LINKS */}
        {isActive && (
          <div className="flex items-center gap-4 pt-2">
            <Link href="/employer" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
            <Link href="/employer/profile" className="text-sm text-muted-foreground hover:text-foreground">← Go to profile</Link>
          </div>
        )}

      </div>
    </div>
  )
}