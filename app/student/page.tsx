"use client"
import { useRouter } from "next/navigation"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast, Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Bell,
  User,
  Settings,
  LogOut,
  Award,
  TrendingUp
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



const parseHours = (hours: string) => {
  if (!hours) return 0
  if (hours.includes("Weekends")) return 8
  const match = hours.match(/(\d+)-?(\d+)?/)
  if (!match) return 0
  const start = parseInt(match[1])
  const end = match[2] ? parseInt(match[2]) : start
  return (start + end) / 2
}

// Simple match calculation using availability, GPA, and interests


export default function StudentDashboard() { 
  // <--- add this
  const [shiftPreference, setShiftPreference] =
  useState<"morning" | "night" | "flexible">("flexible")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
const [phone, setPhone] = useState("")
  
  type Notification = {
    id: string
    title: string
    read: boolean
  }
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  const router = useRouter()
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gpa, setGpa] = useState<number | null>(null)
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [schoolEmail, setSchoolEmail] = useState("")
  const [gpaStatus, setGpaStatus] = useState<
  "none" | "pending" | "approved" | "rejected"
>("none")

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
const [matchedJobsWithScore, setMatchedJobsWithScore] =
  useState<(Job & { matchScore: number })[]>([])
  const greatMatches = matchedJobsWithScore.filter(job => job.matchScore >= 45).length;
  const newJobsCount = matchedJobsWithScore.filter(job => job.status === "new").length;
  
  // Interests
  const [interests, setInterests] = useState<string[]>([
    "Music",
    "Sports",
    "Gaming",
    "Art",
  ])
  const [school, setSchool] = useState("")
  // ✅ Helper to check if GPA is verified

  const profileRef = useRef<HTMLDivElement>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([
    { day: "Monday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Tuesday", available: true, start: "3:00 PM", end: "8:00 PM", hours: "5" },
    { day: "Wednesday", available: false, start: "-", end: "-", hours: "-" },
    { day: "Thursday", available: true, start: "3:00 PM", end: "9:00 PM", hours: "6" },
    { day: "Friday", available: true, start: "3:00 PM", end: "10:00 PM", hours: "7" },
    { day: "Saturday", available: true, start: "9:00 AM", end: "6:00 PM", hours: "9" },
    { day: "Sunday", available: true, start: "12:00 PM", end: "5:00 PM", hours: "5" },
  ])
  const [profileCompletion, setProfileCompletion] = useState({
    basicInfo: true,
    gpa: false,
    availability: true,
    jobPreferences: true,
    intrests: true,
  });
  const [preferredJobs, setPreferredJobs] = useState<string[]>([
    "Retail",
    "Food Service",
    "Summer Jobs"
  ])
  const timeOptions = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
    "9:00 PM", "10:00 PM"
  ]
  useEffect(() => {
    const fetchJobs = async () => {
      // GET CURRENT STUDENT
      const {
        data: { user },
      } = await supabase.auth.getUser()
  
      if (!user) return
  
      // LOAD STUDENT DATA
      const { data: studentData, error: studentError } = await supabase
        .from("Students")
        .select("availability, shift_preference")
        .eq("user_id", user.id)
        .single()
  
      if (studentError || !studentData) {
        console.log("STUDENT FETCH ERROR:", studentError)
        return
      }
  
      // LOAD JOBS
      const { data: jobs, error: jobsError } = await supabase
        .from("job")
        .select(`
          id,
          title,
          company,
          location,
          hours,
          pay,
          status,
          shift_preference,
          available_shifts,
          has_tips
        `)
  
      if (jobsError) {
        console.log("JOB FETCH ERROR:", jobsError)
        return
      }
  
      const scoredJobs = (jobs || []).map((job: any) => {
        // CLEAN JOB SHIFTS
        let shifts = job.available_shifts ?? []
  
        if (!Array.isArray(shifts)) {
          shifts = Object.values(shifts || {})
        }
  
        const activeShifts = shifts.filter(
          (s: any) =>
            s.active === true ||
            s.active === "true" ||
            s.active === 1
        )
  
        const jobDays = activeShifts.map((s: any) => s.day)
  
        // CALCULATE MATCH SCORE
        const matchScore = calculateMatch(
          {
            availability: studentData.availability || [],
            shiftPreference:
              studentData.shift_preference || "flexible",
          },
          {
            shifts: jobDays,
            shiftPreference:
              job.shift_preference || "flexible",
          }
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
  
      // SORT BEST MATCH FIRST
      scoredJobs.sort(
        (a, b) => b.matchScore - a.matchScore
      )
  
      setMatchedJobsWithScore(scoredJobs)
    }
  
    fetchJobs()
  }, [])
  
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
  
      const { data, error } = await supabase
        .from("Students")
        .select("gpa, name, gpa_verification_status")        .eq("user_id", user.id)
        .single()
  
      if (error) {
        console.log("STUDENT FETCH ERROR:", error)
        return
      }
  
      console.log("STUDENT DATA:", data)
  
      // GPA
      const rawGpa = data?.gpa
      const parsedGpa =
        rawGpa !== null && rawGpa !== undefined
          ? Number(rawGpa)
          : null
  
      setGpa(isNaN(parsedGpa) ? null : parsedGpa)
      setGpaStatus(data?.gpa_verification_status || "none")
      // NAME 👇
      setName(data?.name || "")
    }
  
    fetchStudent()
  }, [])
 
  
  // Load saved interests from localStorage
