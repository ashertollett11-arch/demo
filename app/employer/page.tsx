"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import {
  ChevronDown, ArrowRight, Sparkles, Building2, MapPin, CreditCard, LogOut,
  Users, TrendingUp, CheckCircle2, Bell, ChevronRight, HelpCircle,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"

export default function EmployerDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [selectedLocationMaxMiles, setSelectedLocationMaxMiles] = useState<number>(10)
  const [pageLoading, setPageLoading] = useState(true)
  const [companyLoaded, setCompanyLoaded] = useState(false)
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [statusesLoaded, setStatusesLoaded] = useState(false)
  const [distancesLoaded, setDistancesLoaded] = useState(false)
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [distances, setDistances] = useState<Record<string, number>>({})
  const [recommendations, setRecommendations] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace("/login"); return }
        const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
        if (!roleData?.role) { router.replace("/choose-role"); return }
        if (roleData.role !== "employer") { router.replace("/login"); return }
        const { data: profile } = await supabase.from("profiles").select("subscription_status, profile_complete").eq("id", user.id).maybeSingle()
        const isSubscribed = profile?.subscription_status === "active" || profile?.subscription_status === "freeactive"
        if (!isSubscribed) { router.replace(!profile?.profile_complete ? "/employer/profile?missing=true" : "/pricing/mobile"); return }
        const { data: jobData } = await supabase.from("job").select("id").eq("user_id", user.id).maybeSingle()
        if (!jobData) { router.replace("/employer/profile?missing=true"); return }
        const { data: locs } = await supabase.from("locations").select("id").eq("employer_id", jobData.id)
        if (!locs || locs.length === 0) { router.replace("/employer/profile?missing=true"); return }
        setUserId(user.id)
      } catch { router.replace("/login") }
    }
    checkAccess()
  }, [router])

  useEffect(() => {
    if (!userId) return
    const loadCompany = async () => {
      const { data } = await supabase.from("job").select("company, owner_name").eq("user_id", userId).single()
      if (!data) { setCompanyLoaded(true); return }
      setCompanyName(data.company || "Your Company")
      setCompanyLoaded(true)
    }
    loadCompany()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const loadStudents = async () => {
      const { data } = await supabase.from("Students").select("*").eq("profile_complete", true).neq("is_looking", false)
      setStudents(data || [])
      setStudentsLoaded(true)
    }
    loadStudents()
  }, [userId])

  useEffect(() => {
    if (!students.length) return
    const loadRecommendations = async () => {
      const { data } = await supabase.from("recommendations").select("student_user_id").eq("submitted", true)
      const map: Record<string, boolean> = {}
      ;(data || []).forEach((r) => { map[r.student_user_id] = true })
      setRecommendations(map)
    }
    loadRecommendations()
  }, [students])

  const loadDistances = async (locationId: string) => {
    const { data } = await supabase.from("employer_student_distances").select("student_user_id, distance_meters").eq("employer_location_id", locationId)
    const map: Record<string, number> = {}
    ;(data || []).forEach((d) => { map[d.student_user_id] = d.distance_meters })
    setDistances(map)
    setDistancesLoaded(true)
  }

  useEffect(() => {
    if (!userId) return
    const loadJob = async () => {
      const { data: jobData } = await supabase.from("job").select("shift_preference, preferred_jobs, id").eq("user_id", userId).single()
      if (!jobData) return
      setShiftPreference(jobData.shift_preference || "flexible")
      setPreferredJobs(jobData.preferred_jobs || [])
      const { data: locations } = await supabase.from("locations").select("id, name, available_shifts, shift_preference, preferred_jobs, max_distance_miles").eq("employer_id", jobData.id).order("created_at", { ascending: true })
      if (locations?.length) {
        setAllLocations(locations)
        setSelectedLocationId(locations[0].id)
        const first = locations[0]
        setEmployerShifts(first.available_shifts ?? [])
        setShiftPreference(first.shift_preference ?? "flexible")
        setSelectedLocationMaxMiles(first.max_distance_miles ?? 10)
        if (first.preferred_jobs?.length > 0) setPreferredJobs(first.preferred_jobs)
        loadDistances(locations[0].id)
      }
    }
    loadJob()
  }, [userId])

  const handleLocationChange = (locationId: string) => {
    const loc = allLocations.find(l => l.id === locationId)
    if (!loc) return
    setSelectedLocationId(locationId)
    setEmployerShifts(loc.available_shifts ?? [])
    setShiftPreference(loc.shift_preference ?? "flexible")
    setSelectedLocationMaxMiles(loc.max_distance_miles ?? 10)
    if (loc.preferred_jobs?.length > 0) setPreferredJobs(loc.preferred_jobs)
    loadDistances(locationId)
  }

  useEffect(() => {
    if (!userId) return
    const loadNotifications = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("employer_id", userId).eq("read", false).order("created_at", { ascending: false })
      setNotifications(data || [])
    }
    loadNotifications()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel("notifications-dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `employer_id=eq.${userId}` },
        (payload) => { setNotifications((prev) => [payload.new, ...prev]) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (!userId || students.length === 0 || statuses.length > 0) return
    const seedStatuses = async () => {
      const rows = students.filter((s) => s.profile_complete).filter((s) => { const d = distances[s.user_id]; if (!d) return false; return d <= selectedLocationMaxMiles * 1609.34 }).map((s) => ({ employer_id: userId, student_id: s.id, status: "new" }))
      if (rows.length === 0) return
      await supabase.from("student_statuses").upsert(rows, { onConflict: "employer_id,student_id", ignoreDuplicates: true })
      const { data } = await supabase.from("student_statuses").select("*").eq("employer_id", userId)
      setStatuses(data || [])
    }
    seedStatuses()
  }, [userId, students, statuses, distances, selectedLocationMaxMiles])

  useEffect(() => {
    if (!userId) return
    const loadStatuses = async () => {
      const { data, error } = await supabase.from("student_statuses").select("*").eq("employer_id", userId)
      if (error) { setStatusesLoaded(true); return }
      setStatuses(data || [])
      setStatusesLoaded(true)
    }
    loadStatuses()
  }, [userId])

  useEffect(() => {
    if (companyLoaded && studentsLoaded && statusesLoaded && distancesLoaded) setPageLoading(false)
  }, [companyLoaded, studentsLoaded, statusesLoaded, distancesLoaded])

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from("notifications").update({ read: true }).eq("id", id)
  }

  const candidatesWithScores = useMemo(() => {
    const activeShifts = employerShifts.filter((s) => s.active === true || s.active === "true" || s.active === 1)
    return students
      .filter((s) => { const d = distances[s.user_id]; if (!d) return false; return d <= selectedLocationMaxMiles * 1609.34 })
      .map((s) => {
        const score = calculateEmployerMatch(
          { shifts: activeShifts, shiftPreference, preferred_jobs: preferredJobs },
          s.availability, s.shift_preference, s.gpa, s.preferred_jobs,
          recommendations[s.user_id] ?? false, distances[s.user_id] ?? undefined
        )
        return { ...s, matchScore: Math.round(score) }
      })
  }, [students, employerShifts, shiftPreference, preferredJobs, selectedLocationMaxMiles, distances, recommendations])

  const visibleStudentIds = new Set(candidatesWithScores.map((c) => c.id))
  const visibleStatuses = statuses.filter((s) => visibleStudentIds.has(s.student_id))
  const greatCandidates = candidatesWithScores.filter((c) => c.matchScore >= 75).length
  const perfectMatches = candidatesWithScores.filter((c) => c.matchScore === 100).length
  const topMatch = Math.max(0, ...candidatesWithScores.map((c) => c.matchScore || 0))
  const recentActivity = notifications.slice(0, 5)

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
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <Image src="/icon-192x192.png" alt="SimplyApply logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-foreground">Dashboard</Link>
            <Link href="/matching/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Find Candidates</Link>
            <Link href="/employer/locations" className="text-sm font-medium text-muted-foreground hover:text-foreground">Locations</Link>
            <Link href="/pricing/mobile" className="text-sm font-medium text-muted-foreground hover:text-foreground">Billing</Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                  {companyName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{companyName}</span>
                  <span className="text-xs text-muted-foreground">Employer</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {companyName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
                    <p className="text-xs text-muted-foreground">Employer Account</p>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/employer/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Company Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/employer/locations" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Locations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing/mobile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help & Support
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {companyName}</h1>
                      <p className="mt-1 text-muted-foreground">Here's your hiring overview for today.</p>
          </div>
          <Button asChild>
            <Link href="/matching/employer">
              Find Candidates <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* LOCATION SELECTOR */}
        {allLocations.length > 1 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground mb-3">Viewing stats for location:</p>
            <div className="flex flex-wrap gap-2">
              {allLocations.map((loc) => (
                <button key={loc.id} onClick={() => handleLocationChange(loc.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedLocationId === loc.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STATS ROW */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <Link href="/matching/employer?status=new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                    <Users className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">New</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{visibleStatuses.filter((s) => s.status === "new").length}</p>
                <p className="text-xs text-muted-foreground mt-1">candidates to review</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/matching/employer?status=contacted">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Contacted</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{visibleStatuses.filter((s) => s.status === "contacted").length}</p>
                <p className="text-xs text-muted-foreground mt-1">awaiting response</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/matching/employer?status=hired">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Hired</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{visibleStatuses.filter((s) => s.status === "hired").length}</p>
                <p className="text-xs text-muted-foreground mt-1">students hired</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/matching/employer">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Top Match</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{topMatch}%</p>
                <p className="text-xs text-muted-foreground mt-1">{greatCandidates} strong candidates</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT — activity + how it works */}
          <div className="lg:col-span-2 space-y-6">

            {/* RECENT ACTIVITY */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Recent Activity</span>
                  {notifications.length > 0 && <Badge className="bg-red-100 text-red-600 text-xs">{notifications.length} new</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">When students apply you'll see it here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentActivity.map((n) => (
                      <div key={n.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {n.message?.split(" applied")[0]?.trim().split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </div>
                          <p className="text-sm text-foreground truncate">{n.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={async (e) => {
                              const btn = e.currentTarget
                              btn.textContent = "..."
                              btn.setAttribute("disabled", "true")
                              if (n.student_user_id) {
                                const { data } = await supabase.from("Students").select("id").eq("user_id", n.student_user_id).maybeSingle()
                                if (data?.id) {
                                  window.location.href = `/matching/employer/${data.id}`
                                } else {
                                  toast.error("Couldn't find that student profile.")
                                  btn.textContent = "View"
                                  btn.removeAttribute("disabled")
                                }
                              } else {
                                toast.error("No student linked to this notification.")
                                btn.textContent = "View"
                                btn.removeAttribute("disabled")
                              }
                            }}>
                            View
                          </Button>
                          <button onClick={() => dismissNotification(n.id)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HOW IT WORKS */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How SimplyApply Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { n: "1", title: "Browse matched candidates", desc: "Go to Find Candidates to see students near your location, sorted by match score based on their availability, GPA, and preferences." },
                  { n: "2", title: "Reach out directly", desc: "Click a student's profile to see their contact info — phone and email. Reach out to them directly however works best for you." },
                  { n: "3", title: "Mark their status", desc: "After contacting a student, mark them as Contacted on their profile. This notifies them and keeps your pipeline organized. Mark as Hired once you've made your decision." },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">{item.n}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT — quick actions sidebar */}
          <div className="space-y-6">

            {/* STRONG CANDIDATES */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Strong Candidates</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{greatCandidates}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">75%+ match score ready to review</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Top match: <b className="text-foreground">{topMatch}%</b></span>
                  <Link href="/matching/employer?perfect=true" className="text-primary hover:underline">
                    {perfectMatches} perfect matches
                  </Link>
                </div>
                <Button asChild className="w-full">
                  <Link href="/matching/employer">
                    Find Candidates <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* QUICK LINKS */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-3">Quick Actions</p>
                <div className="space-y-1">
                  {[
                    { label: "View all candidates", href: "/matching/employer", icon: Users },
                    { label: "Manage locations", href: "/employer/locations", icon: MapPin },
                    { label: "Edit company profile", href: "/employer/profile", icon: Building2 },
                    { label: "Billing & plan", href: "/pricing/mobile", icon: CreditCard },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground flex-1">{label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BILLING */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-1">Current Plan</p>
                <p className="text-xs text-muted-foreground mb-3">Employer Plan — active</p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/pricing/mobile">Manage Billing</Link>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}