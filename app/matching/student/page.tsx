"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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
  ChevronLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {  calculateMatch } from "@/lib/matchScore"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
interface Job {
  id: number
  title: string
  company: string
  location: string
  pay: string
  tips?: boolean
  matchScore: number
  status: "new" | "applied" | "interviewing"
  shifts: { day: string; active: boolean }[]
  shift_Preference: string
}

interface Availability {
  day: string
  available: boolean
  start: string
  end: string
}
export default function MatchesPage() {
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
  
      if (!user) {
        router.replace("/login")
        return
      }
  
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
  
      if (!data.user) {
        router.replace("/login")
      }
    }
  
    checkAuth()
  }, [router])
 
  const [availability, setAvailability] = useState<Availability[]>([])
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([])
  const [filter, setFilter] =
  useState<"pay" | "tips" | "matchScore">("matchScore")

const [gpa, setGpa] = useState<number | null>(null)  
  const params = useParams()
  const [name, setName] = useState("")
  const jobId = Number(params.id)
  const [shift_Preference, setShift_Preference] =
  useState<"morning" | "night" | "flexible">("flexible")
  
  // Load availability
  useEffect(() => {
    const saved = localStorage.getItem("availability")
    if (saved) {
      setAvailability(JSON.parse(saved))
    }
  
    const savedShift = localStorage.getItem("shift_Preference")
    if (savedShift) {
      setShift_Preference(savedShift as "morning" | "night" | "flexible")
    }
  }, [])

  // ✅ Clean helper (FIXED)
  const parseHours = (hours: string): number => {
    if (!hours) return 0
    if (hours.includes("Weekends")) return 8

    const match = hours.match(/(\d+)-?(\d+)?/)
    if (!match) return 0

    const start = parseInt(match[1])
    const end = match[2] ? parseInt(match[2]) : start

    if (isNaN(start) || isNaN(end)) return 0

    return (start + end) / 2
  }


 // Recalculate scores
 useEffect(() => {
  const fetchJobs = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    // GET STUDENT DATA including zip code
    const { data: studentData, error: studentError } = await supabase
      .from("Students")
      .select("availability, shift_preference, zip_code")
      .eq("user_id", userId)
      .single()

    if (studentError) { console.log("STUDENT FETCH ERROR:", studentError); return }

    const studentAvailability = studentData?.availability ?? []
    const studentShiftPreference = studentData?.shift_preference || "flexible"
    const studentZip = studentData?.zip_code ?? ""

    // GET JOBS with zip info
    const { data, error } = await supabase
      .from("job")
      .select(`id, title, company, location, pay, details, available_shifts, shift_preference, status, hours, has_tips, zip_code, zip_match_precision`)

    if (error) { console.log("JOB FETCH ERROR:", error); return }

    const updated = (data || [])
      .filter((job: any) => {
        // Only show jobs where the employer can see this student
        const jobZip = job.zip_code ?? ""
        const precision = job.zip_match_precision ?? 5

        if (!jobZip || !studentZip) return false

        if (precision === 5) return jobZip === studentZip
        return jobZip.slice(0, 3) === studentZip.slice(0, 3)
      })
      .map((job: any) => {
        let shifts = job.available_shifts ?? []
        if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})

        const activeShifts = shifts.filter(
          (s: any) => s.active === true || s.active === "true" || s.active === 1
        )

        const base = calculateMatch(
          { availability: studentAvailability, shiftPreference: studentShiftPreference },
          { shifts: activeShifts.map((s: any) => s.day || s), shiftPreference: job.shift_preference || "flexible" }
        )

        return {
          id: job.id,
          title: job.title || "Untitled Job",
          company: job.company || "Unknown",
          pay: job.pay || "$0",
          status: job.status || "new",
          tips: Boolean(job.has_tips),
          shift_Preference: job.shift_preference || "flexible",
          matchScore: Math.round(base),
        }
      })

    setMatchedJobs(updated)
  }

  fetchJobs()
}, [])
useEffect(() => {
  const fetchStudentName = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("Students")
      .select("name")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.log("NAME FETCH ERROR:", error)
      return
    }

    setName(data?.name || "")
  }

  fetchStudentName()
}, [])
  // Sorting
  const parseDistance = (d: string) => parseFloat(d.split(" ")[0]) || 0
  const parsePay = (p: string) => parseFloat(p.replace(/[^0-9.]/g, "")) || 0
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches)
  }, [])
  const sortedJobs = [...matchedJobs].sort((a, b) => {
    switch (filter) {
      case "pay":
        return parsePay(b.pay) - parsePay(a.pay)
  
      case "tips":
        return Number(b.tips) - Number(a.tips)
  
      default:
        return b.matchScore - a.matchScore
    }
  })
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
  
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-background to-cyan-600/10" />
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
  
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
  
          <Button
            variant="ghost"
            className="gap-2 rounded-xl"
            onClick={() => router.push("/student")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
  
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/student"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
  
            <Link
              href="/matching/student"
              className="text-sm font-semibold text-primary"
            >
              Jobs Near You
            </Link>
          </div>
  
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            {!isMobile && (
  <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/student")}>
    <ChevronLeft className="h-5 w-5" />
    Back
  </Button>
)}
            </DropdownMenuTrigger>
  
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/student/profile">
                  Profile
                </Link>
              </DropdownMenuItem>
  
              <DropdownMenuSeparator />
  
              <DropdownMenuItem asChild>
                <Link href="/">
                  Log Out
                </Link>
              </DropdownMenuItem>
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
  
              <h1 className="text-4xl font-bold tracking-tight">
                Jobs Near You
              </h1>
  
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Browse local opportunities that match your schedule,
                preferences, and availability.
              </p>
            </div>
  
            <div className="grid grid-cols-3 gap-4">
  
              <Card className="border-blue-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Briefcase className="mx-auto mb-2 h-5 w-5  text-blue-500" />
                  <p className="text-xl font-bold">
                    {matchedJobs.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jobs
                  </p>
                </CardContent>
              </Card>
  
              <Card className="border-blue-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="mx-auto mb-2 h-5 w-5 text-blue-500" />
                  <p className="text-xl font-bold">
                    {matchedJobs.length > 0
                      ? Math.max(...matchedJobs.map(j => j.matchScore))
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best Match
                  </p>
                </CardContent>
              </Card>
  
              <Card className="border-green-500/20 bg-card/60 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-green-500" />
                  <p className="text-xl font-bold">
                    Ready
                  </p>
                  <p className="text-xs text-muted-foreground">
                    To Apply
                  </p>
                </CardContent>
              </Card>
  
            </div>
          </div>
        </div>
  
        {/* FILTERS */}
        <div className="mb-8 flex flex-wrap gap-3">
  
          <Button
            variant={filter === "matchScore" ? "default" : "outline"}
            onClick={() => setFilter("matchScore")}
            className="rounded-xl"
          >
            Best Match
          </Button>
  
          <Button
            variant={filter === "pay" ? "default" : "outline"}
            onClick={() => setFilter("pay")}
            className="rounded-xl"
          >
            Highest Pay
          </Button>
  
          <Button
            variant={filter === "tips" ? "default" : "outline"}
            onClick={() => setFilter("tips")}
            className="rounded-xl"
          >
            Tips Included
          </Button>
  
        </div>
  
        {/* JOBS GRID */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
  
          {sortedJobs.map((job) => (
            <Link
              key={job.id}
              href={`/matching/student/${job.id}`}
            >
              <Card className="group h-full cursor-pointer border-border/50 bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-2xl">
  
                <CardHeader>
  
                  <div className="flex items-start justify-between">
  
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
  
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.company}
                      </p>
                    </div>
  
                    <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20">                      {job.matchScore}% Match
                    </Badge>
  
                  </div>
                </CardHeader>
  
                <CardContent className="space-y-4">
  
                  <div className="flex flex-wrap gap-2">
  
                    <Badge variant="outline">
                      {job.shift_Preference}
                    </Badge>
  
                    {job.tips ? (
                      <Badge className="bg-green-500/10 text-green-600 border border-green-500/20">
                        + Tips
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        No Tips
                      </Badge>
                    )}
                  </div>
  
                  <p className="text-2xl font-bold text-primary">
                    {job.pay}
                  </p>
  
                  <Button
                    className="w-full rounded-xl"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
  
                      toast.success("Application sent successfully!")
                    }}
                  >
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
  
                </CardContent>
  
              </Card>
            </Link>
          ))}
  
        </div>
  
        {sortedJobs.length === 0 && (
          <Card className="mt-12 border-dashed bg-card/50 backdrop-blur-xl">
            <CardContent className="py-16 text-center">
  
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
  
              <h3 className="text-xl font-semibold">
                No Jobs Found
              </h3>
  
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