"use client"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MapPin, Star, Calendar, Clock } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"
import { getDistance } from "@/lib/distance"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function StudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const [recommendation, setRecommendation] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [distance, setDistance] = useState<{ distance: string; duration: string } | null>(null)
  const [loadingDistance, setLoadingDistance] = useState(false)
  const [employerLocation, setEmployerLocation] = useState<{ address: string; zip: string } | null>(null)

  // Load employer data + student
  useEffect(() => {
    if (!studentId) return

    const loadStudent = async () => {
      setLoading(true)

      // GET AUTH USER FIRST
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id

      const { data: employerJob } = await supabase
      .from("job")
      .select("id, shift_preference, preferred_jobs")
      .eq("user_id", userId)
      .single()
    
    setShiftPreference(employerJob?.shift_preference ?? "flexible")
    setPreferredJobs(employerJob?.preferred_jobs ?? [])
    
    // Get shifts + location from first location
    if (employerJob?.id) {
      const { data: locationData } = await supabase
        .from("locations")
        .select("available_shifts, shift_preference, preferred_jobs, address, zip_code")
        .eq("employer_id", employerJob.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    
      if (locationData) {
        setEmployerShifts(locationData.available_shifts ?? [])
        setShiftPreference(locationData.shift_preference ?? "flexible")
        if (locationData.preferred_jobs?.length > 0) {
          setPreferredJobs(locationData.preferred_jobs)
        }
        if (locationData.address && locationData.zip_code) {
          setEmployerLocation({
            address: locationData.address,
            zip: locationData.zip_code,
          })
        }
      }
    }

      if (!userId) {
        console.log("No employer user found")
        setLoading(false)
        return
      }

      // LOAD STUDENT
      const { data, error } = await supabase
        .from("Students")
        .select("*")
        .eq("id", studentId)
        .single()

      if (error || !data) {
        console.log("STUDENT LOAD ERROR:", error)
        setLoading(false)
        return
      }

      // LOAD STATUS
      const { data: statusRow } = await supabase
        .from("student_statuses")
        .select("status")
        .eq("student_id", studentId)
        .eq("employer_id", userId)
        .single()

      // FINAL OBJECT
      const finalStudent = {
        ...data,
        status: statusRow?.status || "new",
      }

      setStudent(finalStudent)
      
      const { data: rec } = await supabase
  .from("recommendations")
  .select("*")
  .eq("student_user_id", data.user_id)
  .eq("submitted", true)
  .maybeSingle()
if (rec) setRecommendation(rec)

      setLoading(false)
    }

    loadStudent()
  }, [studentId, router])

  // FETCH DISTANCE once student + employer location are loaded
  useEffect(() => {
    if (!student || !employerLocation) return
    if (!student.location || !student.zip_code) return

    const fetchDistance = async () => {
      setLoadingDistance(true)
      const result = await getDistance(
        student.location,
        student.zip_code,
        employerLocation.address,
        employerLocation.zip
      )
      setDistance(result)
      setLoadingDistance(false)
    }

    fetchDistance()
  }, [student, employerLocation])

  const matchScore = useMemo(() => {
    if (!student) return 0
    if (!employerShifts.length) return 22

    const activeShifts = employerShifts.filter(
      (s) => s.active === true || s.active === "true" || s.active === 1
    )

    const jobDays = activeShifts.map((s) => s.day)

    if (!jobDays.length) return 22

    return calculateEmployerMatch(
      {
        shifts: jobDays,
        shiftPreference,
        preferred_jobs: preferredJobs,
      },
      student.availability,
      student.shift_preference,
      student.gpa,
      student.preferred_jobs
    )
  }, [student, employerShifts, shiftPreference, preferredJobs])

  const updateStatus = async (newStatus: "new" | "contacted" | "hired") => {
    setStudent((prev: any) => ({
      ...prev,
      status: newStatus,
    }))

    console.log("studentId from URL:", studentId)

    const { data: userData } = await supabase.auth.getUser()
    const employerId = userData?.user?.id

    if (!employerId) return

    const { data, error } = await supabase
      .from("student_statuses")
      .upsert(
        {
          student_id: studentId,
          employer_id: employerId,
          status: newStatus,
        },
        {
          onConflict: "student_id,employer_id",
        }
      )

    if (error) {
      console.error("❌ status update failed:", error)
    } else {
      console.log("✅ status updated:", data)
    }
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

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      {/* BACK BUTTON */}
      <Button
        variant="ghost"
        className="flex items-center gap-2 mb-6"
        onClick={() => router.push("/matching/employer")}
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Button>

      <Card className="border-border bg-card">
        {/* HEADER */}
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-2xl">{student.name}</CardTitle>
            <p className="text-muted-foreground">{student.school}</p>
          </div>
          <Badge className="mt-2 sm:mt-0 bg-primary text-primary-foreground">
            {matchScore}% Match
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* BASIC INFO */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {student.location}
            </span>

            {/* DISTANCE */}
            <span className="flex items-center gap-1">
              {loadingDistance ? (
                <span>Calculating distance...</span>
              ) : distance && distance.distance !== "Unknown" ? (
                <>
                  <Clock className="h-4 w-4" />
                  {distance.distance} · {distance.duration}
                </>
              ) : null}
            </span>

            <div className="flex items-center gap-2">
              <span>GPA: {student.gpa}</span>
              {recommendation && (
  <Badge variant="outline" className="gap-1 border-primary/30 text-[10px] text-yellow-600 border-yellow-300 bg-yellow-50">
     Recommended
  </Badge>
)}
            </div>

            <span>Age {student.age}</span>
          </div>

          {/* JOB INTERESTS */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Preferred Positions</h2>
            <div className="flex flex-wrap gap-2">
              {student.preferred_jobs.map((job: string, i: number) => (
                <Badge key={i} variant="secondary">{job}</Badge>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Availability</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(student.availability) &&
                student.availability
                  .filter((a: any) => a.available === true)
                  .map((a: any, i: number) => (
                    <Badge key={i} variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {a.day}: {a.start} - {a.end}
                    </Badge>
                  ))}
            </div>
          </div>

          {/* SHIFT PREF */}
          <div>
            <h2 className="font-semibold text-lg mb-1">Shift Preference</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {student.shift_preference}
            </p>
          </div>


{/* RECOMMENDATION */}
{recommendation && (
  <div>
    <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
       Recommendation
    </h2>
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{recommendation.recommender_name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{recommendation.recommender_relationship}</span>
      </div>
      <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-sm text-foreground italic leading-relaxed">
          "{recommendation.description}"
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Known for: <strong className="text-foreground">{recommendation.how_long_known}</strong></span>
        <span>·</span>
        <span>Would recommend: <strong className="text-foreground">{recommendation.would_recommend}</strong></span>
      </div>
    </div>
  </div>
)}


         {/* CONTACT STUDENT */}
         <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">Contact Student</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border p-3 bg-secondary/30">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{student.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 bg-secondary/30">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{student.phone}</span>
              </div>
            </div>

         {/* NOTIFY BUTTON */}
<div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
  <div>
    <h3 className="font-semibold text-base text-foreground">Already reached out?</h3>
    <p className="text-sm text-muted-foreground mt-1">
      After you've contacted this student by phone or email, send them an in-app nudge so they know to check for your message and take it seriously.
    </p>
  </div>
  <Button
    className="w-full"
    variant="outline"
    onClick={async () => {
      const { data: userData } = await supabase.auth.getUser()
      const employerId = userData?.user?.id
      if (!employerId) return
      const { data: jobData } = await supabase
        .from("job")
        .select("company")
        .eq("user_id", employerId)
        .single()
      const companyName = jobData?.company || "An employer"
      const { error } = await supabase
        .from("student_notifications")
        .insert({
          student_user_id: student.user_id,
          employer_id: employerId,
          message: `Check your phone and email — ${companyName} is interested in hiring you!`,
          read: false,
        })
      if (error) {
        toast.error("Failed to send notification.")
        console.error(error)
      } else {
        toast.success("Student notified!")
      }
    }}
  >
    📲 Send In-App Notification
  </Button>
</div>

            {/* STATUS */}
            <div className="mt-6">
              <h2 className="font-semibold text-lg mb-2">Status</h2>
              <Select
                value={student?.status ?? "new"}
                onValueChange={(value) => {
                  const newStatus = value as "new" | "contacted" | "hired"
                  updateStatus(newStatus)
                  toast.success("Status updated", {
                    description: `Student marked as ${newStatus}`,
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}