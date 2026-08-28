"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
  Bell,
  MapPin,
  Clock,
  Home,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Job {
  id: string
  title: string
  company: string
  location: string
  pay: string
  tips?: boolean
  details?: string
  matchScore: number
  status: "new" | "applied" | "interviewing"
  shifts: { day: string; active: boolean }[]
  shift_Preference: string
  preferredJobs?: string[]
  distanceText?: string
  durationText?: string
  distanceMeters?: number
}

export default function MatchesPage() {
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)
  const [jobsLoaded, setJobsLoaded] = useState(false)
  const [nameLoaded, setNameLoaded] = useState(false)
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState<"pay" | "tips" | "matchScore" | "distance">("matchScore")
  const [name, setName] = useState("")
  const pathname = usePathname()
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [studentNotifications, setStudentNotifications] = useState<any[]>([])

  useEffect(() => {
    const checkProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("Students").select("profile_complete").eq("user_id", user.id).maybeSingle()
      if (!profile || !profile.profile_complete) { router.replace("/student/onboarding"); return }
    }
    checkProfile()
  }, [router])

  useEffect(() => {
    const fetchJobs = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) return
      const { data: studentData, error: studentError } = await supabase
        .from("Students").select("availability, shift_preference, zip_code, user_id").eq("user_id", userId).single()
      if (studentError) return
      const studentAvailability = studentData?.availability ?? []
      const studentShiftPreference = studentData?.shift_preference || "flexible"
      const studentUserId = studentData?.user_id
      const { data: locations, error: locError } = await supabase
        .from("locations").select(`id, name, address, max_distance_miles, available_shifts, shift_preference, hourly_pay, has_tips, preferred_jobs, employer_id, job:employer_id (id, company, details, status)`)
      if (locError) return
      const { data: applications } = await supabase.from("location_applications").select("location_id").eq("student_user_id", userId)
      setAppliedIds(new Set((applications || []).map((a: any) => a.location_id)))
      const { data: distanceRows } = await supabase
        .from("employer_student_distances").select("employer_location_id, distance_text, duration_text, distance_meters").eq("student_user_id", studentUserId)
      const distanceMap: Record<string, { distance_text: string; duration_text: string; distance_meters: number }> = {}
      ;(distanceRows || []).forEach((d) => { distanceMap[d.employer_location_id] = { distance_text: d.distance_text, duration_text: d.duration_text, distance_meters: d.distance_meters } })
      const { data: recData } = await supabase.from("recommendations").select("id").eq("student_user_id", studentUserId).eq("submitted", true).maybeSingle()
      const studentHasRecommendation = !!recData
      const updated = (locations || [])
        .filter((loc: any) => { const d = distanceMap[loc.id]?.distance_meters; if (!d) return false; return d <= (loc.max_distance_miles ?? 10) * 1609.34 })
        .map((loc: any) => {
          let shifts = loc.available_shifts ?? []
          if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
          const activeShifts = shifts.filter((s: any) => s.active === true || s.active === "true" || s.active === 1)
          const base = calculateMatch(
            { availability: studentAvailability, shiftPreference: studentShiftPreference, hasRecommendation: studentHasRecommendation, distanceMeters: distanceMap[loc.id]?.distance_meters ?? undefined },
            { shifts: activeShifts, shiftPreference: loc.shift_preference || "flexible" }
          )
          const dist = distanceMap[loc.id]
          return {
            id: loc.id, title: loc.name || "Untitled Location",
            company: loc.job?.company || "Unknown", details: loc.job?.details || "",
            pay: loc.hourly_pay ? `$${loc.hourly_pay}/hr` : "$0",
            status: loc.job?.status || "new", tips: Boolean(loc.has_tips),
            shift_Preference: loc.shift_preference || "flexible",
            matchScore: Math.round(base), preferredJobs: loc.preferred_jobs || [],
            distanceText: dist?.distance_text ?? null, durationText: dist?.duration_text ?? null,
            distanceMeters: dist?.distance_meters ?? undefined,
          }
        })
        setMatchedJobs(updated)
        setJobsLoaded(true)
      }
      fetchJobs()
  }, [])

  useEffect(() => {
    const fetchStudentName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from("Students").select("name").eq("user_id", user.id).single()
      if (error) { setNameLoaded(true); return }
            setName(data?.name || "")
      setNameLoaded(true)
    }
    fetchStudentName()
  }, [])

  useEffect(() => {
    const loadStudentNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("student_notifications").select("*").eq("student_user_id", user.id).eq("read", false).order("created_at", { ascending: false })
      setStudentNotifications(data || [])
    }
    loadStudentNotifications()
  }, [])

