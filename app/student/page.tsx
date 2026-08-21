"use client"
import { useRouter, usePathname } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Availability {
  day: string
  start: string
  end: string
  available: boolean
  hours: string
}

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
  const pathname = usePathname()
  const [matchedJobsWithScore, setMatchedJobsWithScore] = useState<(Job & { matchScore: number })[]>([])

  const greatMatches = matchedJobsWithScore.filter(job => job.matchScore >= 65).length
  const topMatch = matchedJobsWithScore.length > 0 ? Math.max(...matchedJobsWithScore.map(j => j.matchScore)) : 0

  // AUTH + PROFILE CHECK
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

  // FETCH JOBS
  useEffect(() => {
    const fetchJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: studentData, error: studentError } = await supabase
        .from("Students")
        .select("availability, shift_preference, zip_code, user_id")
        .eq("user_id", user.id)
        .single()
      if (studentError || !studentData) return
      const { data: locations, error: locError } = await supabase
        .from("locations")
        .select(`
          id, name, address, max_distance_miles, available_shifts, shift_preference,
          hourly_pay, has_tips, preferred_jobs, employer_id,
          job:employer_id (id, company, details, status)
        `)
      if (locError) return
      const { data: distanceRows } = await supabase
        .from("employer_student_distances")
        .select("employer_location_id, distance_meters")
        .eq("student_user_id", studentData.user_id)
      const distanceMap: Record<string, number> = {}
      ;(distanceRows || []).forEach((d) => { distanceMap[d.employer_location_id] = d.distance_meters })
      const { data: recData } = await supabase
        .from("recommendations").select("id").eq("student_user_id", user.id).eq("submitted", true).maybeSingle()
      const studentHasRecommendation = !!recData
      const scoredJobs = (locations || [])
        .filter((loc: any) => {
          const distMeters = distanceMap[loc.id]
          if (!distMeters) return false
          return distMeters <= (loc.max_distance_miles ?? 10) * 1609.34
        })
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
    }
    fetchJobs()
  }, [])

  // FETCH STUDENT + RECOMMENDATION
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) { setPageLoading(false); return }
      const { data: studentData, error } = await supabase
        .from("Students").select("gpa, name").eq("user_id", user.id).single()
      if (error) { setPageLoading(false); return }
      const rawGpa = studentData?.gpa
      const parsedGpa = rawGpa !== null && rawGpa !== undefined ? Number(rawGpa) : null
      setGpa(isNaN(parsedGpa as number) ? null : parsedGpa)
      setName(studentData?.name || "")
      const { data: rec } = await supabase
        .from("recommendations").select("id").eq("student_user_id", user.id).eq("submitted", true).maybeSingle()
      setHasRecommendation(!!rec)
      setPageLoading(false)
    }
    fetchStudent()
  }, [])

  useEffect(() => {
    const loadStudentNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("student_notifications").select("*").eq("student_user_id", user.id)
        .eq("read", false).order("created_at", { ascending: false })
      setStudentNotifications(data || [])
    }
    loadStudentNotifications()
  }, [])

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const firstName = name.trim().split(" ")[0] || "there"

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-background">

        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl" suppressHydrationWarning>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            {/* LEFT — logo/brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                S
              </div>
              <span className="font-semibold text-foreground text-sm hidden sm:block">SimplyApply</span>
            </div>

            {/* CENTER NAV */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/student" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === "/student" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                Dashboard
              </Link>
              <Link href="/matching/student" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === "/matching/student" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                Jobs Near You
              </Link>
              <Link href="/student/profile" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === "/student/profile" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                Profile
              </Link>
            </nav>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              {/* BELL */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {studentNotifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white" suppressHydrationWarning>
                        {studentNotifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <p className="font-semibold text-sm">Notifications</p>
                    {studentNotifications.length > 0 && (
                      <Badge className="bg-red-100 text-red-600 text-xs">{studentNotifications.length} new</Badge>
                    )}
                  </div>
                  {studentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="h-7 w-7 text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-medium">All caught up</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No new notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {studentNotifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">📲</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {n.created_at ? new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}
                            </p>
                          </div>
                          <button onClick={async () => { setStudentNotifications(prev => prev.filter(x => x.id !== n.id)); await supabase.from("student_notifications").update({ read: true }).eq("id", n.id) }}
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0">
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* PROFILE MENU */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20 hover:ring-primary/40 transition-all">
                    {(name || "").trim().split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
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
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                      <LogOut className="h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">

          {/* PAGE HEADER */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Good to see you, {firstName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {matchedJobsWithScore.length > 0
                  ? `${matchedJobsWithScore.length} job${matchedJobsWithScore.length !== 1 ? "s" : ""} near you — ${greatMatches} strong match${greatMatches !== 1 ? "es" : ""}`
                  : "No jobs near you yet — check back soon"}
              </p>
            </div>
            <Button asChild size="sm" className="hidden sm:flex gap-1.5">
              <Link href="/matching/student">
                Browse Jobs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card className="cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => router.push("/matching/student")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Jobs Near You</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{matchedJobsWithScore.length}</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => router.push("/matching/student")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500/10">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Top Match</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{topMatch}%</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => router.push("/student/profile")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-500/10">
                    <Star className="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">GPA</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{gpa !== null ? gpa.toFixed(1) : "—"}</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => router.push("/student/profile")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Recommended</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{hasRecommendation ? "Yes" : "No"}</p>
              </CardContent>
            </Card>
          </div>

          {/* MAIN GRID */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* JOB LIST */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Top Matches Near You</h2>
                <Link href="/matching/student" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {matchedJobsWithScore.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium text-foreground">No employers near you yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back soon — new jobs are added regularly.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {matchedJobsWithScore.slice(0, 5).map((job) => (
                    <Link key={job.id} href={`/matching/student/${job.id}`}>
                      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-secondary/30 hover:border-primary/20 transition-all cursor-pointer">
                        {/* Company initial */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {job.company[0]?.toUpperCase() || "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">{job.company}</p>
                            {job.tips && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">+ Tips</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">{job.title}</span>
                            <span className="text-xs font-semibold text-primary">{job.pay}</span>
                          </div>
                        </div>

                        {/* Match score */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-sm font-bold ${job.matchScore >= 75 ? "text-primary" : job.matchScore >= 50 ? "text-yellow-600" : "text-muted-foreground"}`}>
                            {job.matchScore}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">match</span>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {matchedJobsWithScore.length > 5 && (
                <Button variant="outline" asChild className="w-full mt-3">
                  <Link href="/matching/student">
                    See all {matchedJobsWithScore.length} jobs <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">

              {/* RECOMMENDATION STATUS */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Profile Strength</h2>
                <Card className={hasRecommendation ? "border-green-200 bg-green-50/30" : "border-primary/20 bg-primary/5"}>
                  <CardContent className="p-4">
                    {hasRecommendation ? (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Recommendation received</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Employers can see this on your profile — it sets you apart.</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Get a recommendation</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Ask a teacher, coach, or employer to vouch for you.</p>
                          </div>
                        </div>
                        <Button size="sm" className="w-full" onClick={() => router.push("/student/profile")}>
                          Request one now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* QUICK LINKS */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
                <div className="space-y-2">
                  <Link href="/matching/student" className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-secondary/30 transition-colors">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Browse all jobs</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto" />
                  </Link>
                  <Link href="/student/profile" className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-secondary/30 transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Edit my profile</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto" />
                  </Link>
                </div>
              </div>

              {/* GPA CARD */}
              {gpa !== null && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">GPA on file</p>
                        <p className="text-2xl font-bold text-foreground mt-0.5">{gpa.toFixed(2)}<span className="text-sm text-muted-foreground font-normal"> / 4.0</span></p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full text-xs h-7" onClick={() => router.push("/student/profile")}>
                      Update profile
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}