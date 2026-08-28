"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import {
  ChevronDown,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin,
  CreditCard,
  LogOut,
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
  // MULTI-LOCATION
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  // DISTANCES + RECOMMENDATIONS for scoring
  const [distances, setDistances] = useState<Record<string, number>>({})
  const [recommendations, setRecommendations] = useState<Record<string, boolean>>({})

  // AUTH
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace("/login"); return }
        const { data: roleData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
        if (!roleData?.role) { router.replace("/choose-role"); return }
        if (roleData.role !== "employer") { router.replace("/login"); return }
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status, profile_complete")
          .eq("id", user.id)
          .maybeSingle()
        const isSubscribed =
          profile?.subscription_status === "active" ||
          profile?.subscription_status === "freeactive"
        if (!isSubscribed) {
          if (!profile?.profile_complete) {
            router.replace("/employer/profile?missing=true")
          } else {
            router.replace("/pricing/mobile")
          }
          return
        }
        const { data: jobData } = await supabase
          .from("job")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!jobData) { router.replace("/employer/profile?missing=true"); return }
        const { data: locs } = await supabase
          .from("locations")
          .select("id")
          .eq("employer_id", jobData.id)
        if (!locs || locs.length === 0) {
          router.replace("/employer/profile?missing=true")
          return
        }
        setUserId(user.id)
      } catch (err) {
        router.replace("/login")
      }
    }
    checkAccess()
  }, [router])

  // LOAD COMPANY NAME
  useEffect(() => {
    if (!userId) return
    const loadCompany = async () => {
      const { data } = await supabase
        .from("job")
        .select("company, owner_name")
        .eq("user_id", userId)
        .single()
      if (!data) { setPageLoading(false); return }
      setCompanyName(data.company || "Your Company")
      setPageLoading(false)
    }
    loadCompany()
  }, [userId])

  // LOAD STUDENTS
  useEffect(() => {
    if (!userId) return
    const loadStudents = async () => {
      const { data } = await supabase
      .from("Students")
      .select("*")
      .eq("profile_complete", true)
      .neq("is_looking", false)
    setStudents(data || [])
    }
    loadStudents()
  }, [userId])

  // LOAD RECOMMENDATIONS
  useEffect(() => {
    if (!students.length) return
    const loadRecommendations = async () => {
      const { data } = await supabase
        .from("recommendations")
        .select("student_user_id")
        .eq("submitted", true)
      const map: Record<string, boolean> = {}
      ;(data || []).forEach((r) => { map[r.student_user_id] = true })
      setRecommendations(map)
    }
    loadRecommendations()
  }, [students])

  // LOAD DISTANCES for a location
  const loadDistances = async (locationId: string) => {
    const { data } = await supabase
      .from("employer_student_distances")
      .select("student_user_id, distance_meters")
      .eq("employer_location_id", locationId)
    const map: Record<string, number> = {}
    ;(data || []).forEach((d) => { map[d.student_user_id] = d.distance_meters })
    setDistances(map)
  }

  // LOAD ALL LOCATIONS
  useEffect(() => {
    if (!userId) return
    const loadJob = async () => {
      const { data: jobData } = await supabase
        .from("job")
        .select("shift_preference, preferred_jobs, id")
        .eq("user_id", userId)
        .single()
      if (!jobData) return
      setShiftPreference(jobData.shift_preference || "flexible")
      setPreferredJobs(jobData.preferred_jobs || [])
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name, available_shifts, shift_preference, preferred_jobs, max_distance_miles")
        .eq("employer_id", jobData.id)
        .order("created_at", { ascending: true })
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

  // LOAD NOTIFICATIONS
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

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("notifications-dashboard")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `employer_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // SEED STATUSES using distance filter
  useEffect(() => {
    if (!userId || students.length === 0 || statuses.length > 0) return
    const seedStatuses = async () => {
      const rows = students
        .filter((s) => s.profile_complete)
        .filter((s) => {
          const distMeters = distances[s.user_id]
          if (!distMeters) return false
          return distMeters <= selectedLocationMaxMiles * 1609.34
        })
        .map((s) => ({ employer_id: userId, student_id: s.id, status: "new" }))
      if (rows.length === 0) return
      await supabase
        .from("student_statuses")
        .upsert(rows, { onConflict: "employer_id,student_id", ignoreDuplicates: true })
      const { data } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", userId)
      setStatuses(data || [])
    }
    seedStatuses()
  }, [userId, students, statuses, distances, selectedLocationMaxMiles])

  // LOAD STATUSES
  useEffect(() => {
    if (!userId) return
    const loadStatuses = async () => {
      const { data, error } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", userId)
      if (error) return
      setStatuses(data || [])
    }
    loadStatuses()
  }, [userId])

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from("notifications").update({ read: true }).eq("id", id)
  }

  const candidatesWithScores = useMemo(() => {
    const activeShifts = employerShifts.filter(
      (s) => s.active === true || s.active === "true" || s.active === 1
    )
    return students
      .filter((s) => {
        const distMeters = distances[s.user_id]
        if (!distMeters) return false
        return distMeters <= selectedLocationMaxMiles * 1609.34
      })
      .map((s) => {
        const score = calculateEmployerMatch(
          { shifts: activeShifts, shiftPreference, preferred_jobs: preferredJobs },
          s.availability,
          s.shift_preference,
          s.gpa,
          s.preferred_jobs,
          recommendations[s.user_id] ?? false,
          distances[s.user_id] ?? undefined
        )
        return { ...s, matchScore: Math.round(score) }
      })
  }, [students, employerShifts, shiftPreference, preferredJobs, selectedLocationMaxMiles, distances, recommendations])

  const greatCandidates = candidatesWithScores.filter((c) => c.matchScore >= 75).length
  const perfectMatches = candidatesWithScores.filter((c) => c.matchScore === 100).length
  const topMatch = Math.max(0, ...candidatesWithScores.map((c) => c.matchScore || 0))
  const recentActivity = notifications.slice(0, 4)

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
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Company Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/employer/locations" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Locations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing/mobile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Billing
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
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {companyName}</h1>
          <p className="text-muted-foreground">Here's your hiring overview</p>
        </div>

        {/* LOCATION SELECTOR */}
        {allLocations.length > 1 && (
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-foreground mb-3">Viewing stats for location:</p>
              <div className="flex flex-wrap gap-2">
                {allLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationChange(loc.id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      selectedLocationId === loc.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Switch locations to see match scores and candidate counts filtered by each location.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Hiring Pipeline</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Link href="/matching/employer?status=new">
              <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
                <p className="text-sm text-muted-foreground">New</p>
                <p className="mt-2 text-3xl font-bold">{statuses.filter((s) => s.status === "new").length}</p>
              </div>
            </Link>
            <Link href="/matching/employer?status=contacted">
              <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="mt-2 text-3xl font-bold">{statuses.filter((s) => s.status === "contacted").length}</p>
              </div>
            </Link>
            <Link href="/matching/employer?status=hired">
              <div className="rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition">
                <p className="text-sm text-muted-foreground">Hired</p>
                <p className="mt-2 text-3xl font-bold">{statuses.filter((s) => s.status === "hired").length}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/40 transition" onClick={() => window.location.href = "/matching/employer"}>
          <CardContent className="p-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="flex flex-col gap-1">
              <p>You have <b>{greatCandidates}</b> strong candidates (75%+ match) ready to review.</p>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>Top Match: <b>{topMatch}%</b></span>
                <span>•</span>
                <Link href="/matching/employer?perfect=true" className="hover:text-foreground transition">
                  Perfect Matches: <b>{perfectMatches}</b>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              recentActivity.map((n) => {
                const studentName = n.student_name || n.message?.split(" applied to ")[0]?.trim()
                return (
                  <div key={n.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <span>{n.message}</span>
                    <div className="flex items-center gap-2">
                      {studentName && (
                <Button size="sm" variant="outline"
                onClick={async () => {
                  if (n.student_user_id) {
                    const { data } = await supabase
                      .from("Students")
                      .select("id")
                      .eq("user_id", n.student_user_id)
                      .maybeSingle()
                    if (data?.id) window.location.href = `/matching/employer/${data.id}`
                  }
                }}
              >
                View Profile
              </Button>
                      )}
                      <button onClick={() => dismissNotification(n.id)} className="text-muted-foreground">✕</button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Billing Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p>Current Plan: Employer Plan</p>
            <Button asChild>
              <Link href="/pricing/mobile">Manage Billing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">Ready to hire your next student?</p>
              <p className="text-sm opacity-80">View your full candidate pool</p>
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