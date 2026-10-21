"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { authedFetch } from "@/lib/authedFetch"
import { isPro } from "@/lib/plan"
import { recordProInterest } from "@/lib/proInterest"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  CheckCircle2,
  Users,
  Zap,
  Star,
  ArrowRight,
  Lock,
  MapPin,
  Eye,
} from "lucide-react"

export default function BillingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  // derived helpers
  const isActive = subscriptionStatus === "active"
  const isFreeActive = subscriptionStatus === "freeactive"
  const isSubscribed = isActive || isFreeActive

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
  
    // Check role
    const { data: roleData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
  
    if (!roleData?.role) {
      router.replace("/choose-role")
      return
    }
  
    if (roleData.role !== "employer") {
      router.replace("/login")
      return
    }
  
    // Check employer profile exists
    const { data: jobData } = await supabase
      .from("job")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
  
    if (!jobData) {
      router.replace("/employer/profile")
      return
    }
  
    setUserId(user.id)
  
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single()
  
    if (!error && data) {
      setSubscriptionStatus(data.subscription_status)
    }
  
    setLoading(false)
  }

  useEffect(() => {
    loadBilling()
  }, [])

  // -------------------------
  // ACTIVATE FREE ACCESS
  // -------------------------
  const [upgrading, setUpgrading] = useState(false)

  // Opening the plan page is the clearest intent signal of the lot.
  useEffect(() => {
    if (subscriptionStatus && !isPro(subscriptionStatus)) recordProInterest("plan-page")
  }, [subscriptionStatus])

  // Stripe sends the employer back here after checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      toast.success("You're on Employer Pro", { description: "Match scores, extra locations and full student profiles are unlocked." })
      window.history.replaceState({}, "", "/pricing/mobile")
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout canceled — no charge was made.")
      window.history.replaceState({}, "", "/pricing/mobile")
    }
  }, [])

  const startUpgrade = async () => {
    if (upgrading) return
    setUpgrading(true)
    try {
      const res = await authedFetch("/api/stripe/create-checkout-session", { method: "POST" })
      const body = await res.json()
      if (!res.ok || !body?.url) {
        toast.error(body?.error || "Could not start checkout. Please try again.")
        setUpgrading(false)
        return
      }
      window.location.href = body.url
    } catch {
      toast.error("Could not start checkout. Please try again.")
      setUpgrading(false)
    }
  }

  const openBillingPortal = async () => {
    const res = await authedFetch("/api/stripe/create-portal-session", { method: "POST" })
    const body = await res.json()
    if (!res.ok || !body?.url) {
      toast.error(body?.error || "Could not open billing.")
      return
    }
    window.location.href = body.url
  }

  const activateFreeAccess = async () => {
    if (!userId || activating) return
    setActivating(true)

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          subscription_status: "freeactive",
        },
        { onConflict: "id" }
      )

    if (error) {
      toast.error("Something went wrong. Please try again.")
      setActivating(false)
      return
    }

    toast.success("Access activated! Welcome to SimplyApply.")
    setSubscriptionStatus("freeactive")
    setActivating(false)
    router.push("/employer")
  }

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
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
            <Image src="/icon-192x192.png" alt="SimplyApply logo" width={42} height={42} className="object-contain rounded-lg" />
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          {isSubscribed && (
            <Link href="/employer" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to dashboard
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">

        {/* HERO — not yet active */}
        {!isSubscribed && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/20 p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              Early Access — Free to Start
            </Badge>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              One step away from finding your next hire
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              SimplyApply is free during early access. Activate your account to browse verified student profiles, use smart matching, and manage your entire hiring pipeline — no credit card needed.
            </p>
            <p className="text-xs text-muted-foreground">
              Pricing may be introduced in the future. Early users will always be treated fairly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {[
                "Access all student profiles",
                "Smart availability matching",
                "Hiring pipeline tools",
                "Free during early access",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FREEACTIVE HERO */}
        {isFreeActive && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-background border border-primary/20 p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">You're on free early access</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Full access at no cost while we grow. Pricing may be introduced in the future — early users will always be treated fairly.
              </p>
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
                You have full access to SimplyApply.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT — ACTIVATE / STATUS */}
          <div className="space-y-6">

            {/* PLAN CARD */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {isFreeActive ? "Employer Free" :
                     isActive ? "Employer Pro" :
                     "No Active Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFreeActive ? "1 location · no match scores" :
                     isActive ? "Paid subscription" :
                     "Start free — no card needed"}
                  </p>
                </div>
                {isFreeActive ? (
                  <Badge className="bg-secondary text-muted-foreground">Free</Badge>
                ) : isActive ? (
                  <Badge className="bg-green-100 text-green-700">Pro</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                )}
              </CardContent>
            </Card>

            {/* ACTIVATE */}
            {!isSubscribed && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="font-semibold text-foreground text-lg">Employer Early Access</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      Free
                      <span className="text-base font-normal text-muted-foreground ml-2">during early access</span>
                    </p>
                  </div>
                  <Button className="w-full" size="lg" onClick={activateFreeAccess} disabled={activating}>
                    {activating ? "Starting..." : "Start free"}
                    {!activating && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No credit card required. Pricing may change in the future.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* UPGRADE TO PRO */}
            {!isActive && (
              <Card className="gap-4 border-primary/30 bg-primary/5">
                <CardContent className="px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Employer Pro</p>
                      <p className="mt-1 text-3xl font-bold text-primary">
                        $20
                        <span className="ml-1 text-base font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary">Recommended</Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { icon: MapPin, title: "Unlimited locations", body: "Hire for every site you run, each matched separately." },
                      { icon: Zap, title: "Match scores", body: "See how well each student fits your shifts, ranked best-first." },
                      { icon: Eye, title: "Full student profiles", body: "Bio, interests, social links and preferred positions." },
                    ].map(({ icon: Icon, title, body }) => (
                      <div key={title} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground">{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="mt-5 w-full" size="lg" onClick={startUpgrade} disabled={upgrading}>
                    {upgrading ? "Opening checkout..." : "Upgrade to Pro"}
                    {!upgrading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Cancel anytime — you keep Pro until the end of the period.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* MANAGE (PRO ONLY) */}
            {isActive && (
              <Card className="gap-4">
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                </CardHeader>
                <CardContent className="px-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Update your card, download invoices or cancel. Cancelling keeps Pro until the end of the period, then drops you to Free — your extra locations are paused, never deleted.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={openBillingPortal}>Manage billing</Button>
                    <Button variant="ghost" asChild><Link href="/employer">Go to Dashboard</Link></Button>
                  </div>
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
                    description: "Our algorithm scores candidates based on schedule fit, GPA, and job preferences.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Hiring Pipeline",
                    description: "Track every candidate from new to contacted to hired in one simple view.",
                  },
                  {
                    icon: Star,
                    title: "Verified Student Badges",
                    description: "Students with verified GPAs are flagged so you can hire with confidence.",
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
        {isSubscribed && (
          <div className="flex items-center gap-4 pt-2">
            <Link href="/employer" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
            <Link href="/employer/profile" className="text-sm text-muted-foreground hover:text-foreground">← Go to profile</Link>
          </div>
        )}

      </div>
    </div>
  )
}