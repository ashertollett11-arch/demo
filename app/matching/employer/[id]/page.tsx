"use client"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MapPin, Star, Calendar } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"
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
const [shiftPreference, setShiftPreference] = useState<
  "morning" | "night" | "flexible"
>("flexible")

const [preferredJobs, setPreferredJobs] = useState<string[]>([])

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
      .select("available_shifts, shift_preference, preferred_jobs")
      .eq("user_id", userId)
      .single()
    
      setEmployerShifts(employerJob?.available_shifts ?? [])
      setShiftPreference(employerJob?.shift_preference ?? "flexible")
      setPreferredJobs(employerJob?.preferred_jobs ?? [])
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
          // temporary until second effect runs
        }
  
      setStudent(finalStudent)
      setLoading(false)
    }
  
    loadStudent()
  }, [studentId, router])
  
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
    // 1. update UI immediately
    setStudent((prev: any) => ({
      ...prev,
      status: newStatus,
    }))
  
    console.log("studentId from URL:", studentId)

    // 3. get employer ID
    const { data: userData } = await supabase.auth.getUser()
    const employerId = userData?.user?.id
  
    if (!employerId) return
  
    // 4. save to database
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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading student...
      </div>
    )
  }
  
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Student not found
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

            <div className="flex items-center gap-2">
  <Star className="h-4 w-4 text-yellow-500" />

  <span>GPA: {student.gpa}</span>

  {student.is_gpa_verified && (
    <Badge
      variant="outline"
      className="gap-1 border-primary/30 text-[10px]"
    >
      Verified
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
                <Badge key={i} variant="secondary">
                  {job}
                </Badge>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
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


  {/* KEEP HIRE BUTTON */}
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