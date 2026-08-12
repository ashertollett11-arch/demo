"use client"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  MapPin,
  Sparkles,
  User,
  Star,
  LogOut,
  Bell,
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
  hours: string
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
  const [availability, setAvailability] = useState<Availability[]>([
    { day: "Monday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Tuesday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Wednesday", available: false, start: "-", end: "-", hours: "-" },
    { day: "Thursday", available: true, start: "3:00 PM", end: "9:00 PM", hours: "6" },
    { day: "Friday", available: true, start: "3:00 PM", end: "10:00 PM", hours: "7" },
    { day: "Saturday", available: true, start: "9:00 AM", end: "6:00 PM", hours: "9" },
    { day: "Sunday", available: true, start: "12:00 PM", end: "5:00 PM", hours: "5" },
  ])

  const greatMatches = matchedJobsWithScore.filter(job => job.matchScore >= 45).length
  const newJobsCount = matchedJobsWithScore.filter(job => job.status === "new").length

  // -------------------------
  // AUTH + PROFILE CHECK
  // -------------------------
  useEffect(() => {
    const checkProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) { router.replace("/login"); return }
  
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
  
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
  
      const { data: profile } = await supabase
        .from("Students")
        .select("profile_complete")
        .eq("user_id", user.id)
        .maybeSingle()
  
      if (!profile || !profile.profile_complete) {
        router.replace("/student/onboarding?missing=true")
        return
      }
    }
    checkProfile()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("from") === "profile" && params.get("saved") === "true") {
      setTimeout(() => { toast.success("Profile saved!") }, 0)
    }
  }, [])

  // -------------------------
  // FETCH JOBS
  // -------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: studentData, error: studentError } = await supabase
        .from("Students")
        .select("availability, shift_preference, zip_code")
        .eq("user_id", user.id)
        .single()

      if (studentError || !studentData) return

      const studentZip = studentData?.zip_code ?? ""

      const { data: locations, error: locError } = await supabase
        .from("locations")
        .select(`
          id,
          name,
          address,
          zip_code,
          zip_match_precision,
          available_shifts,
          shift_preference,
          hourly_pay,
          has_tips,
          preferred_jobs,
          employer_id,
          job:employer_id (
            id,
            company,
            details,
            status
          )
        `)

      if (locError)  return 

      const scoredJobs = (locations || [])
        .filter((loc: any) => {
          const locZip = loc.zip_code ?? ""
          const precision = loc.zip_match_precision ?? 5
          if (!locZip || !studentZip) return false
          if (precision === 5) return locZip === studentZip
          return locZip.slice(0, 3) === studentZip.slice(0, 3)
        })
        .map((loc: any) => {
          let shifts = loc.available_shifts ?? []
          if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
          const activeShifts = shifts.filter((s: any) => s.active === true || s.active === "true" || s.active === 1)
          const jobDays = activeShifts.map((s: any) => s.day)

          const matchScore = calculateMatch(
            { availability: studentData.availability || [], shiftPreference: studentData.shift_preference || "flexible" },
            { shifts: jobDays, shiftPreference: loc.shift_preference || "flexible" }
          )

          return {
            id: loc.id,
            jobId: loc.job?.id,
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

  // -------------------------
  // FETCH STUDENT + RECOMMENDATION
  // -------------------------
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) { setPageLoading(false); return }
      const { data: studentData, error } = await supabase
        .from("Students")
        .select("gpa, name, gpa_verification_status")
        .eq("user_id", user.id)
        .single()
      if (error) { setPageLoading(false); return }
      const rawGpa = studentData?.gpa
      const parsedGpa = rawGpa !== null && rawGpa !== undefined ? Number(rawGpa) : null
      setGpa(isNaN(parsedGpa as number) ? null : parsedGpa)
      setName(studentData?.name || "")
      const { data: rec } = await supabase
        .from("recommendations")
        .select("id, submitted")
        .eq("student_user_id", user.id)
        .eq("submitted", true)
        .maybeSingle()
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
      .from("student_notifications")
      .select("*")
      .eq("student_user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
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

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-background overflow-x-hidden">

        {/* HEADER */}
       {/* HEADER */}
<header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl" suppressHydrationWarning>
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

    {/* LEFT */}
    <div className="w-24">
      <Button variant="ghost" className="hidden sm:flex items-center gap-2" onClick={() => router.push("/student")}>
        <ChevronLeft className="h-5 w-5" />
        Back
      </Button>
    </div>

    {/* CENTER */}
    <div className="hidden md:flex items-center gap-8">
    <Link
  href="/student"
  className={`text-sm font-medium transition-colors hover:text-foreground ${
    pathname === "/student" ? "text-primary font-semibold" : "text-muted-foreground"
  }`}
>
  Dashboard
</Link>
<Link
  href="/matching/student"
  className={`text-sm font-medium transition-colors hover:text-foreground ${
    pathname === "/matching/student" ? "text-primary font-semibold" : "text-muted-foreground"
  }`}
>
  Jobs Near You
</Link>
    </div>

    {/* RIGHT */}
    <div className="flex items-center gap-2 w-24 justify-end">
      {/* BELL */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {studentNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" suppressHydrationWarning>
                {studentNotifications.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-sm text-foreground">Notifications</p>
            {studentNotifications.length > 0 && (
              <Badge className="bg-red-100 text-red-600 text-xs">{studentNotifications.length} new</Badge>
            )}
          </div>
          {studentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {studentNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">📲</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setStudentNotifications(prev => prev.filter(x => x.id !== n.id))
                      await supabase.from("student_notifications").update({ read: true }).eq("id", n.id)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PROFILE */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1 shrink-0 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
              {(name || "").trim().split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(name || "").trim().split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground">Student Account</p>
              </div>
            </div>
          </div>
          <div className="py-1">
            <DropdownMenuItem asChild>
              <Link href="/student/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/matching/student" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Jobs Near You
              </Link>
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator />
          <div className="py-1">
            <DropdownMenuItem
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

  </div>
</header>

        <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

          {/* WELCOME */}
          <div className="mb-6 hidden sm:block">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">Ready to land your first job?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {name ? `Welcome back, ${name}! ` : "Welcome! "}
              You have {newJobsCount} new job matches.
            </p>
          </div>

          {/* STATS CARDS */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              className="hidden sm:block border-border bg-card cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => router.push("/student/profile")}
            >
             <CardContent className="flex items-center gap-3 p-4">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
    <Star className="h-5 w-5 text-chart-4" />
  </div>
  <div className="min-w-0">
    <p className="text-lg font-bold text-foreground truncate">
      {gpa !== null ? `${gpa.toFixed(1)}/4.0` : "--/4.0 GPA"}
    </p>
  </div>
</CardContent>
            </Card>

            <Card
              className="hidden sm:block border-border bg-card cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => router.push("/matching/student")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
                  <span className="text-lg font-bold text-chart-2">{greatMatches}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Great Matches</p>
                  <p className="text-xs text-muted-foreground">75%+ match score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MAIN + SIDEBAR */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* MAIN */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border bg-card sm:rounded-xl sm:border">
                <CardHeader>
                  <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-lg">
                    <span className="hidden sm:block">Matches Near You</span>
                    <Button variant="ghost" size="sm" asChild className="mx-auto sm:mx-0">
                      <Link href="/matching/student" className="gap-1 text-primary text-sm">
                        View All <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:space-y-3 space-y-6">
                  {matchedJobsWithScore.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <MapPin className="mx-auto h-6 w-6 mb-2 opacity-60" />
                      <p className="text-sm font-medium">No employers in your zip range yet</p>
                      <p className="text-xs mt-1">Check back soon — new jobs are added regularly.</p>
                    </div>
                  ) : (
                    matchedJobsWithScore.map(job => (
                      <Link key={job.id} href={`/matching/student/${job.id}`} className="block mb-3 sm:mb-0">
                        <div className="w-full rounded-3xl border border-border/60 bg-secondary/30 px-5 py-8 sm:px-6 sm:py-5 transition-colors hover:bg-secondary/50 min-h-[32vh] sm:min-h-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1">
                              <h3 className="font-semibold text-foreground text-xl sm:text-lg">{job.company}</h3>
                                                              {job.status === "new" && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
                                {job.status === "applied" && <Badge variant="secondary" className="text-xs">Applied</Badge>}
                              </div>
                              <p className="text-base sm:text-sm text-muted-foreground mt-1">{job.title}</p>
                                                          </div>
                            <Badge className="bg-primary/10 text-primary shrink-0 text-sm px-3 py-1">
                              {job.matchScore}%
                            </Badge>
                          </div>
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-xs">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.distance}
                              </span>
                              <span className="font-semibold text-primary">{job.pay}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {job.tips ? (
                                <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-xs px-2 py-1">+ Tips</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-2 py-1">No Tips</Badge>
                              )}
                              <Badge variant="outline" className="text-xs px-2 py-1 capitalize">
                                {job.shiftPreference}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-5">
                  {hasRecommendation ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-semibold">Recommended </h3>
                          <p className="text-sm text-muted-foreground">You have a recommendation</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Employers can see your recommendation on your profile. This builds trust and sets you apart!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button className="w-full" onClick={() => router.push("/student/profile")}>
                        Get a Recommendation
                      </Button>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">How recommendations work</p>
                        <p>Ask a <span className="font-semibold text-foreground">teacher, coach, or employer</span> to recommend you.</p>
                        <p>Their recommendation shows up on your profile and helps you stand out to local employers.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}