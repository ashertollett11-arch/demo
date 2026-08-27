"use client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ChevronLeft, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import { toast } from "sonner"

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

  // AUTH CHECK
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user?.id) { router.replace("/login"); return }

      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }

      const { data: profile } = await supabase
        .from("Students")
        .select("profile_complete")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile?.profile_complete) {
        router.replace("/student/onboarding")
        return
      }
    }
    run()
  }, [router])

  // LOAD STUDENT + CHECK APPLIED
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setStudentUserId(user.id)

      const { data, error } = await supabase
        .from("Students")
        .select("availability, shift_preference")
        .eq("user_id", user.id)
        .single()

      if (error || !data) return
      setAvailability(data.availability || [])
      setStudentShiftPreference(data.shift_preference || "flexible")

      const { data: existing } = await supabase
        .from("location_applications")
        .select("id")
        .eq("student_user_id", user.id)
        .eq("location_id", jobId)
        .maybeSingle()

      if (existing) setHasApplied(true)
    }
    fetchStudent()
  }, [jobId])

  // FETCH LOCATION
  useEffect(() => {
    const fetchJob = async () => {
      const id = params.id as string
      if (!id) { setLoading(false); return }
      setLoading(true)

      const { data, error } = await supabase
        .from("locations")
        .select(`
          id,
          name,
          address,
          zip_code,
          available_shifts,
          shift_preference,
          hourly_pay,
          has_tips,
          preferred_jobs,
          employer_id,
          job:employer_id (
            id,
            company,
            details,
            status,
            user_id
          )
        `)
        .eq("id", id)
        .single()

      if (error || !data) { setLoading(false); return }

      const jobData = Array.isArray(data.job) ? data.job[0] : data.job
      setJob({
        ...data,
        title: data.name,
        company: jobData?.company,
        location: data.address,
        pay: data.hourly_pay ? `$${data.hourly_pay}/hr` : "N/A",
        tips: Boolean(data.has_tips),
        details: jobData?.details,
        status: jobData?.status || "new",
        employer_user_id: jobData?.user_id,
        job_id: jobData?.id,
      })
      setLoading(false)
    }
    fetchJob()
  }, [params.id])

  // LOAD STORED DISTANCE once both student and job are loaded
  useEffect(() => {
    if (!studentUserId || !jobId) return
    const fetchDistance = async () => {
      const { data } = await supabase
        .from("employer_student_distances")
        .select("distance_text, duration_text, distance_meters")
        .eq("employer_location_id", jobId)
        .eq("student_user_id", studentUserId)
        .maybeSingle()
      if (data?.distance_text) {
        setDistance({ distanceText: data.distance_text, durationText: data.duration_text })
        setDistanceMeters(data.distance_meters ?? undefined)
      }
    }
    const fetchRecommendation = async () => {
      const { data } = await supabase
        .from("recommendations")
        .select("id")
        .eq("student_user_id", studentUserId)
        .eq("submitted", true)
        .maybeSingle()
      setHasRecommendation(!!data)
    }
    fetchDistance()
    fetchRecommendation()
  }, [studentUserId, jobId])
  // MATCH SCORE
  useEffect(() => {
    if (!job || !availability.length) return
    let shifts = job.available_shifts ?? []
    if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
    const activeShifts = shifts.filter(
      (s: any) => s.active === true || s.active === "true" || s.active === 1
    )
    const score = calculateMatch(
      {
        availability,
        shiftPreference: studentShiftPreference,
        hasRecommendation,
        distanceMeters,
      },
      { shifts: activeShifts, shiftPreference: job.shift_preference || "flexible" }
    )
    setJobMatchScore(Math.round(score))
  }, [job, availability, hasRecommendation, distanceMeters])

  // APPLY
  const handleApply = async () => {
    if (hasApplied) {
      toast.error("You've already applied to this location.")
      return
    }
    const { data: authData } = await supabase.auth.getUser()
    const studentId = authData?.user?.id
    if (!studentId) return
    setApplying(true)

    const { data: existing } = await supabase
      .from("location_applications")
      .select("id")
      .eq("student_user_id", studentId)
      .eq("location_id", job.id)
      .maybeSingle()

    if (existing) {
      toast.error("You've already applied to this location.")
      setHasApplied(true)
      setApplying(false)
      return
    }

    const { error: appError } = await supabase
      .from("location_applications")
      .insert({ student_user_id: studentId, location_id: job.id })

    if (appError) {
      toast.error("Failed to apply. Please try again.")
      setApplying(false)
      return
    }

    const { data: studentData } = await supabase
      .from("Students")
      .select("name")
      .eq("user_id", studentId)
      .single()

    const studentName = studentData?.name || "A student"
    const employerId = job.employer_user_id

    if (!employerId) {
      toast.error("Could not find employer.")
      setApplying(false)
      return
    }

    await supabase
      .from("notifications")
      .insert({
        employer_id: employerId,
        student_user_id: studentId,
        type: "application",
        title: "New Applicant",
        message: `${studentName} applied to ${job.title} — ${job.company}`,
        location_id: job.id,
        read: false,
      })

// Send email to employer
const { data: employerProfile } = await supabase
.from("profiles")
.select("email_notifications")
.eq("id", employerId)
.maybeSingle()

const { data: employerJobData } = await supabase
.from("job")
.select("email")
.eq("user_id", employerId)
.single()

if (employerJobData?.email) {
fetch("/api/send-application-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    employerUserId: employerId,
    employerEmail: employerJobData.email,
    studentName,
    studentId,
    locationName: job.title,
    companyName: job.company,
  }),
}).catch(() => {})
}

