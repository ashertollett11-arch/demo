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
  
      <div className="min-h-screen bg-background px-4 py-4">
  
        {/* TITLE (optional but nice for mobile) */}
        <div className="mb-4">
          <h1 className="text-xl font-bold">Jobs Near You</h1>
          <p className="text-sm text-muted-foreground">
            Swipe through your best matches
          </p>
        </div>
  
        {/* JOB CARDS ONLY */}
        <div className="space-y-5">
          {matchedJobsWithScore.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              <MapPin className="mx-auto h-6 w-6 mb-2 opacity-60" />
              <p className="text-sm font-medium">
                No jobs found in your area yet
              </p>
              <p className="text-xs mt-1">
                Check back soon — new jobs are added regularly.
              </p>
            </div>
          ) : (
            matchedJobsWithScore.map((job) => (
              <Link
                key={job.id}
                href={`/matching/student/${job.id}`}
                className="block"
              >
                <div className="w-full rounded-3xl border border-border bg-card p-5 shadow-sm active:scale-[0.99] transition">
  
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                    </div>
  
                    <div className="text-sm font-semibold text-primary">
                      {job.matchScore}%
                    </div>
                  </div>
  
                  {/* BOTTOM INFO (you asked earlier to push everything down — this is it) */}
                  <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
  
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.distance}
                    </div>
  
                    <div className="font-semibold text-primary">
                      {job.pay}
                    </div>
  
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {job.tips ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">
                          + Tips
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No Tips
                        </Badge>
                      )}
  
                      <Badge variant="outline" className="text-xs capitalize">
                        {job.shiftPreference}
                      </Badge>
                    </div>
  
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )