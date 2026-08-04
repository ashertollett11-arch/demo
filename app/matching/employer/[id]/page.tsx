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

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)
  const [employerShifts, setEmployerShifts] = useState<any[]>([])
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [employerId, setEmployerId] = useState<string | null>(null)
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

      if (!userId) { setLoading(false); return }
      setEmployerId(userId)

      const { data: employerJob } = await supabase
        .from("job")
        .select("available_shifts, shift_preference, preferred_jobs, location, zip_code")
        .eq("user_id", userId)
        .single()

      setEmployerShifts(employerJob?.available_shifts ?? [])
      setShiftPreference(employerJob?.shift_preference ?? "flexible")
      setPreferredJobs(employerJob?.preferred_jobs ?? [])

      if (employerJob?.location && employerJob?.zip_code) {
        setEmployerLocation({
          address: employerJob.location,
          zip: employerJob.zip_code,
        })
      }

      // GET STUDENT
      const { data: studentData, error } = await supabase
        .from("Students")
        .select("*")
        .eq("id", studentId)
        .single()

      if (error) { console.error(error); setLoading(false); return }
      setStudent(studentData)

      // GET EXISTING STATUS
      const { data: statusData } = await supabase
        .from("student_statuses")
        .select("status")
        .eq("employer_id", userId)
        .eq("student_id", studentId)
        .maybeSingle()

      setSavedStatus(statusData?.status ?? "new")
      setLoading(false)
    }

    loadStudent()
  }, [studentId])

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

  // MATCH SCORE
  const activeShifts = useMemo(() => {
    return Array.isArray(employerShifts)
      ? employerShifts.filter((s) => s.active === true || s.active === "true" || s.active === 1)
      : []
  }, [employerShifts])

  const jobDays = useMemo(() => activeShifts.map((s) => s.day), [activeShifts])

  const matchScore = useMemo(() => {
    if (!student) return 0
    return Math.round(
      calculateEmployerMatch(
        { shifts: jobDays, shiftPreference, preferred_jobs: preferredJobs },
        student.availability,
        student.shift_preference,
        student.gpa,
        student.preferred_jobs
      )
    )
  }, [student, jobDays, shiftPreference, preferredJobs])

  // UPDATE STATUS
  const updateStatus = async (newStatus: string) => {
    if (!employerId) return
    setSavedStatus(newStatus)

    const { error } = await supabase
      .from("student_statuses")
      .upsert(
        { employer_id: employerId, student_id: studentId, status: newStatus },
        { onConflict: "employer_id,student_id" }
      )

    if (error) {
      console.error(error)
      toast.error("Failed to update status")
      return
    }

    toast.success(`Marked as ${newStatus}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    )
  }

  const availableDays = (student.availability ?? [])
    .filter((a: any) => a?.available)
    .map((a: any) => `${a.day} ${a.start}–${a.end}`)

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* BACK */}
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 -ml-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {/* HEADER CARD */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {student.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{student.name}</h1>

                  {/* GPA */}
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>GPA: {student.gpa ?? "N/A"}</span>
                    {student.is_gpa_verified && (
                      <Badge variant="outline" className="text-[10px] gap-1 ml-1">✓ Verified</Badge>
                    )}
                  </div>

                  {/* DISTANCE */}
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {loadingDistance ? (
                      <span className="text-xs">Calculating...</span>
                    ) : distance && distance.distance !== "Unknown" ? (
                      <span className="flex items-center gap-1.5">
                        {distance.distance}
                        {distance.duration && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            {distance.duration}
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs">Distance unavailable</span>
                    )}
                  </div>

                  {/* AGE + SCHOOL */}
                  {student.age && (
                    <p className="text-sm text-muted-foreground mt-0.5">Age: {student.age}</p>
                  )}
                  {student.school && (
                    <p className="text-sm text-muted-foreground mt-0.5">{student.school}</p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-primary">{matchScore}%</div>
                <div className="text-xs text-muted-foreground">match</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STATUS */}
        <Card>
          <CardHeader><CardTitle>Candidate Status</CardTitle></CardHeader>
          <CardContent>
            <Select value={savedStatus ?? "new"} onValueChange={updateStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* AVAILABILITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableDays.length > 0 ? (
              <ul className="space-y-1">
                {availableDays.map((d: string) => (
                  <li key={d} className="text-sm text-foreground">{d}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No availability listed</p>
            )}
            <p className="text-sm text-muted-foreground mt-2 capitalize">
              Shift preference: {student.shift_preference || "flexible"}
            </p>
          </CardContent>
        </Card>

        {/* PREFERRED JOBS */}
        {student.preferred_jobs?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Preferred Positions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.preferred_jobs.map((job: string) => (
                  <Badge key={job} variant="outline">{job}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* INTERESTS */}
        {student.interests?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Interests</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.interests.map((i: string) => (
                  <Badge key={i} variant="secondary">{i}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}