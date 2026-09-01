"use client"
import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { calculateMatch } from "@/lib/matchScore"
import {
  MapPin,
  Search,
  User,
  Coffee,
  Utensils,
  Hotel,
  Dumbbell,
  ShoppingBag,
  Building2,
} from "lucide-react"

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
  zip_code?: string
}

function getColor(score: number) {
    if (score >= 80) return "#a855f7" // bright purple
    if (score >= 50) return "#c084fc" // medium purple
    return "#fb7185" // soft pink-red (still readable but not harsh)
  }

function getCompanyIcon(job: any) {
  const text = `${job.company} ${job.title}`.toLowerCase()

  if (text.includes("coffee") || text.includes("cafe")) return Coffee
  if (text.includes("restaurant") || text.includes("bar")) return Utensils
  if (text.includes("hotel")) return Hotel
  if (text.includes("gym")) return Dumbbell
  if (text.includes("store") || text.includes("retail")) return ShoppingBag

  return Building2
}

function MatchCircle({ score }: { score: number }) {
  const size = 92
  const stroke = 8
  const radius = 34

  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getColor(score)

  return (
    <svg height={size} width={size} className="shrink-0">
      {/* background */}
      <circle
        stroke="#2a1b3d"
        fill="transparent"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />

      {/* progress */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="16"
        fontWeight="bold"
        fill={color}
      >
        {score}%
      </text>
    </svg>
  )
}
export const metadata = {
  robots: { index: false, follow: false }
}
export default function MobileStudentPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
  
      if (!session?.user) {
        router.replace("/login/mobile")
        return
      }
  
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()
  
      if (!roleData || roleData.role !== "student") {
        router.replace("/login/mobile")
      }
    }
  
    checkAuth()
  }, [])

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
        .filter((job: any) => job.zip_code && studentZip)
        .map((job: any) => {
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
    <div className="min-h-screen bg-[#0b0614] text-white p-6 pb-28">

      {/* HEADER */}
      <div className="mb-6 w-full text-center">
        <img
          src="/icon-512x512.png"
          className="h-20 w-20 mx-auto mb-3"
        />

        <h1 className="text-4xl font-bold text-white">
          Simply Apply
        </h1>

        <p className="text-purple-300 mt-2">
          Simple. Smart. Speedy.
        </p>

        <div className="flex justify-between mt-4 px-1">
          <span className="font-semibold text-white">Best matches</span>

    
        </div>
      </div>

      {/* JOBS */}
      <div className="overflow-y-auto px-1">
  {jobs.map((job) => {
    const Icon = getCompanyIcon(job)
    const isHighMatch = job.matchScore >= 80

    return (
      <Link key={job.id} href={`/matching/mobile/${job.id}`}>
        <div
          className={`
            mb-10 rounded-2xl p-5 flex flex-col
            border transition-all duration-300
            bg-[#140a25]

            ${
              isHighMatch
                ? "border-purple-400/40 shadow-[0_0_35px_rgba(168,85,247,0.25)]"
                : "border-purple-900/40"
            }

            hover:bg-[#1b1033]
            hover:shadow-[0_0_25px_rgba(168,85,247,0.20)]
          `}
        >
          {/* TOP */}
          <div className="flex justify-between gap-4">
            <div className="flex gap-3 flex-1">
              <Icon className="h-6 w-6 text-purple-300 mt-1" />

              <div>
                <h2 className="font-semibold text-lg text-white line-clamp-2">
                  {job.title}
                </h2>

                <p className="text-sm text-purple-300">
                  {job.company}
                </p>
              </div>
            </div>

            <MatchCircle score={job.matchScore} />
          </div>

          {/* LOCATION */}
          <div className="flex items-center text-sm text-purple-300 gap-2 mt-3">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.location}</span>
          </div>

          {/* PAY + STATUS */}
          <div className="flex justify-between mt-2">
            <div className="font-medium text-white">
              {job.pay}
            </div>

            {job.status && (
              <span className="text-xs px-2 py-1 rounded-full border border-purple-800 bg-purple-900/30 text-purple-200 capitalize">
                {job.status}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  })}
</div>
      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-purple-900/40 bg-[#0b0614]/95 backdrop-blur z-50">
        <div className="flex justify-between px-8 py-6 text-white">

        <button
  onClick={async () => {
    await supabase.auth.signOut()
    router.replace("/login/mobile")
  }}
>
  <LogOut className="h-5 w-5" />
  <div className="text-xs mt-2 text-purple-300">Log out</div>
</button>

          <button onClick={() => router.push("/student/mobile")} className="-mt-6">
            <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs mt-2 font-medium">Home</div>
          </button>

          <button onClick={() => router.push("/student/mobileprofile")}>
            <User className="h-5 w-5" />
            <div className="text-xs mt-2 text-purple-300">Profile</div>
          </button>

        </div>
      </div>

    </div>
  )
}