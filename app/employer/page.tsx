"use client"
import { mapDbStudent } from "@/lib/students"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useMemo } from "react"
import { useRef } from "react"
import { 
  Briefcase, 
  Users, 
  Clock, 
  TrendingUp,
  CheckCircle2, 
  Star,
  Search,
  Bell,
  Settings,
  LogOut,
  Building2,
  Filter,
  MessageSquare,
  Calendar,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { supabase } from "@/lib/supabase"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"
const getSavedStatus = (id: string) => {
  if (typeof window === "undefined") return null

  return localStorage.getItem(`student-status-${id}`)
}


export default function EmployerDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("Your Company")
  const [notifications, setNotifications] = useState<any[]>([])
  const [ownerName, setOwnerName] = useState("")
const [showGreatOnly, setShowGreatOnly] = useState(false)
const [loadingStudents, setLoadingStudents] = useState(true)  
const [employerShifts, setEmployerShifts] = useState<any[]>([])
const [userId, setUserId] = useState<string | null>(null)

const handleSearchStudent = (name: string) => {
  setSearchQuery(name)
}  

  const studentDetailRef = useRef<HTMLDivElement | null>(null)
  const studentRefs = useRef<Record<string, HTMLDivElement | null>>({})
 
  const dismissNotification = async (id: string) => {
    // optimistic UI update
    setNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    )
  
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
  }
  const [shiftPreference, setShiftPreference] = useState<
    "morning" | "night" | "flexible"
  >("flexible")

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("Students")
        .select("*")
  
      if (error) {
        console.log("STUDENTS ERROR:", error)
        setLoadingStudents(false)
        return
      }
  
      console.log("RAW STUDENTS:", data)
  
      const mapped = (data || []).map((s) => {
        try {
          return mapDbStudent(s)
        } catch (e) {
          console.log("MAP ERROR:", e, s)
          return s // fallback so UI still works
        }
      })
  
      setStudents(mapped)
      setLoadingStudents(false)
    }
  
    loadStudents()
  }, [])
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    }
  
    getUser()
  }, [])
  useEffect(() => {
    if (!userId) return
  
    const loadCompanyInfo = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("company, owner_name")
        .eq("user_id", userId)
        .single()
  
      if (error) {
        console.log("COMPANY LOAD ERROR:", error)
        return
      }
  
      setCompanyName(data?.company || "Your Company")
      setOwnerName(data?.owner_name || "")
    }
  
    loadCompanyInfo()
  }, [userId])
  useEffect(() => {
    if (!userId) return
  
    const loadEmployerData = async () => {
      if (!userId) return
    
      const { data, error } = await supabase
        .from("job")
        .select("available_shifts, shift_preference, preferred_jobs")        .eq("user_id", userId)
        .single()
    
      if (error) {
        console.log("JOB LOAD ERROR:", error)
        return
      }
    
      if (!data) return
    
      let shifts = data.available_shifts ?? []
    
      if (typeof shifts === "string") {
        try {
          shifts = JSON.parse(shifts)
        } catch {
          shifts = []
        }
      }
    
      if (!Array.isArray(shifts)) {
        shifts = Object.values(shifts || {})
      }
    
      setEmployerShifts(shifts)
      setShiftPreference(data.shift_preference || "flexible")
      setPreferredJobs(data.preferred_jobs || [])
    }
    loadEmployerData()
  
    const channel = supabase
      .channel("job-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job",
          filter: `employer_id=eq.${userId}`,
        },
        () => loadEmployerData()
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
  
    const loadNotifications = async () => {
      const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("employer_id", userId)
      .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(20)
  
      if (error) {
        console.log("NOTIFICATION LOAD ERROR:", error)
        return
      }
  
      setNotifications(data || [])
    }
  
    loadNotifications()
  }, [userId])
  useEffect(() => {
    if (!userId) return
  
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `employer_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
 
  const [students, setStudents] = useState<any[]>([])
  


  const candidatesWithScores = useMemo(() => {
    return students.map((candidate: any) => {
      const activeShifts = Array.isArray(employerShifts)
        ? employerShifts.filter(
            (s) => s.active === true || s.active === "true" || s.active === 1
          )
        : []
  
      const jobDays = activeShifts.map((s) => s.day)
  
      const matchScore = calculateEmployerMatch(
        {
          shifts: jobDays,
          shiftPreference,
          preferred_jobs: preferredJobs,
        },
        candidate.availability,
        candidate.shiftPreference,
        candidate.gpa,
        candidate.preferredJobs
      )
  
      // 🔥 FIND STATUS FROM TABLE
  
      return {
        ...candidate,
        matchScore,
      }
    })
  }, [students, employerShifts, shiftPreference, userId])
const hiresThisMonth = candidatesWithScores.filter(
  (c) => false
).length

const greatCandidates = candidatesWithScores.filter(
  (c) => c.matchScore >= 75
).length

const filteredCandidates = candidatesWithScores
.filter((candidate) => {
  const matchesSearch = candidate.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase())

  const matchesStatus =
    statusFilter === "all" || candidate.status === statusFilter

  const matchesGreat = !showGreatOnly || candidate.matchScore >= 75

  return matchesSearch && matchesStatus && matchesGreat
})
  .sort((a, b) => b.matchScore - a.matchScore)
 
 

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-foreground">
              Dashboard
            </Link>
            <Link href="/matching/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Find Candidates
            </Link>
            <Link href="/billing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Billing
            </Link>
          </div>
        

          <div className="flex items-center gap-4">
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" className="relative overflow-visible">
    <Bell className="h-5 w-5" />

    {notifications.filter((n) => !n.read).length > 0 && (
 <span className="absolute -top-1 -right-1 z-50 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-black shadow-md">
 {notifications.filter((n) => !n.read).length > 9 ? "9+" : notifications.filter((n) => !n.read).length}
</span>
    )}
  </Button>
</DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-80">
  <div className="max-h-80 overflow-y-auto">
  {notifications.filter((n) => !n.read).length === 0 ? (
    <div className="p-4 text-sm text-muted-foreground">
      No notifications yet
    </div>
  ) : (
    notifications.map((n) => (
      <div
      key={n.id}
      className="relative border-b p-3 hover:bg-muted/50"
    >
      {/* X button */}
      <button
        onClick={() => dismissNotification(n.id)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-red-500"
      >
        ✕
      </button>
    
      <p className="text-sm font-medium pr-6">{n.title}</p>
    
      <p className="mt-1 text-xs text-muted-foreground pr-6">
        {n.message}
      </p>
    
      {n.student_user_id && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => {
            dismissNotification(n.id)            
            handleSearchStudent(n.message?.split(" ")[0] || "")
          }}
        >
          View Profile
        </Button>
      )}
    </div>
    ))
  )}
</div>
  </DropdownMenuContent>
</DropdownMenu>
            
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="flex items-center gap-2 rounded-full border border-border px-3 py-2 hover:bg-muted/50">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
        {(companyName || "")
          .trim()
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("") || "?"}
      </div>

      <span className="hidden text-sm font-medium sm:block">
        {companyName}
      </span>

      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="w-52 rounded-xl border border-border bg-card p-2 shadow-lg"
  >
    {/* Profile */}
    <DropdownMenuItem asChild className="p-0">
      <Link
        href="/employer/profile"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
      >
        <Building2 className="mr-2 h-4 w-4" />
        Company Profile
      </Link>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    {/* Logout FIXED */}
    <DropdownMenuItem asChild className="p-0">
      <Link
        href="/"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
      >
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Employer Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Find and hire motivated students for your team.
            </p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/matching/employer">
              <Users className="h-4 w-4" />
              Find Candidates
            </Link>
          </Button>
        </div>
   
        {/* Metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
              </div>
              <div>
              <p className="text-2xl font-bold text-foreground">
  {hiresThisMonth}
</p>
                <p className="text-sm text-muted-foreground">Hires this month</p>
              </div>
            </CardContent>
          </Card>
          
          <Card
  className={`border-border bg-card cursor-pointer transition ${
    showGreatOnly ? "ring-2 ring-primary" : ""
  }`}
  onClick={() => setShowGreatOnly((prev) => !prev)}
>
  <CardContent className="flex items-center gap-4 p-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
      <TrendingUp className="h-6 w-6 text-primary" />
    </div>

    <div>
      <p className="text-2xl font-bold text-foreground">
        {greatCandidates}
      </p>
      <p className="text-sm text-muted-foreground">
        {showGreatOnly ? "Showing 75%+ matches" : "Great candidates"}
      </p>
    </div>
  </CardContent>
</Card>
          

        
        </div>

        {/* Candidate Feed */}
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Candidate Feed</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
         
            {filteredCandidates.slice(0, 3).map((candidate) => (  <Link
  key={candidate.id}
  href={`/matching/employer?search=${encodeURIComponent(candidate.name)}`}
  className="block"
>
    <div className="flex flex-col gap-4 p-6 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between cursor-pointer border-b border-border">

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {candidate.name.split(" ").map(n => n[0]).join("")}
        </div>

        <div>
  <h3 className="font-semibold flex items-center gap-2">
    {candidate.name}

    {/* VERIFIED BADGE */}
    {candidate.is_gpa_verified && (
      <Badge variant="outline" className="text-[10px] gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    )}
  </h3>

  <p className="text-sm text-muted-foreground">
    GPA: {candidate.gpa}
  </p>

  {/* STATUS BADGE */}
  <div className="mt-1">
  
  </div>
</div>
      </div>

      <div className="flex items-center gap-2">
  <span className="text-sm font-medium text-primary">
    {candidate.matchScore}% match
  </span>

  <Button size="sm">
    View More
  </Button>
</div>
    </div>
  </Link>
))}

            </div>

            {filteredCandidates.length > 3 && (
  <div className="flex justify-center p-6">
    <Button asChild variant="outline">
      <Link href="/matching/employer">
        View All Candidates
      </Link>
    </Button>
  </div>
)}

            {loadingStudents ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-muted-foreground">Loading students...</p>
  </div>
) : filteredCandidates.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Users className="h-12 w-12 text-muted-foreground/50" />
    <p className="mt-4 text-muted-foreground">No students found</p>
  </div>
) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
