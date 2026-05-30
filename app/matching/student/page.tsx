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
  const noJobs = sortedJobs.length === 0


  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
  {/* STICKY HEADER */}
  <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          {/* LEFT */}
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => (window.location.href = "/student")}
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>

          {/* CENTER NAV */}
          <div className="hidden items-center gap-6 md:flex">

{/* NOT ACTIVE */}
<Link
  href="/student"
  className="text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
>
  Dashboard
</Link>

{/* ACTIVE PAGE */}
<Link
  href="/matching/student"
  className="text-base font-semibold text-foreground transition-all"
>
  Jobs near you
</Link>

</div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

           

            {/* PROFILE */}
           {/* PROFILE */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="flex items-center gap-2">

      {/* PROFILE CIRCLE */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {(name || "")         
       .trim()
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join("") || "?"}
      </div>

      {/* COMPANY NAME */}
      <span className="hidden text-sm font-medium sm:block">
      {name}     
       </span>

    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-48">

    <DropdownMenuItem asChild>
    <Link href="/student/profile">
  Profile
</Link>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem asChild>
      <Link href="/">
        Log out
      </Link>
    </DropdownMenuItem>

  </DropdownMenuContent>
</DropdownMenu>

          </div>
        </div>
      </header>
      <h1 className="text-2xl font-bold mb-4">Jobs Near You</h1>

      <div className="flex gap-3 mb-6">
      <Button
  variant={filter === "pay" ? "default" : "outline"}
  size="sm"
  onClick={() => setFilter("pay")}
>
  Pay
</Button>

<Button
  variant={filter === "tips" ? "default" : "outline"}
  size="sm"
  onClick={() => setFilter("tips")}
>
  Tips
</Button>

<Button
  variant={filter === "matchScore" ? "default" : "outline"}
  size="sm"
  onClick={() => setFilter("matchScore")}
>
  Match
</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {noJobs ? (
  <div className="col-span-full">
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="text-lg mb-2">📍</div>
        <p className="font-medium">No jobs found in your area</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting filters or check back later
        </p>
      </CardContent>
    </Card>
  </div>
) : (
  sortedJobs.map(job => (
    <Link key={job.id} href={`/matching/student/${job.id}`}>
      <Card className="border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
        
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {job.title}
            {job.status === "new" && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
            {job.status === "applied" && <Badge variant="secondary" className="text-xs">Applied</Badge>}
            {job.status === "interviewing" && <Badge className="bg-accent text-accent-foreground text-xs">Interview</Badge>}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{job.company}</p>

          <div className="mt-1">
            <Badge variant="outline" className="text-xs capitalize">
              {job.shift_Preference} shifts
            </Badge>
          </div>

          <p className="font-semibold text-primary">{job.pay}</p>

          {job.tips ? (
            <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] px-2 py-0">
              + Tips
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              no tips
            </Badge>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            {job.matchScore}% Match
          </p>

          <Button
            size="sm"
            className="w-full mt-2"
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              // (keep your apply logic unchanged)
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>
    </Link>
  ))
)}
      </div>
    </div>
  )
}