"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import { MapPin, Search, User } from "lucide-react"

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
              shifts: jobDays,
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
    <div className="min-h-screen bg-background p-6 pb-28">
      {/* HEADER */}
<div className="mb-6 flex items-start gap-3">

{/* LOGO */}
<img
  src="/icon-512x512.png"
  alt="Simply Apply logo"
  className="h-12 w-12 rounded-xl object-contain"
/>

{/* TEXT BLOCK */}
<div className="flex flex-col">

  {/* BRAND NAME */}
  <h1 className="text-2xl font-bold text-foreground leading-tight">
    Simply Apply
  </h1>

  {/* TAGLINE */}
  <p className="text-sm text-muted-foreground">
    Simple. Smart. Speedy.
  </p>

  {/* SUB TEXT */}
  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
    <span className="font-medium text-primary">Best matches</span>
    <span>•</span>
    <button
      onClick={() => router.push("/matching/student")}
      className="hover:text-foreground underline underline-offset-2"
    >
      See all
    </button>
  </div>

</div>
</div>
      {/* JOB LIST */}
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-10">
          No jobs found
        </p>
      ) : (
        <div className="overflow-y-auto px-1">
          {jobs.map((job) => (
            <Link key={job.id} href={`/matching/student/${job.id}`}>
              <div className="min-h-[180px] mb-10 rounded-2xl border bg-card p-5 flex flex-col justify-between active:scale-[0.98] transition">
                
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

                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{job.location}</span>
                </div>

                <div className="text-base font-medium text-foreground">
                  {job.pay}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex justify-around items-center py-3">

          {/* SEARCH */}
          <button
            onClick={() => router.push("/matching/student")}
            className="flex flex-col items-center text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">All Matches</span>
          </button>

          {/* PROFILE */}
          <button
            onClick={() => router.push("/student/profile")}
            className="flex flex-col items-center text-muted-foreground hover:text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>

        </div>
      </div>
    </div>
  )
}