useEffect(() => {
    if (jobsLoaded && nameLoaded) setPageLoading(false)
  }, [jobsLoaded, nameLoaded])

  const parsePay = (p: string) => parseFloat(p.replace(/[^0-9.]/g, "")) || 0
  const sortedJobs = [...matchedJobs].sort((a, b) => {
    switch (filter) {
      case "pay": return parsePay(b.pay) - parsePay(a.pay)
      case "tips": return Number(b.tips) - Number(a.tips)
      case "distance": return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
      default: return b.matchScore - a.matchScore
    }
  })

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-muted-foreground text-sm">Finding jobs near you...</p>
        </div>
      </div>
    )
  }

  const initials = (name || "").trim().split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "?"

  return (
    <div className="min-h-screen bg-background pb-28" suppressHydrationWarning>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40" suppressHydrationWarning>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          {/* BELL */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-4 w-4 text-foreground" />
                {studentNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {studentNotifications.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold text-sm">Notifications</p>
                {studentNotifications.length > 0 && <Badge className="bg-red-100 text-red-600 text-xs">{studentNotifications.length} new</Badge>}
              </div>
              {studentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-7 w-7 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">All caught up</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {studentNotifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">📲</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.created_at ? new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}</p>
                      </div>
                      <button onClick={async () => { setStudentNotifications(prev => prev.filter(x => x.id !== n.id)); await supabase.from("student_notifications").update({ read: true }).eq("id", n.id) }}
                        className="text-xs text-muted-foreground hover:text-foreground shrink-0">Dismiss</button>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* TITLE */}
          <p className="text-base font-bold text-foreground">Jobs Near You</p>

          {/* PROFILE */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2.5 border-b">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-muted-foreground">Student Account</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/student/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <User className="h-4 w-4 text-muted-foreground" /> My Profile
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* STATS ROW */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{matchedJobs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Jobs</p>
          </div>
          <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{matchedJobs.length > 0 ? Math.max(...matchedJobs.map(j => j.matchScore)) : 0}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Best Match</p>
          </div>
          <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{appliedIds.size}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Applied</p>
          </div>
        </div>

        {/* EMPLOYER ACTIVITY BANNER */}
        <Link href="/student/activity" className="mb-5 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 hover:bg-primary/90 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Employer Activity</p>
              <p className="text-xs text-white/70">See who's interested in you</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/80 shrink-0" />
        </Link>

        {/* FILTER PILLS — horizontal scroll */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "matchScore", label: "Best Match" },
            { key: "pay", label: "Highest Pay" },
            { key: "tips", label: "Tips" },
            { key: "distance", label: "Closest" },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setFilter(key as any)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/60 text-muted-foreground border-transparent hover:border-border"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* JOB CARDS */}
        {sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No jobs near you yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon — new jobs are added regularly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedJobs.map((job) => {
              const alreadyApplied = appliedIds.has(job.id)
              return (
                <Link key={job.id} href={`/matching/student/${job.id}`}>
                  <div className="rounded-2xl border border-border/60 bg-card p-4 hover:bg-secondary/30 transition-colors active:scale-[0.98] cursor-pointer">
                    <div className="flex items-start gap-3">
                      {/* COMPANY INITIAL */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                        {job.company[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{job.company}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{job.title}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-bold ${job.matchScore >= 75 ? "text-primary" : job.matchScore >= 50 ? "text-yellow-600" : "text-muted-foreground"}`}>
                            {job.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-semibold text-foreground">{job.pay}</span>
                          {job.tips && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">+ Tips</span>}
                          {alreadyApplied && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Applied ✓</span>}
                        </div>
                        {job.distanceText && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{job.distanceText}
                            {job.durationText && <><span className="mx-1">·</span><Clock className="h-3 w-3" />{job.durationText}</>}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* BOTTOM NAV — Uber style floating pill */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-1 rounded-full bg-foreground px-2 py-2 shadow-2xl">
          <Link href="/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/matching/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-background text-foreground transition-colors">
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] font-medium">Jobs</span>
          </Link>
          <Link href="/student/activity" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium">Activity</span>
          </Link>
          <Link href="/student/profile" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </div>

    </div>
  )
}