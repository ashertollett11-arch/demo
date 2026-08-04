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

  // -------------------------
  // LOAD EMPLOYER + STUDENT
  // -------------------------
  useEffect(() => {
    if (!studentId) return

    const loadStudent = async () => {
      setLoading(true)

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

      const { data: studentData, error } = await supabase
        .from("Students")
        .select("*")
        .eq("id", studentId)
        .single()

      if (error) { console.error(error); setLoading(false); return }
      setStudent(studentData)

      // Load existing status
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

  // -------------------------
  // FETCH DISTANCE
  // -------------------------
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

  // -------------------------
  // MATCH SCORE
  // -------------------------
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

  // -------------------------
  // UPDATE STATUS
  // -------------------------
  const updateStatus = async (newStatus: string) => {
    if (!employerId) return
    setSavedStatus(newStatus)

    await supabase
      .from("student_statuses")
      .upsert(
        { employer_id: employerId, student_id: studentId, status: newStatus },
        { onConflict: "employer_id,student_id" }
      )

    toast.success(`Status updated to ${newStatus}`)
  }

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading student profile...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    )
  }

  const availableDays = (student.availability ?? [])
    .filter((a: any) => a?.available)
    .map((a: any) => a?.day)

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Student Profile</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">

        {/* PROFILE HEADER */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {student.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{student.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      GPA: {student.gpa ?? "N/A"}
                      {student.is_gpa_verified && (
                        <Badge variant="outline" className="gap-1 text-[10px] ml-1">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* DISTANCE */}
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {loadingDistance ? (
                      <span className="text-xs">Calculating distance...</span>
                    ) : distance && distance.distance !== "Unknown" ? (
                      <span className="flex items-center gap-2">
                        <span>{distance.distance}</span>
                        {distance.duration && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <Clock className="h-3 w-3" />
                            <span>{distance.duration}</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs">Distance unavailable</span>
                    )}
                  </div>
                </div>
              </div>

              <Badge className="bg-primary/10 text-primary text-sm px-3 py-1 shrink-0">
                {matchScore}% match
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* STATUS */}
        <Card>
          <CardHeader><CardTitle>Candidate Status</CardTitle></CardHeader>
          <CardContent>
            <Select value={savedStatus ?? "new"} onValueChange={updateStatus}>
              <SelectTrigger className="w-full">
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
              <Calendar className="h-5 w-5" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {availableDays.length > 0 ? (
                availableDays.map((day: string) => (
                  <Badge key={day} variant="secondary">{day}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No availability listed</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
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
                {student.interests.map((interest: string) => (
                  <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SCHOOL */}
        {student.school && (
          <Card>
            <CardHeader><CardTitle>Education</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{student.school}</p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}