toast.success(`Applied to ${job.title} at ${job.company}!`)
setHasApplied(true)
setApplying(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          <Button variant="outline" onClick={() => router.push("/matching/student")}>Go back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <Button
        variant="ghost"
        className="flex items-center gap-2 mb-6"
        onClick={() => router.push("/matching/student")}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-2xl">{job.company}</CardTitle>
            <p className="text-muted-foreground mt-1">{job.title}</p>
          </div>
          <Badge
            className={
              job.status === "new"
                ? "bg-primary text-primary-foreground"
                : job.status === "applied"
                ? "bg-secondary text-secondary-foreground"
                : "bg-accent text-accent-foreground"
            }
          >
            {job.status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* BASIC INFO */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            {distance && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {distance.distanceText} · {distance.durationText}
              </span>
            )}
            <span className="font-semibold text-primary">{job.pay}</span>
            {job.tips ? (
              <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] px-2 py-0">+ Tips</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-2 py-0">No Tips</Badge>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <h2 className="font-semibold text-lg mb-1">Description</h2>
            <p className="text-sm text-muted-foreground">{job.details}</p>
          </div>

          {/* AVAILABLE SHIFTS */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Available Shifts</h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              {job.available_shifts
                ?.filter((shift: any) => shift.active)
                .map((shift: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-medium text-foreground w-24">{shift.day}</span>
                    <span>{shift.start} – {shift.end}</span>
                  </div>
                ))}
            </div>
            <Badge variant="secondary" className="mt-2">{job.shift_preference}</Badge>
          </div>

          {/* HIRING FOR */}
          {job.preferred_jobs?.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2">Hiring For</h2>
              <div className="flex flex-wrap gap-2">
                {job.preferred_jobs.map((role: string) => (
                  <Badge key={role} variant="outline">{role}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* MATCH SCORE */}
          <div className="text-sm text-muted-foreground">
            Match Score: <span className="text-primary font-semibold">{jobMatchScore}%</span>
          </div>

          {/* APPLY BUTTON */}
          <Button
            className="w-full mt-4"
            disabled={hasApplied || applying}
            onClick={handleApply}
          >
            {applying ? "Applying..." : hasApplied ? "Already Applied ✓" : "Apply Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}