useEffect(() => {
  const savedInterests = localStorage.getItem("interests");
  if (savedInterests) {
    setInterests(JSON.parse(savedInterests));
  }
}, []);
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest(".notification-dropdown") && !target.closest(".notification-button")) {
      setNotificationsOpen(false)
    }
  }
  document.addEventListener("click", handleClickOutside)
  return () => document.removeEventListener("click", handleClickOutside)
}, [])
  // Load saved data from localStorage
  useEffect(() => {
    const savedAvailability = localStorage.getItem("availability")
    if (savedAvailability) {
      const parsed: Availability[] = JSON.parse(savedAvailability).map(day => ({
        ...day,
        start: day.start === "-" ? "9:00 AM" : day.start,
        end: day.end === "-" ? "5:00 PM" : day.end,
      }))
      setAvailability(parsed)
    }
  
    const savedJobs = localStorage.getItem("preferredJobs")
    if (savedJobs) setPreferredJobs(JSON.parse(savedJobs))
  }, [])

  useEffect(() => {
 
   }, [availability, gpa, interests])
   return (
    <> <Toaster richColors position="top-right" />
  
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

    {/* LEFT */}
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        <Briefcase className="h-5 w-5 text-primary-foreground" />
      </div>

      <span className="text-xl font-bold text-foreground">
        SimplyApply
      </span>
    </Link>

    {/* CENTER NAV */}
    <div className="hidden items-center gap-6 md:flex">

      {/* ACTIVE PAGE */}
      <Link
        href="/student"
        className="text-base font-semibold text-foreground transition-all"
      >
        Dashboard
      </Link>

      {/* NOT ACTIVE */}
      <Link
        href="/matching/student"
        className="text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
      >
        Jobs near you
      </Link>

    </div>

    {/* RIGHT */}
    <div className="flex items-center gap-4">

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(name || "")
                .trim()
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(n => n[0]?.toUpperCase())
                .join("") || "?"}
            </div>

            <span className="hidden text-sm font-medium sm:block">
              {name}.
            </span>

          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">

          <DropdownMenuItem asChild>
            <Link href="/student/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Link>
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  </div>
</header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Ready to land your first job?</h1>
          <p className="mt-2 text-muted-foreground">
  {name ? `Welcome back, ${name}! ` : "Welcome! Complete your profile to get started."} 
  You have {newJobsCount} new job matches.
</p>
        </div>

        {/* Stats Cards */}
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* GPA Card */}
          <Card ref={profileRef} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10">
                <Star className="h-6 w-6 text-chart-4" />
              </div>
              <div>
              <p className="text-2xl font-bold text-foreground">
              {gpa !== null ? `${gpa.toFixed(1)} / 4.0` : "-- / 4.0"}
</p>
<p className="text-sm text-muted-foreground">
{gpaStatus === "approved"
  ? "Verified GPA"
  : "Upload a photo of your GPA to verify"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Match Score Card */}
          <Card className="border-border bg-card">
  <CardContent className="flex items-center gap-4 p-6">
    
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10">
  <span className="text-xl font-bold text-chart-2">
  {greatMatches}
</span>
</div>
<div>
<p className="text-base font-semibold text-foreground">
  Great Job Matches
</p>

</div>
    {/* Text */}
   
  </CardContent>
</Card>
          {/* Interviews Card */}
        
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Completion */}
          
            {/* Matches Near You */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Matches Near You</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/matching/student" className="gap-1 text-primary">
                      View All <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchedJobsWithScore.map(job => (
                  <Link
                    key={job.id}
                    href="/matching/student" // target page
                    className="block" // ensure Link fills the container
                  >
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50 cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          {job.status === "new" && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
                          {job.status === "applied" && <Badge variant="secondary" className="text-xs">Applied</Badge>}
                          {job.status === "interviewing" && <Badge className="bg-accent text-accent-foreground text-xs">Interview</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.distance}</span>
                         
                        </div>
                      </div>
                      
                      <div className="mt-1">
  <Badge variant="outline" className="text-xs capitalize">
    {job.shiftPreference} shifts
  </Badge>
</div>

<div className="text-right flex flex-col items-end gap-2">

  {/* PAY + TIPS INLINE */}
  <div className="flex items-center gap-2">
    <span className="font-semibold text-primary">
      {job.pay}
    </span>

    {job.tips ? (
      <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] px-2 py-0">
       + Tips
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] px-2 py-0">
        no tips
      </Badge>
    )}
  </div>

  {/* MATCH SCORE */}
  <Badge className="bg-primary/10 text-primary">
    {job.matchScore}% Match
  </Badge>

</div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          
          
            
            {/* <-- end of Preferred Jobs */}

            {/* Interests */}
         
          
          
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Verified Badge */}
            {/* GPA Verification */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
  {gpaStatus === "approved" ? (
    <div>
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-semibold">Verified Student</h3>
          <p className="text-sm text-muted-foreground">
            {gpa ? `${gpa.toFixed(1)} / 4.0` : "-- / 4.0"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Your GPA has been verified. Employers trust verified students more!
      </p>
    </div>
  ) : gpaStatus === "pending" ? (
    <p className="text-sm text-yellow-600">
      ⏳ Your GPA is under review
    </p>
  ) : (
    <Button onClick={() => router.push("/student/profile")}>
      Verify GPA
    </Button>
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