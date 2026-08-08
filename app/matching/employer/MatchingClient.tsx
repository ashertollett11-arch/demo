"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ChevronDown, User, Bell, MapPin, Building2, CreditCard, LogOut } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Star,
  Filter,
  X,
  Zap,
  ChevronLeft,
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
    case "new": return <Badge className="bg-sky-100 text-sky-700">New</Badge>
    case "contacted": return <Badge className="bg-blue-100 text-blue-700">Contacted</Badge>
    case "hired": return <Badge className="bg-green-100 text-green-700">Hired</Badge>
    default: return <Badge variant="secondary">Unknown</Badge>
  }
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const ALL_AGES = [14, 15, 16, 17, 18, 19, 20, 21]

function FilterContent({
  minGpa, setMinGpa,
  selectedDays, setSelectedDays,
  verifiedOnly, setVerifiedOnly,
  areaRadius, employerZip,
  ageMode, setAgeMode,
  ageMin, setAgeMin,
  ageMax, setAgeMax,
  specificAges, setSpecificAges,
  daysOfWeek,
  activeFiltersCount,
  clearFilters,
}: any) {
  return (
    <div className="space-y-6">
      {employerZip && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Location Filter
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Zip: <span className="font-medium text-foreground">{employerZip}</span>
            {" — "}
            <span className="font-medium text-foreground">
              {areaRadius === "exact" ? "Same zip" : areaRadius === "broad" ? "Broader region" : "All areas"}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Changes with selected location.</p>
        </div>
      )}
      <div>
        <Label className="text-sm font-medium">Minimum GPA</Label>
        <input
          type="number" min="1.0" max="4.0" step="0.1"
          value={minGpa[0] === "" ? "" : minGpa[0]}
          onChange={(e) => {
            const value = e.target.value
            if (value === "") { setMinGpa([""]); return }
            let val = parseFloat(value)
            if (val > 4) val = 4
            setMinGpa([val])
          }}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label className="text-sm font-medium">Age Filter</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <button
            onClick={() => setAgeMode("range")}
            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
              ageMode === "range"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            Age Range
          </button>
          <button
            onClick={() => setAgeMode("specific")}
            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
              ageMode === "specific"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            Specific Ages
          </button>
        </div>
        {ageMode === "range" && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Min</p>
              <select
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {ALL_AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <span className="text-muted-foreground mt-4">—</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Max</p>
              <select
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {ALL_AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}
        {ageMode === "specific" && (
          <div className="flex flex-wrap gap-2">
            {ALL_AGES.map((age) => (
              <button
                key={age}
                onClick={() => {
                  setSpecificAges((prev: number[]) =>
                    prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
                  )
                }}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  specificAges.includes(age)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        )}
      </div>
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
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={verifiedOnly}
          onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
        />
        <label className="text-sm">Verified students only</label>
      </div>
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  )
}

export default function MatchingPage() {
  const router = useRouter()
  const [name, setName] = useState("Employer")
  const [employerZip, setEmployerZip] = useState<string | null>(null)
  const [areaRadius, setAreaRadius] = useState<"exact" | "broad" | "all">("exact")
  const [minGpa, setMinGpa] = useState<(number | "")[]>([1.0])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"matchScore" | "gpa" | "age">("matchScore")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [recommendations, setRecommendations] = useState<Record<string, boolean>>({})

  const [ageMode, setAgeMode] = useState<"range" | "specific">("range")
  const [ageMin, setAgeMin] = useState(14)
  const [ageMax, setAgeMax] = useState(21)
  const [specificAges, setSpecificAges] = useState<number[]>([])

  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")

  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [scoredCandidates, setScoredCandidates] = useState<any[]>([])
  const [activeStatus, setActiveStatus] = useState<"new" | "contacted" | "hired">("new")
  const [students, setStudents] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [employerId, setEmployerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])

  // MULTI-LOCATION
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  const matchesZip = (studentZip: string | null): boolean => {
    if (!employerZip || areaRadius === "all") return true
    if (!studentZip) return false
    if (areaRadius === "exact") return studentZip === employerZip
    if (areaRadius === "broad") return studentZip.slice(0, 3) === employerZip.slice(0, 3)
    return true
  }

  const matchesAge = (age: number | null): boolean => {
    if (!age) return true
    if (ageMode === "range") return age >= ageMin && age <= ageMax
    if (ageMode === "specific") return specificAges.length === 0 || specificAges.includes(age)
    return true
  }

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
          .select("subscription_status")
          .eq("id", user.id)
          .maybeSingle()

        const isSubscribed =
          profile?.subscription_status === "active" ||
          profile?.subscription_status === "freeactive"
        if (!isSubscribed) { router.replace("/pricing/mobile"); return }

        const { data: jobData } = await supabase
          .from("job")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (!jobData) { router.replace("/employer/profile"); return }

        setUserId(user.id)
      } catch (err) {
        router.replace("/login")
      }
    }
    checkAccess()
  }, [router])

  // LOAD STUDENTS
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("Students")
          .select("*")
          .eq("profile_complete", true)
        if (error) { setStudents([]); return }
        setStudents((data ?? []).map((s) => ({ ...s, availability: s.availability ?? [], gpa: s.gpa ?? 0 })))
      } catch (err) {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  useEffect(() => {
    if (!students.length) return
    const loadRecommendations = async () => {
      const { data } = await supabase
        .from("recommendations")
        .select("student_user_id")
        .eq("submitted", true)
      const recMap: Record<string, boolean> = {}
      ;(data || []).forEach((r) => { recMap[r.student_user_id] = true })
      setRecommendations(recMap)
    }
    loadRecommendations()
  }, [students])

  // LOAD ALL LOCATIONS
  useEffect(() => {
    const loadJob = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id) return

      const { data: jobData } = await supabase
        .from("job")
        .select("id, preferred_jobs, shift_preference")
        .eq("user_id", user.user.id)
        .single()

      if (!jobData) return
      setPreferredJobs(jobData.preferred_jobs ?? [])

      const { data: locations } = await supabase
        .from("locations")
        .select("id, name, available_shifts, shift_preference, preferred_jobs, zip_code, zip_match_precision")
        .eq("employer_id", jobData.id)
        .order("created_at", { ascending: true })

      if (locations?.length) {
        setAllLocations(locations)
        setSelectedLocationId(locations[0].id)
        const first = locations[0]
        setEmployerShifts(first.available_shifts ?? [])
        setShiftPreference(first.shift_preference ?? "flexible")
        setEmployerZip(first.zip_code ?? null)
        setAreaRadius(first.zip_match_precision === 3 ? "broad" : "exact")
        if (first.preferred_jobs?.length > 0) setPreferredJobs(first.preferred_jobs)
      }
    }
    loadJob()
  }, [])

  const handleLocationChange = (locationId: string) => {
    const loc = allLocations.find(l => l.id === locationId)
    if (!loc) return
    setSelectedLocationId(locationId)
    setEmployerShifts(loc.available_shifts ?? [])
    setShiftPreference(loc.shift_preference ?? "flexible")
    setEmployerZip(loc.zip_code ?? null)
    setAreaRadius(loc.zip_match_precision === 3 ? "broad" : "exact")
    if (loc.preferred_jobs?.length > 0) setPreferredJobs(loc.preferred_jobs)
  }

  const activeShifts = useMemo(() => {
    return Array.isArray(employerShifts)
      ? employerShifts.filter((s) => s.active === true || s.active === "true" || s.active === 1)
      : []
  }, [employerShifts])

  const jobDays = useMemo(() => activeShifts.map((s) => s.day), [activeShifts])

  useEffect(() => {
    const loadEmployer = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user?.id) return
      setEmployerId(data.user.id)
    }
    loadEmployer()
  }, [])

  useEffect(() => {
    if (!employerId) return
    const loadStatuses = async () => {
      const { data, error } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", employerId)
      if (error) return
      setStatuses(data || [])
    }
    loadStatuses()
  }, [employerId])

  useEffect(() => {
    if (!employerId || students.length === 0 || !employerZip) return
    const seedStatuses = async () => {
      const rows = students
        .filter((student) => student.profile_complete === true)
        .filter((student) => matchesZip(student.zip_code))
        .map((student) => ({ employer_id: employerId, student_id: student.id, status: "new" }))
      const { error } = await supabase
        .from("student_statuses")
        .upsert(rows, { onConflict: "employer_id,student_id", ignoreDuplicates: true })
      if (error) return
      const { data } = await supabase
        .from("student_statuses")
        .select("*")
        .eq("employer_id", employerId)
      setStatuses(data || [])
    }
    seedStatuses()
  }, [employerId, students, employerZip, areaRadius])

  useEffect(() => {
    if (!userId) return
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("employer_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
      if (error) return
      setNotifications(data || [])
    }
    loadNotifications()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `employer_id=eq.${userId}`,
      }, (payload) => { setNotifications((prev) => [payload.new, ...prev]) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from("notifications").update({ read: true }).eq("id", id)
  }

  useEffect(() => {
    if (!students.length) return
    const results = students.map((candidate) => {
      const matchScore = calculateEmployerMatch(
        { shifts: jobDays, shiftPreference, preferred_jobs: preferredJobs },
        candidate.availability,
        candidate.shift_preference,
        candidate.gpa,
        candidate.preferred_jobs
      )
      return { ...candidate, matchScore: Math.round(matchScore) }
    })
    setScoredCandidates(results)
  }, [students, employerShifts, shiftPreference, preferredJobs])

  useEffect(() => {
    if (statusParam === "new" || statusParam === "contacted" || statusParam === "hired") {
      setActiveStatus(statusParam)
    }
  }, [statusParam])

  useEffect(() => {
    const loadEmployerName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("job")
        .select("company")
        .eq("user_id", user.id)
        .maybeSingle()
      if (!data || error) {
        setLoading(false)
        toast.error("Please complete your profile")
        router.replace("/employer/profile?missing=true")
        return
      }
      setName(data.company || "Employer")
    }
    loadEmployerName()
  }, [router])

  useEffect(() => {
    const search = searchParams.get("search")
    if (!search) return
    setSearchQuery(search)
    router.replace("/matching/employer")
  }, [searchParams, router])

  const statusPriority: Record<string, number> = { new: 0, contacted: 1, hired: 2 }

  const filteredCandidates = scoredCandidates
    .map((candidate) => {
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const matchesName = candidate.name?.toLowerCase().includes(q)
        const matchesJob = candidate.preferred_jobs?.some((j: string) => j.toLowerCase().includes(q))
        if (!matchesName && !matchesJob) return null
      }
      const statusRow = statuses.find((s) => s.student_id === candidate.id)
      return { ...candidate, status: statusRow?.status || "new" }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => {
      if (!candidate) return false
      if (!matchesZip(candidate.zip_code)) return false
      if (!matchesAge(candidate.age)) return false
      if (candidate.gpa < minGpa[0]) return false
      const perfect = searchParams.get("perfect")
      if (perfect === "true" && candidate.matchScore !== 100) return false
      if (verifiedOnly && !candidate.is_gpa_verified) return false
      const safeAvailability = candidate.availability ?? []
      if (selectedDays.length > 0) {
        const hasMatch = safeAvailability.some((a: any) => a.available && selectedDays.includes(a.day))
        if (!hasMatch) return false
      }
      return true
    })
    .sort((a, b) => {
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status]
      }
      if (sortBy === "matchScore") return b.matchScore - a.matchScore
      if (sortBy === "gpa") return b.gpa - a.gpa
      if (sortBy === "age") return a.age - b.age
      return 0
    })

  const groupedCandidates = {
    new: filteredCandidates.filter(c => c.status === "new"),
    contacted: filteredCandidates.filter(c => c.status === "contacted"),
    hired: filteredCandidates.filter(c => c.status === "hired"),
  }

  useEffect(() => {
    if (!filteredCandidates.length) return
    if (statusParam) return
    if (groupedCandidates[activeStatus]?.length > 0) return
    const firstAvailableTab = (["new", "contacted", "hired"] as const).find(
      (status) => groupedCandidates[status].length > 0
    )
    if (firstAvailableTab) setActiveStatus(firstAvailableTab)
  }, [filteredCandidates, activeStatus, statusParam])

  const clearFilters = () => {
    setMinGpa([1.0])
    setSelectedDays([])
    setVerifiedOnly(false)
    setAgeMode("range")
    setAgeMin(14)
    setAgeMax(21)
    setSpecificAges([])
  }

  const activeFiltersCount = [
    minGpa[0] > 1.0,
    selectedDays.length > 0,
    verifiedOnly,
    ageMode === "range" ? (ageMin > 14 || ageMax < 21) : specificAges.length > 0,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/employer")}>
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/matching/employer" className="text-sm font-medium text-foreground">Find Candidates</Link>
            <Link href="/pricing/mobile" className="text-sm font-medium text-muted-foreground hover:text-foreground">Billing</Link>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-black">
                      {notifications.filter((n) => !n.read).length > 9 ? "9+" : notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="font-semibold text-sm text-foreground">Notifications</p>
                  {notifications.length > 0 && (
                    <Badge className="bg-red-100 text-red-600 text-xs">{notifications.length} new</Badge>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-foreground">All caught up</p>
                    <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {n.message?.split(" applied")[0]?.trim().split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">{n.message ?? "New notification"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {n.created_at
                              ? new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                              : "Just now"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              const studentName = n.message?.split(" applied to ")[0]?.trim()
                              if (studentName) { setSearchQuery(studentName); setActiveStatus("new") }
                            }}
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                    {name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{name}</span>
                    <span className="text-xs text-muted-foreground">Employer</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Find Your Perfect Match</h1>
          <p className="mt-2 text-muted-foreground">Browse verified students filtered by availability, GPA, age, and location.</p>
          {employerZip && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Showing students in</span>
              <span className="font-semibold text-foreground">
                {areaRadius === "exact" ? `zip code ${employerZip}` :
                 areaRadius === "broad" ? `region ${employerZip.slice(0, 3)}xx` : "all areas"}
              </span>
            </div>
          )}
        </div>

        {/* LOCATION SELECTOR */}
        {allLocations.length > 1 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground mb-3">Scoring match % for location:</p>
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
              Switch locations to see match scores and zip filtering based on each location's shifts and zip code.
            </p>
          </div>
        )}

        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Matching</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Filter by GPA, age, availability, and location. Sort by best match, GPA, or age.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-8">
          {/* DESKTOP FILTERS */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <Card className="sticky top-24 border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Filter className="h-4 w-4" />Filters</span>
                  {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent
                  minGpa={minGpa} setMinGpa={setMinGpa}
                  selectedDays={selectedDays} setSelectedDays={setSelectedDays}
                  verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                  areaRadius={areaRadius} employerZip={employerZip}
                  ageMode={ageMode} setAgeMode={setAgeMode}
                  ageMin={ageMin} setAgeMin={setAgeMin}
                  ageMax={ageMax} setAgeMax={setAgeMax}
                  specificAges={specificAges} setSpecificAges={setSpecificAges}
                  daysOfWeek={daysOfWeek}
                  activeFiltersCount={activeFiltersCount}
                  clearFilters={clearFilters}
                />
              </CardContent>
            </Card>
          </aside>

          {/* MAIN */}
          <div className="flex-1">
            {/* SEARCH */}
            <div className="mb-4 flex items-center gap-2">
              <input
                placeholder="Search students by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              {searchQuery.trim() !== "" && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>Clear search</Button>
              )}
            </div>

            {/* MOBILE FILTERS + SORT */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6">
                    <FilterContent
                      minGpa={minGpa} setMinGpa={setMinGpa}
                      selectedDays={selectedDays} setSelectedDays={setSelectedDays}
                      verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                      areaRadius={areaRadius} employerZip={employerZip}
                      ageMode={ageMode} setAgeMode={setAgeMode}
                      ageMin={ageMin} setAgeMin={setAgeMin}
                      ageMax={ageMax} setAgeMax={setAgeMax}
                      specificAges={specificAges} setSpecificAges={setSpecificAges}
                      daysOfWeek={daysOfWeek}
                      activeFiltersCount={activeFiltersCount}
                      clearFilters={clearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-muted-foreground sm:block">{filteredCandidates.length} candidates</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-40 gap-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matchScore">Best Match</SelectItem>
                    <SelectItem value="gpa">Highest GPA</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* FILTER PILLS */}
            {activeFiltersCount > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {minGpa[0] > 1.0 && (
                  <Badge variant="secondary" className="gap-1">
                    GPA ≥ {minGpa[0].toFixed(1)}
                    <button onClick={() => setMinGpa([1.0])}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {ageMode === "range" && (ageMin > 14 || ageMax < 21) && (
                  <Badge variant="secondary" className="gap-1">
                    Age {ageMin}–{ageMax}
                    <button onClick={() => { setAgeMin(14); setAgeMax(21) }}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {ageMode === "specific" && specificAges.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    Ages: {specificAges.join(", ")}
                    <button onClick={() => setSpecificAges([])}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedDays.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDays.join(", ")}
                    <button onClick={() => setSelectedDays([])}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {verifiedOnly && (
                  <Badge variant="secondary" className="gap-1">
                    Verified only
                    <button onClick={() => setVerifiedOnly(false)}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}

            {/* STATUS TABS */}
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

            {/* CANDIDATE CARDS */}
            <div className="grid gap-4 sm:grid-cols-2">
              {(groupedCandidates[activeStatus] ?? []).map((candidate) => (
                <Card key={candidate.id} className="border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                          {candidate.name?.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Star className="h-4 w-4" />
                            <span>GPA: {candidate.gpa}</span>
                            {recommendations[candidate.user_id] && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-yellow-600 border-yellow-300 bg-yellow-50">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          {candidate.age && (
                            <p className="text-xs text-muted-foreground mt-0.5">Age: {candidate.age}</p>
                          )}
                          {getStatusBadge(candidate.status)}
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary">{candidate.matchScore}% match</Badge>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Available:{" "}
                      {(candidate.availability ?? [])
                        .filter((a: any) => a?.available)
                        .map((a: any) => a?.day)
                        .join(", ") || "None"}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm"
                        onClick={(e) => { e.stopPropagation(); router.push(`/matching/employer/${candidate.id}`) }}
                      >
                        View Profile
                      </Button>
                      <Select
                        value={statuses.find((s) => s.student_id === candidate.id && s.employer_id === employerId)?.status || "new"}
                        onValueChange={async (value) => {
                          if (!employerId) return
                          const newStatus = value as "new" | "contacted" | "hired"
                          setStatuses((prev) => {
                            const exists = prev.find((s) => s.student_id === candidate.id && s.employer_id === employerId)
                            if (exists) {
                              return prev.map((s) =>
                                s.student_id === candidate.id && s.employer_id === employerId
                                  ? { ...s, status: newStatus } : s
                              )
                            }
                            return [...prev, { student_id: candidate.id, employer_id: employerId, status: newStatus }]
                          })
                          await supabase.from("student_statuses").upsert(
                            { student_id: candidate.id, employer_id: employerId, status: newStatus },
                            { onConflict: "student_id,employer_id" }
                          )
                          setActiveStatus(newStatus)
                        }}
                      >
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
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
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground text-sm">Loading candidates...</p>
              </div>
            ) : students.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center"><p className="font-medium">No students in database</p></CardContent></Card>
            ) : filteredCandidates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="font-medium">No matches found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}