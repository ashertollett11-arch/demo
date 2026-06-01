"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import { MapPin } from "lucide-react"

type Job = {
  id: string
  title: string
  company: string
  location: string
  hours: string
  pay: string
  status?: string
  shift_preference?: string
  available_shifts?: any
  has_tips?: boolean
  zip_code?: string
  zip_match_precision?: number
}

export default function MobileStudentPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from("Students")
        .select("availability, shift_preference, zip_code")
        .eq("user_id", user.id)
        .single()

      if (!student) return

      const studentZip = student.zip_code || ""

      const { data: jobsData } = await supabase
        .from("job")
        .select("*")

      const scored = (jobsData || [])
        .filter((job: Job) => job.zip_code && studentZip)
        .map((job: Job) => {
            let shifts = job.available_shifts ?? []
            if (!Array.isArray(shifts)) shifts = Object.values(shifts || {})
          
            const activeShifts = shifts.filter(
              (s: any) =>
                s.active === true ||
                s.active === "true" ||
                s.active === 1
            )
          
            const jobDays = activeShifts.map((s: any) => s.day)
          
            const matchScore = calculateMatch(
              {
                availability: student.availability || [],
                shiftPreference: student.shift_preference || "flexible",
              },
              {
                shifts: jobDays, // ✅ THIS is the fix
                shiftPreference: job.shift_preference || "flexible",
              }
            )
          
            return {
              ...job,
              matchScore: Math.round(matchScore),
            }
          })
        .sort((a, b) => b.matchScore - a.matchScore)

      setJobs(scored)
    }

    fetchJobs()
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
  
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-10">
          No jobs found
        </p>
      ) : (
        <div className="overflow-y-auto px-1 pb-16">
  
          {jobs.map((job) => (
            <Link key={job.id} href={`/matching/student/${job.id}`}>
              <div className="min-h-[180px] sm:min-h-[200px] mb-10 rounded-2xl border bg-card p-5 flex flex-col justify-between active:scale-[0.98] transition">
  
                {/* TOP */}
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="font-semibold text-lg leading-tight line-clamp-2">
                      {job.title}
                    </h2>
  
                    <span className="text-base font-bold text-primary shrink-0">
                      {job.matchScore}%
                    </span>
                  </div>
  
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    {job.company}
                  </p>
                </div>
  
                {/* MIDDLE */}
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{job.location}</span>
                </div>
  
                {/* BOTTOM */}
                <div className="text-base font-medium text-foreground">
                  {job.pay}
                </div>
  
              </div>
            </Link>
          ))}
  
        </div>
      )}
    </div>
  )
}