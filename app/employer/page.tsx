"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle2,
  Bell,
  Building2,
  LogOut,
  ChevronDown,
  CreditCard,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { calculateEmployerMatch } from "@/lib/employerMatchScore"

export default function EmployerDashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("Your Company")
  const [notifications, setNotifications] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<
    "morning" | "night" | "flexible"
  >("flexible")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])

  // -------------------------
  // AUTH USER
  // -------------------------
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    }
    getUser()
  }, [])

  // -------------------------
  // LOAD COMPANY
  // -------------------------
  useEffect(() => {
    if (!userId) return

    const loadCompany = async () => {
      const { data } = await supabase
        .from("job")
        .select("company, owner_name")
        .eq("user_id", userId)
        .single()

      if (!data) return

      setCompanyName(data.company || "Your Company")
    }

    loadCompany()
  }, [userId])

  // -------------------------
  // LOAD STUDENTS
  // -------------------------
  useEffect(() => {
    const loadStudents = async () => {
      const { data } = await supabase.from("Students").select("*")
      setStudents(data || [])
    }

    loadStudents()
  }, [])

  // -------------------------
  // LOAD JOB SETTINGS
  // -------------------------
  useEffect(() => {
    if (!userId) return

    const loadJob = async () => {
      const { data } = await supabase
        .from("job")
        .select("available_shifts, shift_preference, preferred_jobs")
        .eq("user_id", userId)
        .single()

      if (!data) return

      setEmployerShifts(data.available_shifts || [])
      setShiftPreference(data.shift_preference || "flexible")
      setPreferredJobs(data.preferred_jobs || [])
    }

    loadJob()
  }, [userId])

  // -------------------------
  // NOTIFICATIONS
  // -------------------------
  useEffect(() => {
    if (!userId) return

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("employer_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })

      setNotifications(data || [])
    }

    loadNotifications()
  }, [userId])

  // realtime
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("notifications-dashboard")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `employer_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
  useEffect(() => {
    if (!userId || students.length === 0) return
  
    const loadAndSeedStatuses = async () => {
      // 1. seed missing statuses
      const rows = students.map((student) => ({
        employer_id: userId,
        student_id: student.id,
        status: "new",
      }))
  
      const { error: seedError } = await supabase
        .from("student_statuses")
        .upsert(rows, {
          onConflict: "employer_id,student_id",
          ignoreDuplicates: true,
        })
  
      if (seedError) {
        console.error(seedError)
        return
      }
  
      // 2. reload statuses
      const { data, error } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", userId)
  
      if (error) {
        console.error(error)
        return
      }
  
      setStatuses(data || [])
    }
  
    loadAndSeedStatuses()
  }, [userId, students])
  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    await supabase.from("notifications").update({ read: true }).eq("id", id)
  }

  // -------------------------
  // MATCH SCORES
  // -------------------------
  const candidatesWithScores = useMemo(() => {
    const activeShifts = employerShifts.filter(
      (s) => s.active === true || s.active === "true" || s.active === 1
    )

    const jobDays = activeShifts.map((s) => s.day)

    return students.map((s) => {
      const score = calculateEmployerMatch(
        {
          shifts: jobDays,
          shiftPreference,
          preferred_jobs: preferredJobs,
        },
        s.availability,
        s.shiftPreference,
        s.gpa,
        s.preferredJobs
      )

      return {
        ...s,
        matchScore: Math.round(score),
      }
    })
  }, [students, employerShifts, shiftPreference])

  // -------------------------
  // METRICS
  // -------------------------
  const hiresThisMonth = 0 // placeholder (no hiring tracking yet)
  const greatCandidates = candidatesWithScores.filter(
    (c) => c.matchScore >= 75
  ).length

  const perfectMatches = candidatesWithScores.filter(
    (c) => c.matchScore === 100
  ).length

  const topMatch = Math.max(
    0,
    ...candidatesWithScores.map((c) => c.matchScore || 0)
  )

  const recentActivity = notifications.slice(0, 4)

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-background">
  {/* HEADER (REPLACEMENT) */}
<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

    {/* LEFT SIDE */}
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
        <Briefcase className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-foreground">SimplyApply</span>
    </Link>

    {/* CENTER NAV */}
    <div className="hidden items-center gap-6 md:flex">
      <Link href="/employer" className="text-sm font-medium text-foreground">
        Dashboard
      </Link>

      <Link
        href="/matching/employer"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Find Candidates
      </Link>

      <Link
        href="/billing"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Billing
      </Link>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex items-center gap-4">

    

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold">
              {companyName?.[0] || "?"}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
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
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">

        {/* WELCOME */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {companyName}</h1>
          <p className="text-muted-foreground">
            Here’s your hiring overview
          </p>
        </div>

      
     

        {/* PIPELINE */}
        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
  
  <Link href="/matching/employer?status=new">
    <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
      <p className="text-sm text-muted-foreground">New</p>
      <p className="mt-2 text-3xl font-bold">
        {statuses.filter((s) => s.status === "new").length}
      </p>
    </div>
  </Link>

  <Link href="/matching/employer?status=contacted">
    <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
      <p className="text-sm text-muted-foreground">Contacted</p>
      <p className="mt-2 text-3xl font-bold">
        {statuses.filter((s) => s.status === "contacted").length}
      </p>
    </div>
  </Link>

  <Link href="/matching/employer?status=hired">
    <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
      <p className="text-sm text-muted-foreground">Hired</p>
      <p className="mt-2 text-3xl font-bold">
        {statuses.filter((s) => s.status === "hired").length}
      </p>
    </div>
  </Link>

</CardContent>
        </Card>

        {/* INSIGHT */}
        <Card className="cursor-pointer hover:bg-muted/40 transition"
      onClick={() => window.location.href = "/matching/employer"}>
          <CardContent className="p-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="flex flex-col gap-1">
  <p>
    You have <b>{greatCandidates}</b> strong candidates (75%+ match) ready to review.
  </p>

  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
    <span>
      Top Match: <b>{topMatch}%</b>
    </span>

    <span>•</span>

    <Link
  href="/matching/employer?perfect=true"
  className="hover:text-foreground transition"
>
  Perfect Matches: <b>{perfectMatches}</b>
</Link>
  </div>
</div>
          </CardContent>
        </Card>

        {/* RECENT ACTIVITY */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
  {recentActivity.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No recent activity
    </p>
  ) : (
    recentActivity.map((n) => {
      const studentName =
        n.student_name ||
        n.message?.split(" applied to ")[0]?.trim()

      return (
        <div
          key={n.id}
          className="flex justify-between items-center text-sm border-b pb-2"
        >
          <span>{n.message}</span>

          <div className="flex items-center gap-2">
            {studentName && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = `/matching/employer?search=${encodeURIComponent(
                    studentName
                  )}`
                }}
              >
                View Profile
              </Button>
            )}

            <button
              onClick={() => dismissNotification(n.id)}
              className="text-muted-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )
    })
  )}
</CardContent>
        </Card>

        {/* BILLING SNAPSHOT */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Overview</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p>Current Plan: Employer Plan</p>
         
            <Button asChild>
              <Link href="/billing">Manage Billing</Link>
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">
                Ready to hire your next student?
              </p>
              <p className="text-sm opacity-80">
                View your full candidate pool
              </p>
            </div>

            <Button asChild variant="secondary">
              <Link href="/matching/employer">
                Go to Candidates <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}