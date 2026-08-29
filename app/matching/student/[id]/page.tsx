"use client"
import { useParams, useRouter } from "next/navigation"
import { MapPin, ChevronLeft, Clock, Briefcase, Home, Activity, User } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import { toast } from "sonner"
import Link from "next/link"

export default function JobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [distanceMeters, setDistanceMeters] = useState<number | undefined>(undefined)
  const [hasRecommendation, setHasRecommendation] = useState(false)
  const [studentShiftPreference, setStudentShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [availability, setAvailability] = useState<any[]>([])
  const [jobMatchScore, setJobMatchScore] = useState(0)
  const [distance, setDistance] = useState<{ distanceText: string; durationText: string } | null>(null)
  const [studentUserId, setStudentUserId] = useState<string | null>(null)
  const [isLooking, setIsLooking] = useState(true)
  const applyingRef = useRef(false)
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user?.id) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("Students").select("profile_complete").eq("user_id", user.id).maybeSingle()
      if (!profile?.profile_complete) { router.replace("/student/onboarding"); return }
    }
    run()
  }, [router])

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setStudentUserId(user.id)
      const { data, error } = await supabase.from("Students").select("availability, shift_preference, is_looking").eq("user_id", user.id).single()
      if (error || !data) return
      setAvailability(data.availability || [])
      setStudentShiftPreference(data.shift_preference || "flexible")
      setIsLooking(data.is_looking !== false)
      const { data: existing } = await supabase.from("location_applications").select("id").eq("student_user_id", user.id).eq("location_id", jobId).maybeSingle()
      if (existing) setHasApplied(true)
    }
    fetchStudent()
  }, [jobId])

  useEffect(() => {
    const fetchJob = async () => {
      const id = params.id as string
      if (!id) { setLoading(false); return }
      setLoading(true)
      const { data, error } = await supabase.from("locations").select(`
        id, name, address, zip_code, available_shifts, shift_preference,
        hourly_pay, has_tips, preferred_jobs, employer_id,
        job:employer_id (id, company, details, status, user_id)
      `).eq("id", id).single()
      if (error || !data) { setLoading(false); return }
      const jobData = Array.isArray(data.job) ? data.job[0] : data.job
      setJob({
        ...data, title: data.name, company: jobData?.company, location: data.address,
        pay: data.hourly_pay ? `$${data.hourly_pay}/hr` : "N/A", tips: Boolean(data.has_tips),
        details: jobData?.details, status: jobData?.status || "new",
        employer_user_id: jobData?.user_id, job_id: jobData?.id,
      })
      setLoading(false)
    }
    fetchJob()
  }, [params.id])

  useEffect(() => {
    if (!studentUserId || !jobId) return
    const fetchDistance = async () => {
      const { data } = await supabase.from("employer_student_distances")
        .select("distance_text, duration_text, distance_meters")
        .eq("employer_location_id", jobId).eq("student_user_id", studentUserId).maybeSingle()
      if (data?.distance_text) {
        setDistance({ distanceText: data.distance_text, durationText: data.duration_text })
        setDistanceMeters(data.distance_meters ?? undefined)
      }
    }
    const fetchRecommendation = async () => {
      const { data } = await supabase.from("recommendations").select("id").eq("student_user_id", studentUserId).eq("submitted", true).maybeSingle()
      setHasRecommendation(!!data)
    }
    fetchDistance()
    fetchRecommendation()
  }, [studentUserId, jobId])

  useEffect(() => {
    if (!job || !availability.length) return
    let shifts = job.available_shifts ?? []
    if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
    const activeShifts = shifts.filter((s: any) => s.active === true || s.active === "true" || s.active === 1)
    const score = calculateMatch(
      { availability, shiftPreference: studentShiftPreference, hasRecommendation, distanceMeters },
      { shifts: activeShifts, shiftPreference: job.shift_preference || "flexible" }
    )
    setJobMatchScore(Math.round(score))
  }, [job, availability, hasRecommendation, distanceMeters])

  const handleApply = async () => {
    if (hasApplied) { toast.error("You've already applied to this location."); return }
    if (applyingRef.current) return
    applyingRef.current = true
    const { data: authData } = await supabase.auth.getUser()
    const studentId = authData?.user?.id
    if (!studentId) { applyingRef.current = false; return }
    setApplying(true)
    const { data: existing } = await supabase.from("location_applications").select("id").eq("student_user_id", studentId).eq("location_id", job.id).maybeSingle()
    if (existing) { toast.error("You've already applied to this location."); setHasApplied(true); setApplying(false); return }
    const { error: appError } = await supabase.from("location_applications").insert({ student_user_id: studentId, location_id: job.id })
    if (appError) { toast.error("Failed to apply. Please try again."); applyingRef.current = false; setApplying(false); return }
    const { data: studentData } = await supabase.from("Students").select("name, id").eq("user_id", studentId).single()
    const studentName = studentData?.name || "A student"
    const studentDbId = studentData?.id
    const employerId = job.employer_user_id
    if (!employerId) { toast.success(`Applied to ${job.title} at ${job.company}!`); setHasApplied(true); setApplying(false); applyingRef.current = false; return }
    await supabase.from("notifications").insert({
      employer_id: employerId, student_user_id: studentId, type: "application",
      title: "New Applicant", message: `${studentName} applied to ${job.title} — ${job.company}`,
      location_id: job.id, read: false,
    })
    const { data: employerJobData } = await supabase.from("job").select("email").eq("user_id", employerId).single()
    if (employerJobData?.email && studentDbId) {
      fetch("/api/send-application-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerUserId: employerId, employerEmail: employerJobData.email, studentName, studentId: studentDbId, locationName: job.title, companyName: job.company }),
      }).catch(() => {})
    }
    toast.success(`Applied to ${job.title} at ${job.company}!`)
    setHasApplied(true)
    setApplying(false)
    applyingRef.current = false
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-muted-foreground text-sm">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-semibold text-foreground">Job not found</p>
          <button onClick={() => router.push("/matching/student")} className="px-4 py-2 rounded-xl border border-border text-sm">Go back</button>
        </div>
      </div>
    )
  }

  const activeShifts = (job.available_shifts ?? []).filter((s: any) => s.active === true || s.active === "true" || s.active === 1)

  return (
<div className="min-h-screen bg-background pb-48">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.push("/matching/student")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <p className="text-base font-bold text-foreground truncate max-w-[200px]">{job.company}</p>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* HERO CARD */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {job.company?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">{job.company}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{job.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-lg font-bold text-foreground">{job.pay}</span>
                {job.tips && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">+ Tips</span>}
                <span className={`text-sm font-bold ${jobMatchScore >= 75 ? "text-primary" : jobMatchScore >= 50 ? "text-yellow-600" : "text-muted-foreground"}`}>
                  {jobMatchScore}% match
                </span>
              </div>
            </div>
          </div>

          {/* LOCATION + DISTANCE */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{job.location}</span>
            </div>
            {distance && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{distance.distanceText} · {distance.durationText} away</span>
              </div>
            )}
          </div>
        </div>

        {/* ABOUT */}
        {job.details && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</p>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-4">
              <p className="text-sm text-foreground leading-relaxed">{job.details}</p>
            </div>
          </div>
        )}

        {/* SHIFTS */}
        {activeShifts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Shifts</p>
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              {activeShifts.map((shift: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < activeShifts.length - 1 ? "border-b border-border/60" : ""}`}>
                  <span className="text-sm font-medium text-foreground">{shift.day}</span>
                  <span className="text-sm text-muted-foreground">{shift.start} – {shift.end}</span>
                </div>
              ))}
              <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Shift preference</span>
                <span className="text-sm font-medium text-foreground capitalize">{job.shift_preference}</span>
              </div>
            </div>
          </div>
        )}

        {/* HIRING FOR */}
        {job.preferred_jobs?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hiring For</p>
            <div className="flex flex-wrap gap-2">
              {job.preferred_jobs.map((role: string) => (
                <span key={role} className="px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-sm font-medium text-foreground">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* NOT LOOKING WARNING */}
        {!isLooking && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">You're set to "No Longer Looking"</p>
            <p className="text-xs text-yellow-700 mt-1">Update your profile status to Available to apply.</p>
            <button onClick={() => router.push("/student/profile")}
              className="mt-3 px-4 py-2 rounded-xl border border-yellow-300 bg-white text-yellow-700 text-sm font-medium w-full">
              Update Profile
            </button>
          </div>
        )}

      </div>

      {/* FLOATING APPLY BUTTON */}
      {isLooking && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleApply}
              disabled={hasApplied || applying}
              className={`w-full h-14 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.97] ${
                hasApplied
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : applying
                  ? "bg-foreground/70 text-background cursor-not-allowed"
                  : "bg-foreground text-background"
              }`}
            >
              {applying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background" />
                  Applying...
                </span>
              ) : hasApplied ? "Already Applied ✓" : "Apply Now"}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-1 rounded-full bg-foreground px-2 py-2 shadow-2xl">
          <Link href="/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/matching/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-background text-foreground transition-colors">
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] font-medium">Jobs</span>
          </Link>
          <Link href="/student/activity" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium">Activity</span>
          </Link>
          <Link href="/student/profile" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </div>

    </div>
  )
}