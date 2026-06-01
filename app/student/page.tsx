"use client"
import Image from "next/image"

import { useRouter } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  Star,
  ChevronRight,
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
  title: string
  company: string
  distance: string
  hours: string
  pay: string
  tips?: boolean
  status?: string
  shiftPreference?: string
}

export default function StudentDashboard() {
  const router = useRouter()

  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gpa, setGpa] = useState<number | null>(null)
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [gpaStatus, setGpaStatus] = useState<"none" | "pending" | "approved" | "rejected">("none")
  const [matchedJobsWithScore, setMatchedJobsWithScore] = useState<(Job & { matchScore: number })[]>([])
  const [interests, setInterests] = useState<string[]>(["Music", "Sports", "Gaming", "Art"])
  const [school, setSchool] = useState("")
  const [availability, setAvailability] = useState<Availability[]>([
    { day: "Monday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Tuesday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Wednesday", available: false, start: "-", end: "-", hours: "-" },
    { day: "Thursday", available: true, start: "3:00 PM", end: "9:00 PM", hours: "6" },
    { day: "Friday", available: true, start: "3:00 PM", end: "10:00 PM", hours: "7" },
    { day: "Saturday", available: true, start: "9:00 AM", end: "6:00 PM", hours: "9" },
    { day: "Sunday", available: true, start: "12:00 PM", end: "5:00 PM", hours: "5" },
  ])
  const [preferredJobs, setPreferredJobs] = useState<string[]>(["Retail", "Food Service", "Summer Jobs"])

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
  
      const { data: jobs, error: jobsError } = await supabase
        .from("job")
        .select(`id, title, company, location, hours, pay, status, shift_preference, available_shifts, has_tips, zip_code, zip_match_precision`)
  
      if (jobsError) return
  
      const scoredJobs = (jobs || [])
        .filter((job: any) => {
          const jobZip = job.zip_code ?? ""
          const precision = job.zip_match_precision ?? 5
          if (!jobZip || !studentZip) return false
          if (precision === 5) return jobZip === studentZip
          return jobZip.slice(0, 3) === studentZip.slice(0, 3)
        })
        .map((job: any) => {
          let shifts = job.available_shifts ?? []
          if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
          const activeShifts = shifts.filter((s: any) => s.active === true || s.active === "true" || s.active === 1)
          const jobDays = activeShifts.map((s: any) => s.day)
  
          const matchScore = calculateMatch(
            { availability: studentData.availability || [], shiftPreference: studentData.shift_preference || "flexible" },
            { shifts: jobDays, shiftPreference: job.shift_preference || "flexible" }
          )
  
          return {
            id: job.id,
            title: job.title || "Untitled Job",
            company: job.company || "Unknown Company",
            distance: job.location || "N/A",
            hours: job.hours || "N/A",
            pay: job.pay || "N/A",
            status: job.status || "new",
            shiftPreference: job.shift_preference || "flexible",
            tips: Boolean(job.has_tips),
            matchScore: Math.round(matchScore),
          }
        })
  
      scoredJobs.sort((a, b) => b.matchScore - a.matchScore)
      setMatchedJobsWithScore(scoredJobs)
    }
  
    fetchJobs()
  }, [])

  // -------------------------
  // FETCH STUDENT
  // -------------------------
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data: studentData, error } = await supabase
        .from("Students")
        .select("gpa, name, gpa_verification_status")
        .eq("user_id", user.id)
        .single()

      if (error) return

      const rawGpa = studentData?.gpa
      const parsedGpa = rawGpa !== null && rawGpa !== undefined ? Number(rawGpa) : null
      setGpa(isNaN(parsedGpa as number) ? null : parsedGpa)
      setGpaStatus(studentData?.gpa_verification_status || "none")
      setName(studentData?.name || "")
    }

    fetchStudent()
  }, [])

  useEffect(() => {
    const savedInterests = localStorage.getItem("interests")
    if (savedInterests) setInterests(JSON.parse(savedInterests))
  }, [])

  useEffect(() => {
    const savedAvailability = localStorage.getItem("availability")
    if (savedAvailability) {
      const parsed: Availability[] = JSON.parse(savedAvailability).map((day: any) => ({
        ...day,
        start: day.start === "-" ? "9:00 AM" : day.start,
        end: day.end === "-" ? "5:00 PM" : day.end,
      }))
      setAvailability(parsed)
    }
    const savedJobs = localStorage.getItem("preferredJobs")
    if (savedJobs) setPreferredJobs(JSON.parse(savedJobs))
  }, [])

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-background overflow-x-hidden">

        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

            {/* LEFT */}
            <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center">
          <Image
  src="/icon-192x192.png"
  alt="SimplyApply logo"
  width={28}
  height={28}
  className="object-contain"
