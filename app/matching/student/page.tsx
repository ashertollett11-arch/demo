"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
}

interface Availability {
  day: string
  available: boolean
  start: string
  end: string
}

export default function MatchesPage() {
  const router = useRouter()

  const [availability, setAvailability] = useState<Availability[]>([])
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState<"pay" | "tips" | "matchScore">("matchScore")
  const [name, setName] = useState("")
  const [shift_Preference, setShift_Preference] = useState<"morning" | "night" | "flexible">("flexible")
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  // -------------------------
  // AUTH + PROFILE CHECK
  // -------------------------
  useEffect(() => {
    const checkProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) { router.replace("/login"); return }
      const { data: profile } = await supabase
        .from("Students")
        .select("profile_complete")
        .eq("user_id", user.id)
        .maybeSingle()
      if (!profile || !profile.profile_complete) {
        router.replace("/student/profile?missing=true")
      }
    }
    checkProfile()
  }, [router])

  // -------------------------
  // FETCH JOBS + APPLIED STATUS
  // -------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) return

      const { data: studentData, error: studentError } = await supabase
        .from("Students")
        .select("availability, shift_preference, zip_code")
        .eq("user_id", userId)
        .single()

      if (studentError) return

      const studentAvailability = studentData?.availability ?? []
      const studentShiftPreference = studentData?.shift_preference || "flexible"
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

      if (locError) return

      // Load which locations this student has already applied to
      const { data: applications } = await supabase
        .from("location_applications")
        .select("location_id")
        .eq("student_user_id", userId)

      const appliedSet = new Set((applications || []).map((a: any) => a.location_id))
      setAppliedIds(appliedSet)

      const updated = (locations || [])
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
          const activeShifts = shifts.filter(
            (s: any) => s.active === true || s.active === "true" || s.active === 1
          )
          const base = calculateMatch(
            { availability: studentAvailability, shiftPreference: studentShiftPreference },
            { shifts: activeShifts.map((s: any) => s.day || s), shiftPreference: loc.shift_preference || "flexible" }
          )
          return {
            id: loc.id,
            title: loc.name || "Untitled Location",
            company: loc.job?.company || "Unknown",
            details: loc.job?.details || "",
            pay: loc.hourly_pay ? `$${loc.hourly_pay}/hr` : "$0",
            status: loc.job?.status || "new",
            tips: Boolean(loc.has_tips),
            shift_Preference: loc.shift_preference || "flexible",
            matchScore: Math.round(base),
            preferredJobs: loc.preferred_jobs || [],
          }
        })

      setMatchedJobs(updated)
    }

    fetchJobs()
  }, [])

  // -------------------------
  // FETCH STUDENT NAME
  // -------------------------
  useEffect(() => {
    const fetchStudentName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("Students")
        .select("name")
        .eq("user_id", user.id)
        .single()
      if (error) return
      setName(data?.name || "")
    }
    fetchStudentName()
  }, [])

  const parsePay = (p: string) => parseFloat(p.replace(/[^0-9.]/g, "")) || 0

  const sortedJobs = [...matchedJobs].sort((a, b) => {
    switch (filter) {
      case "pay": return parsePay(b.pay) - parsePay(a.pay)
      case "tips": return Number(b.tips) - Number(a.tips)
      default: return b.matchScore - a.matchScore
    }
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-background" suppressHydrationWarning>

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-background to-cyan-600/10" />
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Button variant="ghost" className="hidden sm:flex items-center gap-2" onClick={() => router.push("/student")}>
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/student" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/matching/student" className="text-sm font-semibold text-primary">
              Jobs Near You
            </Link>
          </div>

          <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="flex items-center gap-2 shrink-0 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
        {(name || "").trim().split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
      </div>
      <div className="hidden md:flex flex-col items-start">
        <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{name}</span>
        <span className="text-xs text-muted-foreground">Student</span>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    {/* ACCOUNT INFO */}
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

    {/* MENU ITEMS */}
    <div className="py-1">
      <DropdownMenuItem asChild>
        <Link href="/student/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          My Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
      
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

      {/* PAGE CONTENT */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">

        {/* HERO */}
        <div className="mb-8 rounded-3xl border border-blue-500/20 bg-card/80 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-4 bg-violet-500/10 text-violet-600 border border-blue-500/20">
                <Sparkles className="mr-1 h-3 w-3" />
                Personalized Matches
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">Jobs Near You</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Browse local opportunities that match your schedule, preferences, and availability.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-blue-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Briefcase className="mx-auto mb-2 h-5 w-5 text-blue-500" />
                  <p className="text-xl font-bold">{matchedJobs.length}</p>
                  <p className="text-xs text-muted-foreground">Jobs</p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="mx-auto mb-2 h-5 w-5 text-blue-500" />
                  <p className="text-xl font-bold">
                    {matchedJobs.length > 0 ? Math.max(...matchedJobs.map(j => j.matchScore)) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Best Match</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-green-500" />
                  <p className="text-xl font-bold">{appliedIds.size}</p>
                  <p className="text-xs text-muted-foreground">Applied</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button variant={filter === "matchScore" ? "default" : "outline"} onClick={() => setFilter("matchScore")} className="rounded-xl">
            Best Match
          </Button>
          <Button variant={filter === "pay" ? "default" : "outline"} onClick={() => setFilter("pay")} className="rounded-xl">
            Highest Pay
          </Button>
          <Button variant={filter === "tips" ? "default" : "outline"} onClick={() => setFilter("tips")} className="rounded-xl">
            Tips Included
          </Button>
        </div>

        {/* JOBS GRID */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedJobs.map((job) => {
            const alreadyApplied = appliedIds.has(job.id)
            return (
              <Link key={job.id} href={`/matching/student/${job.id}`}>
                <Card className="group h-full cursor-pointer border-border/50 bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-2xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
  {job.company}
</CardTitle>
<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{job.title}</p>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                        {job.matchScore}% Match
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{job.shift_Preference}</Badge>
                      {job.tips ? (
                        <Badge className="bg-green-500/10 text-green-600 border border-green-500/20">+ Tips</Badge>
                      ) : (
                        <Badge variant="outline">No Tips</Badge>
                      )}
                      {alreadyApplied && (
                        <Badge className="bg-primary/10 text-primary border border-primary/20">Applied ✓</Badge>
                      )}
                    </div>

                    <p className="text-2xl font-bold text-primary">{job.pay}</p>

                    <Button
                      className="w-full rounded-xl"
                      variant={alreadyApplied ? "secondary" : "default"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {alreadyApplied ? "View Details" : "View & Apply"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {sortedJobs.length === 0 && (
          <Card className="mt-12 border-dashed bg-card/50 backdrop-blur-xl">
            <CardContent className="py-16 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Jobs Found</h3>
              <p className="mt-2 text-muted-foreground">
                We couldn't find any jobs matching your location right now.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}