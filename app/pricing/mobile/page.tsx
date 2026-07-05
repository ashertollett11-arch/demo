"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
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
} from "lucide-react"

export default function BillingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

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

    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single()

    if (!error && data?.subscription_status === "active") {
      setIsActive(true)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadBilling()
  }, [])

  // -------------------------
  // ACTIVATE FREE ACCESS
  // -------------------------
  const activateFreeAccess = async () => {
    if (!userId || activating) return
    setActivating(true)

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          subscription_status: "active",
        },
        { onConflict: "id" }
      )

    if (error) {
      toast.error("Something went wrong. Please try again.")
      setActivating(false)
      return
    }

    toast.success("Access activated! Welcome to SimplyApply.")
    setIsActive(true)
    setActivating(false)
    router.push("/employer")
  }

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
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

        {/* HERO — not yet active */}
        {!isActive && (
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

        {/* ACTIVE HERO */}
        {isActive && (
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-background border border-green-200 p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Your account is active</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                You have full access to SimplyApply. Free during early access.
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
                    {isActive ? "Employer — Early Access" : "No Active Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? "Free during early access" : "Activate for free — no card needed"}
                  </p>
                </div>
                {isActive ? (
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                )}
              </CardContent>
            </Card>

            {/* ACTIVATE */}
            {!isActive && (
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
                    {activating ? "Activating..." : "Activate Free Access"}
                    {!activating && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No credit card required. Pricing may change in the future.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ALREADY ACTIVE */}
            {isActive && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You have full access to all SimplyApply employer features during early access. We'll notify you well in advance of any pricing changes.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/employer">Go to Dashboard</Link>
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