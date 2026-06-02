"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ChevronLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import { toast } from "sonner"

// --------------------
// Helpers (UNCHANGED)
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
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user

      if (!user?.id) {
        router.replace("/login")
        return
      }

      const { data: profile } = await supabase
        .from("Students")
        .select("profile_complete")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile?.profile_complete) {
        router.replace("/student/profile?missing=true")
      }
    }

    run()
  }, [router])

  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<any[]>([])
  const [jobMatchScore, setJobMatchScore] = useState(0)

  // --------------------
  // Load student availability (UNCHANGED)
  // --------------------
  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("Students")
        .select("availability, shift_preference")
        .eq("user_id", user.id)
        .single()

      setAvailability(data?.availability || [])
    }

    fetchStudent()
  }, [])

  // --------------------
  // Fetch job (UNCHANGED LOGIC)
  // --------------------
  useEffect(() => {
    const fetchJob = async () => {
      const id = params.id as string
      if (!id) {
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

      if (error || !data) {
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
  // Match score (UNCHANGED)
  // --------------------
  useEffect(() => {
    if (!job || !availability.length) return

    let shifts = job.available_shifts ?? []
    if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})

    const activeShifts = shifts.filter(
      (s: any) =>
        s.active === true ||
        s.active === "true" ||
        s.active === 1
    )

    const jobDays = activeShifts.map((s: any) => s.day)

    const score = calculateMatch(
      {
        availability,
        shiftPreference: "flexible",
      },
      {
        shifts: jobDays,
        shiftPreference: job.shift_preference || "flexible",
      }
    )

    setJobMatchScore(Math.round(score))
  }, [job, availability])

  if (loading) return <div className="p-6">Loading job...</div>
  if (!job) return <div className="p-6">Job not found</div>

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0614] text-foreground">
  
      {/* 🌌 DARK PURPLE AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#120a1f] via-[#0b0614] to-[#0a0818]" />
  
      {/* ✨ GLOW LAYERS */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-3xl" />
      <div className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-3xl" />
  
      {/* 🌑 VIGNETTE */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/40" />
  
      <div className="relative z-10 min-h-screen p-4 sm:p-8">
  
        {/* BACK BUTTON */}
      {/* BACK BUTTON */}
<Button
  variant="ghost"
  className="mb-6 gap-2 rounded-xl border border-white/10 bg-background/60 text-foreground backdrop-blur-md hover:bg-violet-500/15 hover:text-white transition"
  onClick={() => router.push("/student/mobile")}
>
  <ChevronLeft className="h-4 w-4" />
  Back
</Button>
  
        {/* CARD */}
        <Card className="border-white/10 bg-black/20 backdrop-blur-2xl shadow-2xl">  
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
  
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {job.title}
              </CardTitle>
              <p className="text-sm text-white/70 leading-relaxed">
                              {job.company}
              </p>
            </div>
  
            <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {job.status}
            </Badge>
  
          </CardHeader>
  
          <CardContent className="space-y-5">
  
            {/* LOCATION + PAY */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
  
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
  
              <span className="font-semibold text-violet-300">
                {job.pay}
              </span>
  
              {job.tips ? (
                <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
                  + Tips
                </Badge>
              ) : (
                <Badge className="bg-white/5 text-white/60 border border-white/10">
                  No Tips
                </Badge>
              )}
  
            </div>
  
            {/* DESCRIPTION */}
            <div>
            <h2 className="text-lg font-semibold mb-1 text-white/95">
                            Description
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                              {job.details}
              </p>
            </div>
  
            {/* SHIFTS */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-white">
                Available Shifts
              </h2>
  
              <div className="space-y-1 text-sm text-muted-foreground">
                {job.available_shifts
                  ?.filter((shift: any) => shift.active)
                  .map((shift: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="w-24 font-medium text-white">
                        {shift.day}
                      </span>
                      <span>
                        {shift.start} – {shift.end}
                      </span>
                    </div>
                  ))}
              </div>
  
              <div className="mt-3">
                <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {job.shift_preference}
                </Badge>
              </div>
            </div>
  
            {/* MATCH SCORE */}
            <div className="text-sm text-muted-foreground">
              Match Score:
              <span className="ml-2 text-violet-300 font-semibold">
                {jobMatchScore}%
              </span>
            </div>
  
            {/* APPLY BUTTON */}
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition shadow-lg hover:shadow-violet-500/20"
              onClick={async () => {
                const { data: authData } = await supabase.auth.getUser()
                const studentId = authData?.user?.id
  
                if (!studentId) return
  
                const { data: studentData } = await supabase
                  .from("Students")
                  .select("name")
                  .eq("user_id", studentId)
                  .single()
  
                const studentName = studentData?.name || "A student"
  
                const { data: jobData } = await supabase
                  .from("job")
                  .select("user_id, title")
                  .eq("id", job.id)
                  .single()
  
                await supabase.from("notifications").insert({
                  employer_id: jobData.user_id,
                  student_user_id: studentId,
                  type: "application",
                  title: "New Applicant",
                  message: `${studentName} applied to ${jobData.title}`,
                  read: false,
                })
  
                toast.success(`Applied to ${job.title}!`)
              }}
            >
              Apply Now
            </Button>
  
          </CardContent>
        </Card>
      </div>
    </div>
  )
}