/>
</div>
              <span className="text-lg font-bold text-foreground truncate">SimplyApply</span>
            </Link>

            {/* CENTER NAV */}
            <div className="hidden items-center gap-6 md:flex">
              <Link href="/student" className="text-base font-semibold text-foreground">Dashboard</Link>
              <Link href="/matching/student" className="text-sm font-medium text-muted-foreground hover:text-foreground">Jobs near you</Link>
            </div>

            {/* RIGHT */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 shrink-0 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(name || "").trim().split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
                  </div>
                  <span className="hidden text-sm font-medium sm:block max-w-[100px] truncate">{name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/student/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
  onClick={async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }}
>
  Log out
</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                    {gpa !== null ? `${gpa.toFixed(1)}/4.0` : "--/4.0"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {gpaStatus === "approved" ? "Verified GPA" : "Tap to verify"}
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

{/* Hide title on mobile */}
<span className="hidden sm:block">
  Matches Near You
</span>

{/* Centered View All on mobile */}
<Button
  variant="ghost"
  size="sm"
  asChild
  className="mx-auto sm:mx-0"
>
  <Link href="/matching/student" className="gap-1 text-primary text-sm">
    View All <ChevronRight className="h-4 w-4" />
  </Link>
</Button>

</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-3 p-0 sm:p-6">
                                      {matchedJobsWithScore.length === 0 ? (
    <div className="text-center py-10 text-muted-foreground">
      <MapPin className="mx-auto h-6 w-6 mb-2 opacity-60" />
      <p className="text-sm font-medium">
        No employers in your zip range yet
      </p>
      <p className="text-xs mt-1">
        Check back soon — new jobs are added regularly.
      </p>
    </div>
  ) : (
    matchedJobsWithScore.map(job => (
<Link
  key={job.id}
  href={`/matching/student/${job.id}`}
  className="block mb-3 sm:mb-0"
><div className="w-full rounded-2xl sm:rounded-xl border border-border bg-secondary/30 px-4 py-4 sm:p-3 transition-colors hover:bg-secondary/50">
         {/* TOP ROW */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <h3 className="font-semibold text-foreground text-sm">{job.title}</h3>
                {job.status === "new" && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
                {job.status === "applied" && <Badge variant="secondary" className="text-xs">Applied</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            <Badge className="bg-primary/10 text-primary shrink-0 text-xs">
              {job.matchScore}%
            </Badge>
          </div>

          {/* BOTTOM ROW */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{job.distance}
            </span>
            <span className="font-semibold text-primary text-xs">{job.pay}</span>
            {job.tips ? (
              <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] px-2 py-0">+ Tips</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-2 py-0">no tips</Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-2 py-0 capitalize">
              {job.shiftPreference}
            </Badge>
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
                  {gpaStatus === "approved" ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-semibold">Verified Student</h3>
                          <p className="text-sm text-muted-foreground">
                            {gpa ? `${gpa.toFixed(1)} / 4.0` : "-- / 4.0"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Your GPA has been verified. Employers trust verified students more!
                      </p>
                    </div>
                  ) : gpaStatus === "pending" ? (
                    <p className="text-sm text-yellow-600">⏳ Your GPA is under review</p>
                  ) : (
                    <div className="space-y-3">
                      <Button className="w-full" onClick={() => router.push("/student/profile")}>
                        Verify GPA
                      </Button>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">How GPA verification works</p>
                        <p>Upload a screenshot showing your <span className="font-semibold text-foreground">full name</span> and <span className="font-semibold text-foreground">unweighted GPA</span>.</p>
                        <p>Verified students get higher trust and better match results.</p>
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