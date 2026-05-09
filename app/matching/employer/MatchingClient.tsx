"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  
  import { ChevronDown, User, Bell, LogOut } from "lucide-react"


import { useRouter, useSearchParams } from "next/navigation"
import {

  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  Filter,
  X,
  Zap,
  ChevronLeft,
  Calendar,
  DollarSign,
  ArrowUpDown
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"



const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-sky-100 text-sky-700">New</Badge>
  
      case "contacted":
        return <Badge className="bg-blue-100 text-blue-700">Contacted</Badge>
  
      case "hired":
        return <Badge className="bg-green-100 text-green-700">Hired</Badge>
  
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }
  
const jobTypes = ["Retail", "Food Service", "Summer Jobs"]
const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]
function FilterContent({
    minGpa,
    setMinGpa,
    selectedDays,
    setSelectedDays,
    verifiedOnly,
    setVerifiedOnly,
    daysOfWeek,
    activeFiltersCount,
    clearFilters,
  }: any) {
    return (
      <div className="space-y-6">
        {/* GPA INPUT (NEW) */}
      
      
        <div>
          
          <Label className="text-sm font-medium">Minimum GPA</Label>
          <input
  type="number"
  min="1.0"
  max="4.0"
  step="0.1"
  value={minGpa[0] === "" ? "" : minGpa[0]}
  onChange={(e) => {
    const value = e.target.value
  
    // allow empty
    if (value === "") {
      setMinGpa([""])
      return
    }
  
    let val = parseFloat(value)
  
    // ✅ HARD CAP at 4 while typing
    if (val > 4) val = 4
  
    setMinGpa([val])
  }}
  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
/>
        </div>
  
        {/* Job Type */}
       
  
        {/* Availability */}
        <div>
          <Label className="mb-3 block text-sm font-medium">Availability</Label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day: string) => (
              <Button
                key={day}
                variant={selectedDays.includes(day) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedDays.includes(day)) {
                    setSelectedDays(selectedDays.filter((d: string) => d !== day))
                  } else {
                    setSelectedDays([...selectedDays, day])
                  }
                }}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
  
        {/* Verified Only */}
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={verifiedOnly}
            onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
          />
          <label className="text-sm">Verified students only</label>
        </div>
  
        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            Clear all filters
          </Button>
        )}
      </div>
    )
  }
export default function MatchingPage() {
    const [name, setName] = useState("Employer")
    const [minGpa, setMinGpa] = useState<(number | "")[]>([1.0])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"matchScore" | "gpa">("matchScore")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [companyName, setCompanyName] = useState("Your Company")

  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
const [mounted, setMounted] = useState(false)
const [scoredCandidates, setScoredCandidates] = useState<any[]>([])  
const router = useRouter()
const [activeStatus, setActiveStatus] = useState<"new" | "contacted" | "hired">("new")
const [students, setStudents] = useState<any[]>([])
const [notifications, setNotifications] = useState<any[]>([])
const [userId, setUserId] = useState<string | null>(null)
const [employerId, setEmployerId] = useState<string | null>(null) 
const [loading, setLoading] = useState(true)
const [statuses, setStatuses] = useState<any[]>([])  
const [searchQuery, setSearchQuery] = useState("")
useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
  
      console.log("🔥 Fetching students from Supabase...")
  
      try {
        const { data, error, status } = await supabase
          .from("Students")
          .select("*")
  
        console.log("📡 Supabase status:", status)
        console.log("📦 raw data:", data)
        console.log("📊 students length:", data?.length) // ✅ FIXED HERE
        console.log("⚠️ raw error:", error)
  
        if (error) {
          console.error("❌ Supabase returned error:", error.message)
          setStudents([])
          return
        }
  
        setStudents(
          (data ?? []).map((s) => ({
            ...s,
            availability: s.availability ?? [],
            gpa: s.gpa ?? 0,
          }))
        )
      } catch (err) {
        console.error("💥 Unexpected crash:", err)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
  
    loadStudents()
  }, [])

  
  const safeEmployerShifts = employerShifts?.length
  ? employerShifts
  : [
      { day: "Monday", active: true },
      { day: "Tuesday", active: true },
      { day: "Wednesday", active: true },
    ]
   
   useEffect(() => {
  const loadJob = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user?.id) return

    const { data } = await supabase
      .from("job")
      .select("available_shifts, shift_preference")
      .eq("user_id", user.user.id)
      .single()

    if (!data) return

    setEmployerShifts(data.available_shifts ?? [])
    setShiftPreference(data.shift_preference ?? "flexible")
  }

  loadJob()
}, [])
   
