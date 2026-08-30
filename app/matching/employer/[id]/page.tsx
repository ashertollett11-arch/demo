"use client"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MapPin, Star, Calendar, Clock, Phone, Mail, Building2, CreditCard, LogOut, ChevronDown, Bell } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"
import { getDistance } from "@/lib/distance"
import Image from "next/image"
import Link from "next/link"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [distanceMeters, setDistanceMeters] = useState<number | undefined>(undefined)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [distance, setDistance] = useState<{ distance: string; duration: string } | null>(null)
  const [loadingDistance, setLoadingDistance] = useState(false)
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  
  useEffect(() => {
    if (!studentId) return
    const loadStudent = async () => {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) { router.replace(`/login?redirect=/matching/employer/${studentId}`); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "employer") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("profiles").select("subscription_status, profile_complete").eq("id", userId).maybeSingle()
      const isSubscribed = profile?.subscription_status === "active" || profile?.subscription_status === "freeactive"
      if (!isSubscribed) { router.replace(!profile?.profile_complete ? "/employer/profile?missing=true" : "/pricing/mobile"); return }
      const { data: employerJob } = await supabase.from("job").select("id, shift_preference, preferred_jobs, company").eq("user_id", userId).single()
      if (!employerJob) { router.replace("/employer/profile?missing=true"); return }
      setCompanyName(employerJob.company || "")
      const { data: locCheck } = await supabase.from("locations").select("id").eq("employer_id", employerJob.id)
      if (!locCheck || locCheck.length === 0) { router.replace("/employer/profile?missing=true"); return }
      setShiftPreference(employerJob?.shift_preference ?? "flexible")
      setPreferredJobs(employerJob?.preferred_jobs ?? [])
      if (employerJob?.id) {
        const { data: locations } = await supabase.from("locations").select("id, name, available_shifts, shift_preference, preferred_jobs, address, zip_code").eq("employer_id", employerJob.id).order("created_at", { ascending: true })
        if (locations?.length) {
          setAllLocations(locations); setSelectedLocationId(locations[0].id)
          const first = locations[0]
          setEmployerShifts(first.available_shifts ?? []); setShiftPreference(first.shift_preference ?? "flexible")
          if (first.preferred_jobs?.length > 0) setPreferredJobs(first.preferred_jobs)
        }
      }
      const { data, error } = await supabase.from("Students").select("*").eq("id", studentId).single()
      if (error || !data) { setLoading(false); return }
      const { data: statusRow } = await supabase.from("student_statuses").select("status").eq("student_id", studentId).eq("employer_id", userId).maybeSingle()
      setStudent({ ...data, status: statusRow?.status || "new" })
      const { data: rec } = await supabase.from("recommendations").select("*").eq("student_user_id", data.user_id).eq("submitted", true).maybeSingle()
      if (rec) setRecommendation(rec)
        const { data: existingNotes } = await supabase
      .from("student_statuses")
      .select("notes")
      .eq("student_id", studentId)
      .eq("employer_id", userId)
      .maybeSingle()
    if (existingNotes?.notes) setNotes(existingNotes.notes)
     
        setLoading(false)
    }
    loadStudent()
  }, [studentId, router])

  const loadDistance = async (locationId: string, studentUserIdParam: string) => {
    setLoadingDistance(true)
    const { data: stored } = await supabase.from("employer_student_distances").select("distance_text, duration_text, distance_meters").eq("employer_location_id", locationId).eq("student_user_id", studentUserIdParam).maybeSingle()
    if (stored?.distance_text) {
      setDistance({ distance: stored.distance_text, duration: stored.duration_text })
      setDistanceMeters(stored.distance_meters ?? undefined)
      setLoadingDistance(false); return
    }
    const loc = allLocations.find(l => l.id === locationId)
    if (!loc || !student?.location || !student?.zip_code) { setLoadingDistance(false); return }
    const result = await getDistance(student.location, student.zip_code, loc.address, loc.zip_code)
    if (result) { setDistance({ distance: result.distance, duration: result.duration }); setDistanceMeters(undefined) }
    setLoadingDistance(false)
  }

  useEffect(() => {
    if (!student?.user_id || !selectedLocationId || allLocations.length === 0) return
    loadDistance(selectedLocationId, student.user_id)
  }, [student?.user_id, selectedLocationId, allLocations])

  const handleLocationChange = async (locationId: string) => {
    const loc = allLocations.find(l => l.id === locationId)
    if (!loc) return
    setLocationLoading(true)
    setSelectedLocationId(locationId); setEmployerShifts(loc.available_shifts ?? []); setShiftPreference(loc.shift_preference ?? "flexible")
    if (loc.preferred_jobs?.length > 0) setPreferredJobs(loc.preferred_jobs)
    if (student?.user_id) await loadDistance(locationId, student.user_id)
    setLocationLoading(false)
  }

  const matchScore = useMemo(() => {
    if (!student) return 0
    if (!employerShifts.length) return 22
    const activeShifts = employerShifts.filter(s => s.active === true || s.active === "true" || s.active === 1)
    if (!activeShifts.length) return 22
    return calculateEmployerMatch(
      { shifts: activeShifts, shiftPreference, preferred_jobs: preferredJobs },
      student.availability, student.shift_preference, student.gpa, student.preferred_jobs, !!recommendation, distanceMeters
    )
  }, [student, employerShifts, shiftPreference, preferredJobs, recommendation, distanceMeters])

  const updateStatus = async (newStatus: "new" | "contacted" | "hired") => {
    setStudent((prev: any) => ({ ...prev, status: newStatus }))
    const { data: userData } = await supabase.auth.getUser()
    const employerId = userData?.user?.id
    if (!employerId) return
    await supabase.from("student_statuses").upsert({ student_id: studentId, employer_id: employerId, status: newStatus }, { onConflict: "student_id,employer_id" })
    if (newStatus === "contacted" && student?.email) {
      const { data: jobData } = await supabase.from("job").select("company, business_type").eq("user_id", employerId).single()
      fetch("/api/send-contacted-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentEmail: student.email, studentName: student.name, companyName: jobData?.company || "An employer", businessType: jobData?.business_type || "" }) }).catch(() => {})
    }
  }

  const saveNotes = async (value: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const employerId = userData?.user?.id
    if (!employerId) return
    setSavingNotes(true)
    await supabase.from("student_statuses").upsert(
      { student_id: studentId, employer_id: employerId, notes: value },
      { onConflict: "student_id,employer_id" }
    )
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading student profile...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-semibold text-foreground">Student not found</p>
          <Button variant="outline" onClick={() => router.push("/matching/employer")}>Go back</Button>
        </div>
      </div>
    )
  }

  const initials = student.name?.split(" ").map((n: string) => n[0]).join("") || "?"
  const availableDays = Array.isArray(student.availability) ? student.availability.filter((a: any) => a.available === true) : []

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/matching/employer")}>
              <ChevronLeft className="h-4 w-4" /> Candidates
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</div>
              <span className="text-sm font-medium text-foreground">{student.name}</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/matching/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Find Candidates</Link>
            <Link href="/employer/locations" className="text-sm font-medium text-muted-foreground hover:text-foreground">Locations</Link>
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
                <p className="text-sm font-semibold truncate">{companyName}</p>
                <p className="text-xs text-muted-foreground">Employer Account</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem asChild><Link href="/employer/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"><Building2 className="h-4 w-4 text-muted-foreground" />Company Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/employer/locations" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"><MapPin className="h-4 w-4 text-muted-foreground" />Locations</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/pricing/mobile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"><CreditCard className="h-4 w-4 text-muted-foreground" />Billing</Link></DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" />Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {allLocations.length > 1 && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground shrink-0">Scoring for:</p>
            <div className="flex flex-wrap gap-2">
              {allLocations.map(loc => (
                <button key={loc.id} onClick={() => handleLocationChange(loc.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedLocationId === loc.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT — student info */}
          <div className="lg:col-span-2 space-y-6">

            {/* HERO */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                        <p className="text-muted-foreground mt-0.5">{student.school}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {locationLoading ? (
                          <div className="h-6 w-24 rounded bg-secondary animate-pulse" />
                        ) : (
                          <span className={`text-lg font-bold ${matchScore >= 75 ? "text-primary" : matchScore >= 50 ? "text-yellow-600" : "text-muted-foreground"}`}>
                            {matchScore}% match
                          </span>
                    )}
                    {student.is_looking === false && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Not looking</Badge>
                    )}
                  </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{student.location}</span>
                      {loadingDistance ? (
                        <span className="text-xs">Calculating distance...</span>
                      ) : distance?.distance && distance.distance !== "Unknown" ? (
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{distance.distance} · {distance.duration}</span>
                      ) : null}
                      <span className="flex items-center gap-1"><Star className="h-4 w-4" />GPA {student.gpa}</span>
                      <span>Age {student.age}</span>
                      {recommendation && <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 text-xs">⭐ Recommended</Badge>}
                    </div>
                  </div>
                </div>

                {/* NOT LOOKING BANNER */}
                {student.is_looking === false && (
                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3">
                    <span className="text-yellow-500">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">This student is no longer looking for work</p>
                      <p className="text-xs text-yellow-700 mt-0.5">They've updated their status to unavailable and may not respond.</p>
                    </div>
                  </div>
                )}

            
              </CardContent>
            </Card>

            {/* AVAILABILITY */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" /> Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Shift preference:</span>
                  <span className="text-xs font-medium text-foreground capitalize bg-secondary rounded-full px-2 py-0.5">{student.shift_preference}</span>
                </div>
                {locationLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-border">
                        <div className="h-3 w-20 rounded bg-secondary animate-pulse" />
                        <div className="h-3 w-28 rounded bg-secondary animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : availableDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability set</p>
                ) : (
                  <>
                    <div className="rounded-xl border border-border overflow-hidden">
                      {availableDays.map((a: any, i: number) => {
                        const activeShifts = employerShifts.filter(s => s.active === true || s.active === "true" || s.active === 1)
                        const employerDays = activeShifts.map(s => s.day)
                        const isMatch = employerDays.includes(a.day)
                        return (
                          <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < availableDays.length - 1 ? "border-b border-border" : ""} ${isMatch ? "bg-green-50/50" : ""}`}>
                            <div className="flex items-center gap-2 w-24">
                              <span className="font-medium text-foreground">{a.day}</span>
                              {isMatch && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Match</span>}
                            </div>
                            <span className="text-muted-foreground">{a.start} – {a.end}</span>
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const activeShifts = employerShifts.filter(s => s.active === true || s.active === "true" || s.active === 1)
                      const employerDays = activeShifts.map(s => s.day)
                      const matchingDays = availableDays.filter((a: any) => employerDays.includes(a.day))
                      if (matchingDays.length === 0) return (
                        <p className="text-xs text-muted-foreground mt-2">No overlapping days with your location's shifts.</p>
                      )
                      return (
                        <p className="text-xs text-green-700 font-medium mt-2">
                          {matchingDays.length} day{matchingDays.length !== 1 ? "s" : ""} overlap with your schedule: {matchingDays.map((a: any) => a.day).join(", ")}
                        </p>
                      )
                    })()}
                  </>
                )}
              </CardContent>
            </Card>

            {/* PREFERRED POSITIONS */}
            {student.preferred_jobs?.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Preferred Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {student.preferred_jobs.map((job: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 text-sm rounded-full border border-border bg-secondary/40 text-foreground font-medium">{job}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RECOMMENDATION */}
            {recommendation && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="h-4 w-4 text-yellow-600" /> Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{recommendation.recommender_name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{recommendation.recommender_relationship}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-sm text-foreground italic leading-relaxed">"{recommendation.description}"</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Known for: <strong className="text-foreground">{recommendation.how_long_known}</strong></span>
                    <span>·</span>
                    <span>Would recommend: <strong className="text-foreground">{recommendation.would_recommend}</strong></span>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT — sticky sidebar */}
          <div className="space-y-5">

            {/* CONTACT INFO */}
            <Card className="border-border bg-card lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact Student</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">
                        {student.phone ? `(${student.phone.slice(0,3)}) ${student.phone.slice(3,6)}-${student.phone.slice(6)}` : student.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* IN-APP NUDGE */}
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">Already reached out?</p>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Send them an in-app nudge so they know to check for your message.</p>
                  <Button className="w-full" variant="outline" size="sm"
                    disabled={notificationSent}
                    onClick={async () => {
                      const { data: userData } = await supabase.auth.getUser()
                      const employerId = userData?.user?.id
                      if (!employerId) return
                      const { data: jobData } = await supabase.from("job").select("company").eq("user_id", employerId).single()
                      const company = jobData?.company || "An employer"
                      const { error } = await supabase.from("student_notifications").insert({
                        student_user_id: student.user_id, employer_id: employerId,
                        message: ` Congrats! ${company} thinks you're a great match — check your phone and email, they've reached out to start the hiring process!`, read: false,                      })
                      if (error) { toast.error("Failed to send notification.") } else { toast.success("Student notified!")  }setNotificationSent(true)
                    }}>
<Bell className="h-4 w-4 mr-2" /> {notificationSent ? "Notification Sent ✓" : "Send Notification"}
                  </Button>
                </div>


{/* NOTES */}
<div>
                  <p className="text-sm font-semibold text-foreground mb-2">Private Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value)
                      setNotesSaved(false)
                    }}
                    onBlur={(e) => saveNotes(e.target.value)}
                    placeholder="e.g. Called Tuesday, no answer. Try again Thursday..."
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-all"
                  />
                  <p className="text-xs mt-1 transition-all">
                    {savingNotes ? (
                      <span className="text-muted-foreground">Saving...</span>
                    ) : notesSaved ? (
                      <span className="text-green-600">Saved ✓</span>
                    ) : (
                      <span className="text-muted-foreground">Auto-saves when you click away.</span>
                    )}
                  </p>
                </div>

                {/* STATUS */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Pipeline Status</p>
                  <Select value={student?.status ?? "new"} onValueChange={value => {
                    const newStatus = value as "new" | "contacted" | "hired"
                    updateStatus(newStatus)
                    toast.success("Status updated", { description: `Student marked as ${newStatus}` })
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {student?.status === "contacted" ? "Marking as Contacted sends the student an email nudge." : student?.status === "hired" ? "Marked as hired — congrats on the hire!" : "Move this candidate through your pipeline."}
                  </p>
                </div>

              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}