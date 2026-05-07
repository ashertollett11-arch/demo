"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ChevronLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"

// --------------------
// Helpers
// --------------------
function parseTime(t: string) {
  const [time, modifier] = t.split(" ")
  let [hours, minutes] = time.split(":").map(Number)

  if (modifier === "PM" && hours !== 12) hours += 12
  if (modifier === "AM" && hours === 12) hours = 0

  return hours + minutes / 60
}

// --------------------
// Page
// --------------------
export default function JobPage() {
  const params = useParams()
  const router = useRouter()

  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [availability, setAvailability] = useState<any[]>([])
  const [jobMatchScore, setJobMatchScore] = useState(0)

  // --------------------
  // Load availability
  // --------------------
  useEffect(() => {
    const fetchStudent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
  
      if (!user) return
  
      const { data, error } = await supabase
        .from("Students")
        .select("availability, shift_preference")
        .eq("user_id", user.id)
        .single()
  
      if (error || !data) {
        console.log("STUDENT FETCH ERROR:", error)
        return
      }
  
      setAvailability(data.availability || [])
    }
  
    fetchStudent()
  }, [])
  // --------------------
  // Fetch job from Supabase
  // --------------------
  useEffect(() => {
    const fetchJob = async () => {
      console.log("RAW PARAMS:", params)
  
      const id = params.id as string
  
      if (!id) {
        console.log("❌ Invalid jobId:", id)
        setLoading(false)
        return
      }
  
      setLoading(true)
  
      const { data, error } = await supabase
        .from("job")
        .select(`
          id,
          title,
          company,
          location,
          pay,
          details,
          available_shifts,
          shift_preference,
          status,
          has_tips
        `)
        .eq("id", id)
        .single()
  
      console.log("SUPABASE RESPONSE:", { data, error })
  
      if (error || !data) {
        console.log("❌ Supabase error or no job:", error)
        setLoading(false)
        return
      }
  
      setJob({
        ...data,
        tips: Boolean(data.has_tips),
      })
  
      setLoading(false)
    }
  
    fetchJob()
  }, [params.id])
  // --------------------
  // Match score
  // --------------------
  useEffect(() => {
    if (!job || !availability.length) return
  
    // normalize shifts exactly like working page
    let shifts = job.available_shifts ?? []
  
    if (!Array.isArray(shifts)) {
      shifts = Object.values(shifts || {})
    }
  
    const activeShifts = shifts.filter(
      (s: any) =>
        s.active === true ||
        s.active === "true" ||
        s.active === 1
    )
  
    const jobDays = activeShifts.map((s: any) => s.day)
  
    const score = calculateMatch(
      {
        availability: availability,
        shiftPreference: "flexible", // or pull from localStorage if you store it
      },
      {
        shifts: jobDays,
        shiftPreference: job.shift_preference || "flexible",
      }
    )
  
    setJobMatchScore(Math.round(score))
  }, [job, availability])

  // --------------------
  // UI states
  // --------------------
  if (loading) {
    return <div className="p-6">Loading job...</div>
  }

  if (!job) {
    return <div className="p-6">Job not found</div>
  }

  // --------------------
  // UI
  // --------------------
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">

<Button
  variant="ghost"
  className="flex items-center gap-2 mb-6"
  onClick={() => {
   
      router.push("/matching/student") // or "/jobs"
    
  }}
>
  <ChevronLeft className="h-4 w-4" />
  Back
</Button>

      <Card className="border-border bg-card">

        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-2xl">{job.title}</CardTitle>
            <p className="text-muted-foreground">{job.company}</p>
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

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>

            <span className="font-semibold text-primary">
              {job.pay}
            </span>
            {job.tips ? (
      <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] px-2 py-0">
       + Tips
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] px-2 py-0">
        no tips
      </Badge>
    )}
          
          
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-1">Description</h2>
            <p className="text-sm text-muted-foreground">
              {job.details}
            </p>
          </div>

          <div>
          <h2 className="font-semibold text-lg mb-2">
  Available Shifts
</h2>

<div className="space-y-1 text-sm text-muted-foreground">
  {job.available_shifts
    ?.filter((shift: any) => shift.active)
    .map((shift: any, i: number) => (
      <div key={i} className="flex gap-2">
        <span className="font-medium text-foreground w-24">
          {shift.day}
        </span>
        <span>
          {shift.start} – {shift.end}
        </span>
      </div>
    ))}
</div>

            <div>
  <h2 className="font-semibold text-lg mb-2">
   
  </h2>

  <Badge variant="secondary">
    {job.shift_preference}
  </Badge>
</div>
          </div>

          <div className="text-sm text-muted-foreground">
            Match Score:{" "}
            <span className="text-primary font-semibold">
              {jobMatchScore}%
            </span>
          </div>

          <Button
  className="w-full mt-4"
  onClick={async () => {
    // 1. Get current student
    const { data: authData } = await supabase.auth.getUser()
    const studentId = authData?.user?.id

    if (!studentId) {
      console.log("No student user")
      return
    }

    // 2. Get student name
    const { data: studentData } = await supabase
      .from("Students")
      .select("name")
      .eq("user_id", studentId)
      .single()

    const studentName = studentData?.name || "A student"

    // 3. Get employer from THIS job
    const { data: jobData, error: jobError } = await supabase
      .from("job")
      .select("user_id, title")
      .eq("id", job.id)
      .single()

    if (jobError || !jobData) {
      console.log("JOB FETCH ERROR:", jobError)
      return
    }

    const employerId = jobData.user_id

    // 4. Insert notification
    const { error: notifError } = await supabase
  .from("notifications")
  .insert({
    employer_id: employerId,
    student_user_id: studentId,
    type: "application",
    title: "New Applicant",
    message: `${studentName} applied to ${jobData.title}`,
    read: false,
  })

    if (notifError) {
      console.log("NOTIFICATION ERROR:", notifError)
    }

    // 5. Feedback
    alert(`Applied to ${job.title} at ${job.company}`)
  }}
>
  Apply Now
</Button>

        </CardContent>
      </Card>
    </div>
  )
}