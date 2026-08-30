"use client"
import { useRouter } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Briefcase,
  CheckCircle2,
  MapPin,
  User,
  Star,
  LogOut,
  Bell,
  ArrowRight,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Home,
  Activity,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Job = {
  id: string
  jobId?: string
  title: string
  company: string
  details?: string
  distance: string
  pay: string
  tips?: boolean
  status?: string
  shiftPreference?: string
  preferredJobs?: string[]
}

export default function StudentDashboard() {
  const router = useRouter()
  const [studentNotifications, setStudentNotifications] = useState<any[]>([])
  const [name, setName] = useState("")
  const [gpa, setGpa] = useState<number | null>(null)
  const [hasRecommendation, setHasRecommendation] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [jobsLoaded, setJobsLoaded] = useState(false)
  const [studentLoaded, setStudentLoaded] = useState(false)
  const [matchedJobsWithScore, setMatchedJobsWithScore] = useState<(Job & { matchScore: number })[]>([])

  const greatMatches = matchedJobsWithScore.filter(job => job.matchScore >= 65).length
  const topMatch = matchedJobsWithScore.length > 0 ? Math.max(...matchedJobsWithScore.map(j => j.matchScore)) : 0
  const firstName = name.trim().split(" ")[0] || "there"
  const initials = (name || "").trim().split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "?"
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("dashboard_visited")
    if (!seen) {
      setIsFirstVisit(true)
      localStorage.setItem("dashboard_visited", "true")
    }
  }, [])
  useEffect(() => {
    const checkProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("Students").select("profile_complete").eq("user_id", user.id).maybeSingle()
      if (!profile || !profile.profile_complete) { router.replace("/student/onboarding?missing=true"); return }
    }
    checkProfile()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("from") === "profile" && params.get("saved") === "true") {
      setTimeout(() => { toast.success("Profile saved!") }, 0)
    }
  }, [])

  useEffect(() => {
    const fetchJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: studentData, error: studentError } = await supabase
        .from("Students").select("availability, shift_preference, zip_code, user_id").eq("user_id", user.id).single()
      if (studentError || !studentData) return
      const { data: locations, error: locError } = await supabase
        .from("locations").select(`id, name, address, max_distance_miles, available_shifts, shift_preference, hourly_pay, has_tips, preferred_jobs, employer_id, job:employer_id (id, company, details, status)`)
      if (locError) return
      const { data: distanceRows } = await supabase
        .from("employer_student_distances").select("employer_location_id, distance_meters").eq("student_user_id", studentData.user_id)
      const distanceMap: Record<string, number> = {}
      ;(distanceRows || []).forEach((d) => { distanceMap[d.employer_location_id] = d.distance_meters })
      const { data: recData } = await supabase.from("recommendations").select("id").eq("student_user_id", user.id).eq("submitted", true).maybeSingle()
      const studentHasRecommendation = !!recData
      const scoredJobs = (locations || [])
        .filter((loc: any) => { const d = distanceMap[loc.id]; if (!d) return false; return d <= (loc.max_distance_miles ?? 10) * 1609.34 })
        .map((loc: any) => {
          let shifts = loc.available_shifts ?? []
          if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
          const activeShifts = shifts.filter((s: any) => s.active === true || s.active === "true" || s.active === 1)
          const matchScore = calculateMatch(
            { availability: studentData.availability || [], shiftPreference: studentData.shift_preference || "flexible", hasRecommendation: studentHasRecommendation, distanceMeters: distanceMap[loc.id] ?? undefined },
            { shifts: activeShifts, shiftPreference: loc.shift_preference || "flexible" }
          )
          return {
            id: loc.id, jobId: loc.job?.id,
            title: loc.name || "Untitled Location",
            company: loc.job?.company || "Unknown Company",
            details: loc.job?.details || "",
            distance: loc.address || "N/A",
            pay: loc.hourly_pay ? `$${loc.hourly_pay}/hr` : "N/A",
            status: loc.job?.status || "new",
            shiftPreference: loc.shift_preference || "flexible",
            tips: Boolean(loc.has_tips),
            preferredJobs: loc.preferred_jobs || [],
            matchScore: Math.round(matchScore),
          }
        })
        scoredJobs.sort((a, b) => b.matchScore - a.matchScore)
        setMatchedJobsWithScore(scoredJobs)
        setJobsLoaded(true)
      }
      fetchJobs()
  }, [])

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) { setPageLoading(false); return }
      const { data: studentData, error } = await supabase.from("Students").select("gpa, name").eq("user_id", user.id).single()
      if (error) { setPageLoading(false); return }
      const rawGpa = studentData?.gpa
      const parsedGpa = rawGpa !== null && rawGpa !== undefined ? Number(rawGpa) : null
      setGpa(isNaN(parsedGpa as number) ? null : parsedGpa)
      setName(studentData?.name || "")
      const { data: rec } = await supabase.from("recommendations").select("id").eq("student_user_id", user.id).eq("submitted", true).maybeSingle()
      setHasRecommendation(!!rec)
      setStudentLoaded(true)
    }
    fetchStudent()
  }, [])

  useEffect(() => {
    const loadStudentNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("student_notifications").select("*").eq("student_user_id", user.id).eq("read", false).order("created_at", { ascending: false })
      setStudentNotifications(data || [])
      const channel = supabase
        .channel("student-notifications-dashboard")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "student_notifications",
          filter: `student_user_id=eq.${user.id}`,
        }, (payload) => {
          setStudentNotifications(prev => [payload.new, ...prev])
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    loadStudentNotifications()
  }, [])
  useEffect(() => {
    if (jobsLoaded && studentLoaded) setPageLoading(false)
  }, [jobsLoaded, studentLoaded])
  const getMatchColor = (score: number) => {
    // Below 70: red (0°) to yellow (45°)
    // Above 70: yellow (45°) to green (120°)
    const hue = score < 70
      ? Math.round((score / 70) * 45)
      : Math.round(45 + ((score - 70) / 30) * 75)
    return { color: `hsl(${hue}, 85%, 38%)` }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
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
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white" suppressHydrationWarning>
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
<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">🎉</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.created_at ? new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Link href="/student/activity" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                            View
                          </Link>
                          <button onClick={async () => { setStudentNotifications(prev => prev.filter(x => x.id !== n.id)); await supabase.from("student_notifications").update({ read: true }).eq("id", n.id) }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* TITLE */}
            <p className="text-base font-bold text-foreground">SimplyApply</p>

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
                  <DropdownMenuItem asChild>
                    <Link href="/matching/student" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                      <Briefcase className="h-4 w-4 text-muted-foreground" /> Jobs Near You
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

          {/* GREETING */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-foreground">Good to see you, {firstName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {matchedJobsWithScore.length > 0
                ? `${matchedJobsWithScore.length} job${matchedJobsWithScore.length !== 1 ? "s" : ""} near you · ${greatMatches} strong match${greatMatches !== 1 ? "es" : ""}`
                : "No jobs near you yet — check back soon"}
            </p>
          </div>

          {/* STATS ROW */}
          <div className="flex gap-3 mb-5">
            <div onClick={() => router.push("/matching/student")} className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center cursor-pointer hover:bg-secondary transition-colors">
              <p className="text-2xl font-bold text-foreground">{matchedJobsWithScore.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jobs</p>
            </div>
            <div onClick={() => router.push("/matching/student")} className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center cursor-pointer hover:bg-secondary transition-colors">
              <p className="text-2xl font-bold text-foreground">{topMatch}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Top Match</p>
            </div>
            <div onClick={() => router.push("/student/profile")} className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-center cursor-pointer hover:bg-secondary transition-colors">
              <p className="text-2xl font-bold text-foreground">{gpa !== null ? gpa.toFixed(1) : "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">GPA</p>
            </div>
          </div>

     {/* MATCH TIP — only show if top match is low */}
     {matchedJobsWithScore.length > 0 && (isFirstVisit || topMatch < 65) && (
                  <Link href="/student/profile" className="mb-5 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 active:scale-[0.98] transition-all">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-lg">💡</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-900">Boost your match score</p>
                <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">Your top match is {topMatch}%. Update your availability and preferred jobs to get better matches.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-yellow-500 shrink-0" />
            </Link>
          )}

          {/* EMPLOYER ACTIVITY BANNER */}
          <Link href="/student/activity" className="mb-5 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 hover:bg-primary/90 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Employer Activity</p>
                <p className="text-xs text-white/70">See who's interested in hiring you</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/80 shrink-0" />
          </Link>

          {/* TOP MATCHES */}
          <div className="mb-2 flex items-center justify-between">
            <p className="text-base font-bold text-foreground">Top Matches</p>
            <Link href="/matching/student" className="text-xs text-primary font-medium flex items-center gap-1">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {matchedJobsWithScore.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                <MapPin className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground">No employers near you yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon — new jobs are added regularly.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {matchedJobsWithScore.slice(0, 5).map((job) => (
                <Link key={job.id} href={`/matching/student/${job.id}`}>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 hover:bg-secondary/30 active:scale-[0.98] transition-all cursor-pointer">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {job.company[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{job.company}</p>
                        {job.tips && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">+ Tips</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{job.title}</span>
                        <span className="text-xs font-semibold text-foreground">{job.pay}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                    <span className="text-sm font-bold" style={getMatchColor(job.matchScore)}>
                        {job.matchScore}%
                      </span>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}

    
          {/* PROFILE STRENGTH */}
          <p className="text-base font-bold text-foreground mb-3">Profile</p>
       
          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
            {/* RECOMMENDATION */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${hasRecommendation ? "bg-green-500/10" : "bg-primary/10"}`}>
                {hasRecommendation ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{hasRecommendation ? "Recommendation received" : "Get a recommendation"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasRecommendation ? "Visible to employers — sets you apart" : "Ask a teacher, coach, or employer"}
                </p>
              </div>
              {!hasRecommendation && (
                <button onClick={() => router.push("/student/profile")} className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Request
                </button>
              )}
            </div>

            {/* GPA */}
            <div onClick={() => router.push("/student/profile")} className="flex items-center gap-3 px-4 py-3.5 border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">GPA</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gpa !== null ? `${gpa.toFixed(2)} / 4.0` : "Not set"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
            </div>

            {/* EDIT PROFILE */}
            <Link href="/student/profile" className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Edit Profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your info, availability & jobs</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
            </Link>
          </div>

        </div>

        {/* BOTTOM NAV — Uber style floating pill */}
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
          <div className="flex items-center gap-1 rounded-full bg-foreground px-2 py-2 shadow-2xl">
            <Link href="/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-background text-foreground transition-colors">
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/matching/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
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
    </>
  )
}