const activeShifts = useMemo(() => {
    return Array.isArray(employerShifts)
      ? employerShifts.filter((s) => s.active === true || s.active === "true" || s.active === 1)
      : []
  }, [employerShifts])
  
  const jobDays = useMemo(() => {
    return activeShifts.map((s) => s.day)
  }, [activeShifts])    

  useEffect(() => {
    const loadEmployer = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user?.id) return
  
      setEmployerId(data.user.id)
    }
  
    loadEmployer()
  }, [])
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    }
  
    getUser()
  }, [])
  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
  }
  useEffect(() => {
    if (!employerId) return
  
    const loadStatuses = async () => {
      const { data, error } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", employerId)
  
      if (error) {
        console.error(error)
        return
      }
  
      setStatuses(data || [])
    }
  
    loadStatuses()
  }, [employerId])
 
  const searchParams = useSearchParams()

  useEffect(() => {
    const search = searchParams.get("search")
  
    if (!search) return
  
    setSearchQuery(search)
    router.replace("/matching/employer")
  }, [searchParams, router])
 
  useEffect(() => {
    if (!userId) return
  
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("employer_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
  
      if (error) {
        console.log(error)
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
  useEffect(() => {
    if (!employerId || students.length === 0) return
  
    const seedStatuses = async () => {
      // get existing statuses first
      const { data: existing, error: existingError } = await supabase
        .from("student_statuses")
        .select("student_id")
        .eq("employer_id", employerId)
  
      if (existingError) {
        console.error(existingError)
        return
      }
  
      const existingIds = new Set(
        (existing || []).map((s) => s.student_id)
      )
  
      // only create missing rows
      const rowsToInsert = students
        .filter((student) => !existingIds.has(student.id))
        .map((student) => ({
          employer_id: employerId,
          student_id: student.id,
          status: "new",
        }))
  
      // nothing new to insert
      if (rowsToInsert.length === 0) return
  
      const { error } = await supabase
        .from("student_statuses")
        .insert(rowsToInsert)
  
      if (error) {
        console.error("Error seeding statuses:", error.message)
        return
      }
  
      // refresh local state
      setStatuses((prev) => [...prev, ...rowsToInsert])
    }
  
    seedStatuses()
  }, [employerId, students])

  useEffect(() => {
        if (!students.length) return
      
        const results = students.map((candidate) => {
            const matchScore = calculateEmployerMatch(
                {
                  shifts: jobDays,
                  shiftPreference,
                  preferred_jobs: candidate.preferredJobs || [], // or global preferredJobs if you have it
                },
                candidate.availability,
                candidate.shift_preference,
                candidate.gpa,
                candidate.preferredJobs
              )
      
          return {
            ...candidate,
            matchScore: Math.round(matchScore),
          }
        })
      
        setScoredCandidates(results)
      }, [students, employerShifts, shiftPreference])
     
      useEffect(() => {
        if (
          statusParam === "new" ||
          statusParam === "contacted" ||
          statusParam === "hired"
        ) {
          setActiveStatus(statusParam)
        }
      }, [statusParam])
     
     useEffect(() => {
        const loadEmployerName = async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser()
      
          if (!user) return
      
          const { data, error } = await supabase
            .from("job")
            .select("company")
            .eq("user_id", user.id)
            .single()
      
          if (error) {
            console.error(error)
            return
          }
      
          setName(data?.company || "Employer")
        }
      
        loadEmployerName()
      }, [])
      const statusPriority: Record<string, number> = {
        new: 0,
        contacted: 1,
        hired: 2,
      }
      
      const filteredCandidates = scoredCandidates.map((candidate) => {
       
        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase()
          
            const matchesName = candidate.name?.toLowerCase().includes(q)
            const matchesJob = candidate.preferredJobs?.some((j: string) =>
              j.toLowerCase().includes(q)
            )
          
            if (!matchesName && !matchesJob) return false
          }
       
       
        const statusRow = statuses.find(
          (s) =>  s.student_id === candidate.id
        )
      
        return {
          ...candidate,
          status: statusRow?.status || "new",
        }
      })
        .filter((candidate) => {
          if (candidate.gpa < minGpa[0]) return false
          
          
          const perfect = searchParams.get("perfect")

          if (perfect === "true" && candidate.matchScore !== 100) {
            return false
          }
          
          if (verifiedOnly && !candidate.is_gpa_verified) return false  
      
          const safeAvailability = candidate.availability ?? []
      
          if (selectedDays.length > 0) {
            const hasMatch = safeAvailability.some(
              (a: any) => a.available && selectedDays.includes(a.day)
            )
      
            if (!hasMatch) return false
          }
      
          return true
        })
        .sort((a, b) => {
          // 🔥 group by pipeline stage first
          if (statusPriority[a.status] !== statusPriority[b.status]) {
            return statusPriority[a.status] - statusPriority[b.status]
          }
      
          // 🔥 then sort inside each group
          if (sortBy === "matchScore") return b.matchScore - a.matchScore
          if (sortBy === "gpa") return b.gpa - a.gpa
      
          return 0
        })

        const groupedCandidates = {
            new: filteredCandidates.filter(c => c.status === "new"),
            contacted: filteredCandidates.filter(c => c.status === "contacted"),
            hired: filteredCandidates.filter(c => c.status === "hired"),
          }
          useEffect(() => {
            if (!filteredCandidates.length) return
          
            // 🚨 if status came from URL, NEVER override it
            if (statusParam) return
          
            // if current tab has data, keep it
            if (groupedCandidates[activeStatus]?.length > 0) return
          
            // otherwise auto-switch to first non-empty tab
            const firstAvailableTab = (["new", "contacted", "hired"] as const).find(
              (status) => groupedCandidates[status].length > 0
            )
          
            if (firstAvailableTab) {
              setActiveStatus(firstAvailableTab)
            }
          }, [filteredCandidates, activeStatus, statusParam])


  const clearFilters = () => {
    setMinGpa([1.0])
    

    setSelectedDays([])
    setVerifiedOnly(false)
  }

  const activeFiltersCount = [
    minGpa[0] > 1.0,
    selectedDays.length > 0,
    verifiedOnly,
  ].filter(Boolean).length

 

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

    {/* LEFT: Logo */}
    <Button
  variant="ghost"
  className="flex items-center gap-2"
  onClick={() => router.push("/employer")}
>
  <ChevronLeft className="h-5 w-5" />
  Back
</Button>
    {/* CENTER NAV (same style as dashboard) */}
    <div className="hidden items-center gap-6 md:flex">
      <Link href="/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Dashboard
      </Link>

      <Link href="/matching/employer" className="text-sm font-medium text-foreground">
        Find Candidates
      </Link>

      <Link href="/billing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Billing
      </Link>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex items-center gap-4">

     

      {/* PROFILE DROPDOWN (same as dashboard style) */}
     {/* PROFILE DROPDOWN (MATCHING DASHBOARD STYLE) */}
     <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />

      {notifications.filter((n) => !n.read).length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-black">
          {notifications.filter((n) => !n.read).length > 9
            ? "9+"
            : notifications.filter((n) => !n.read).length}
        </span>
      )}
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-80">
    <div className="p-2 text-sm font-medium border-b">
      Notifications
    </div>

    {notifications.length === 0 ? (
      <div className="p-4 text-sm text-muted-foreground">
        No new notifications
      </div>
    ) : (
      <div className="max-h-72 overflow-y-auto">
        {notifications.map((n) => (
        <div
        key={n.id}
        className="flex items-start justify-between gap-2 p-3 hover:bg-transparent data-[highlighted]:bg-transparent"
      >
          <div className="text-sm">
  {n.message ?? "New notification"}
</div>

<div className="mt-3 flex items-center justify-between">
  <Button
    size="sm"
    variant="secondary"
    className="h-8 gap-2 text-xs"
    onClick={() => {
        const name =
        n.student_name ||
        n.message?.split(" applied to ")[0]?.trim()

      if (name) {
        setSearchQuery(name)
        setActiveStatus("new")
      }
    }}
  >
    <User className="h-3.5 w-3.5" />
    View Profile
  </Button>
</div>

            <button
              onClick={() => dismissNotification(n.id)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              X
            </button>
          </div>
        ))}
      </div>
    )}
  </DropdownMenuContent>
</DropdownMenu>
    
    
<div className="flex items-center gap-4">

    

<DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" className="flex items-center gap-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold">
    {name?.[0]?.toUpperCase() || "?"}
    </div>
    <ChevronDown className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem asChild>
      <Link href="/employer/profile">Company Profile</Link>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem asChild>
      <Link href="/">Log out</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

</div>

    
    </div>
  </div>
</header>


      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Find Your Perfect Match
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse verified students filtered by availability, GPA, and job preferences. No resumes to review.
          </p>
        </div>

        {/* How Matching Works */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Matching</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                Our algorithm matches students based on verified GPA, availability, job preferences, and location. A major factor is schedule fit — how many of your required workdays overlap with a student’s availability. The more overlap, the higher the match score. Higher scores mean a better overall fit for your position.                </p>
              </div>
            </div>
          </CardContent>
        </Card>
{/* Verified GPA Info */}
<Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
  <CardContent className="p-6">
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <CheckCircle2 className="h-5 w-5 text-primary" />
      </div>

      <div>
        <h3 className="font-semibold text-foreground">
          Verified GPA Badge
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Students with the verified badge have submitted proof of their GPA
          for review. This helps employers confidently identify academically
          reliable candidates and reduces the risk of inaccurate self-reported
          grades.
        </p>
      </div>
    </div>
  </CardContent>
</Card>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <Card className="sticky top-24 border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
              <FilterContent
  minGpa={minGpa}
  setMinGpa={setMinGpa}
  selectedDays={selectedDays}
  setSelectedDays={setSelectedDays}
  verifiedOnly={verifiedOnly}
  setVerifiedOnly={setVerifiedOnly}
  jobTypes={jobTypes}
  daysOfWeek={daysOfWeek}
  activeFiltersCount={activeFiltersCount}
  clearFilters={clearFilters}
/>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
{/* Search Bar */}
<div className="mb-4 flex items-center gap-2">
  <input
    placeholder="Search students by name..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
  />

  {searchQuery.trim() !== "" && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSearchQuery("")}
    >
      Clear search
    </Button>
  )}
</div>
            {/* Mobile Filters & Sort */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                  <FilterContent
  minGpa={minGpa}
  setMinGpa={setMinGpa}
  selectedDays={selectedDays}
  setSelectedDays={setSelectedDays}
  verifiedOnly={verifiedOnly}
  setVerifiedOnly={setVerifiedOnly}
  jobTypes={jobTypes}
  daysOfWeek={daysOfWeek}
  activeFiltersCount={activeFiltersCount}
  clearFilters={clearFilters}
/>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {filteredCandidates.length} candidates
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 gap-2">
                   
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
  <SelectItem value="matchScore">Best Match</SelectItem>
  <SelectItem value="gpa">Highest GPA</SelectItem>
</SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Pills */}
            {activeFiltersCount > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {minGpa[0] > 1.0 && (
                  <Badge variant="secondary" className="gap-1">
                    GPA ≥ {minGpa[0].toFixed(1)}
                    <button onClick={() => setMinGpa([1.0])}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              
               
                {selectedDays.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDays.join(", ")}
                    <button onClick={() => setSelectedDays([])}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {verifiedOnly && (
                  <Badge variant="secondary" className="gap-1">
                    Verified only
                    <button onClick={() => setVerifiedOnly(false)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Candidate Cards */}
           {/* Candidate Columns */}
{/* Status Tabs */}
<div className="flex gap-2 mb-6">
  {(["new", "contacted", "hired"] as const).map((status) => (
    <Button
      key={status}
      variant={activeStatus === status ? "default" : "outline"}
      onClick={() => setActiveStatus(status)}
      className="capitalize"
    >
      {status} ({groupedCandidates[status].length})
    </Button>
  ))}
</div>

{/* Cards */}
<div className="grid gap-4 sm:grid-cols-2">
(groupedCandidates[activeStatus] ?? []).map(
        <Card
      key={candidate.id}
      className="border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {candidate.name?.split(" ").map(n => n[0]).join("")}
                        </div>

            <div>
              <h3 className="font-semibold text-foreground">
                {candidate.name}
              </h3>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>GPA: {candidate.gpa}</span>

                {candidate.is_gpa_verified && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {getStatusBadge(candidate.status)}
            </div>
          </div>

          <Badge className="bg-primary/10 text-primary">
            {candidate.matchScore}% match
          </Badge>

        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Available:{" "}
          {(candidate.availability ?? [])
            .filter((a: any) => a?.available)
            .map((a: any) => a?.day)
            .join(", ") || "None"}
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/matching/employer/${candidate.id}`)        }}
          >
            View Profile
          </Button>

          <Select
value={
    statuses.find(
      (s) =>
        s.student_id === candidate.id &&
        s.employer_id === employerId
    )?.status || "new"
  }           onValueChange={async (value) => {
    if (!employerId) return
  
    const newStatus = value as "new" | "contacted" | "hired"
  
    setStatuses((prev) => {
      const exists = prev.find(
        (s) =>
          s.student_id === candidate.id &&
          s.employer_id === employerId
      )
  
      if (exists) {
        return prev.map((s) =>
          s.student_id === candidate.id &&
          s.employer_id === employerId
            ? { ...s, status: newStatus }
            : s
        )
      }
  
      return [
        ...prev,
        {
          student_id: candidate.id,
          employer_id: employerId,
          status: newStatus,
        },
      ]
    })
  
    await supabase
      .from("student_statuses")
      .upsert(
        {
          student_id: candidate.id,
          employer_id: employerId,
          status: newStatus,
        },
        { onConflict: "student_id,employer_id" }
      )
  
    // 🔥 THIS is the key improvement
    setActiveStatus(newStatus)
  }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

            {loading ? (
  <Card>
    <CardContent className="py-12 text-center">
      <p className="text-muted-foreground">Loading students...</p>
    </CardContent>
  </Card>
) : students.length === 0 ? (
  <Card className="border-dashed">
    <CardContent className="py-12 text-center">
      <p className="font-medium">No students in database</p>
      <p className="text-sm text-muted-foreground">
        Check Supabase table + RLS
      </p>
    </CardContent>
  </Card>
) : filteredCandidates.length === 0 ? (
  <Card className="border-dashed">
    <CardContent className="py-12 text-center">
      <p className="font-medium">No matches found</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting filters
      </p>
      <Button variant="outline" className="mt-4" onClick={clearFilters}>
        Clear filters
      </Button>
    </CardContent>
  </Card>
) : null}        </div>
</div>
</main>
</div>
)
}