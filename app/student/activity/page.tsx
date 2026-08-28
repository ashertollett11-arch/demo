"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Clock, Building2, Bell, Home, Briefcase, User, Activity } from "lucide-react"
import Link from "next/link"

type ContactedEmployer = {
  id: string
  employer_id: string
  status: string
  updated_at: string
  company: string
  business_type: string
  location_name: string | null
}

export default function StudentActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [contacted, setContacted] = useState<ContactedEmployer[]>([])
  const [name, setName] = useState("")

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (roleData?.role !== "student") { router.replace("/login"); return }
      const { data: studentData } = await supabase
        .from("Students").select("id, name, profile_complete").eq("user_id", user.id).maybeSingle()
      if (!studentData?.profile_complete) { router.replace("/student/onboarding"); return }
      setName(studentData.name || "")
      const { data: statuses } = await supabase
        .from("student_statuses")
        .select("id, employer_id, status, updated_at")
        .eq("student_id", studentData.id)
        .in("status", ["contacted", "hired"])
        .order("updated_at", { ascending: false })
      if (!statuses?.length) { setLoading(false); return }
      const employerIds = statuses.map((s) => s.employer_id)
      const { data: jobs } = await supabase.from("job").select("user_id, company, business_type").in("user_id", employerIds)
      const jobMap: Record<string, { company: string; business_type: string }> = {}
      ;(jobs || []).forEach((j) => { jobMap[j.user_id] = { company: j.company, business_type: j.business_type } })
      setContacted(statuses.map((s) => ({
        id: s.id, employer_id: s.employer_id, status: s.status, updated_at: s.updated_at,
        company: jobMap[s.employer_id]?.company || "Unknown Business",
        business_type: jobMap[s.employer_id]?.business_type || "",
        location_name: null,
      })))
      setLoading(false)
    }
    load()
  }, [router])

  const formatTime = (ts: string) => {
    if (!ts) return "Recently"
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-muted-foreground text-sm">Loading activity...</p>
        </div>
      </div>
    )
  }

  const initials = (name || "").trim().split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "?"

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          {/* placeholder left */}
          <div className="w-9" />
          <p className="text-base font-bold text-foreground">Activity</p>
          {/* AVATAR */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* GREETING */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">Employer Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contacted.length > 0
              ? `${contacted.length} employer${contacted.length !== 1 ? "s" : ""} have shown interest`
              : "No employer activity yet"}
          </p>
        </div>

        {contacted.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Bell className="h-9 w-9 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                When an employer contacts you or marks you as hired, it'll show up here.
              </p>
            </div>
            <Link href="/matching/student"
              className="mt-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-semibold">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">

            {/* CARDS */}
            {contacted.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start gap-3">
                  {/* COMPANY INITIAL */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {item.company[0]?.toUpperCase() || "?"}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">{item.company}</p>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(item.updated_at)}
                      </span>
                    </div>
                    {item.business_type && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {item.business_type}
                      </p>
                    )}
                    <div className="mt-2">
                      {item.status === "contacted" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600">
                          📬 Reached out to you
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                          ✅ Marked you as hired
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* TIP */}
                {item.status === "contacted" && (
                  <div className="mt-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Check your <span className="font-semibold text-foreground">phone and email</span> — they may have already reached out directly.
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* FOOTER TIP */}
            <div className="rounded-2xl border border-border/40 bg-secondary/20 p-4 text-center mt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Employers contact you directly by phone or email.{" "}
                <Link href="/student/profile" className="text-primary font-medium">
                  Keep your profile updated
                </Link>{" "}
                so they can reach you.
              </p>
            </div>

          </div>
        )}
      </div>

      {/* BOTTOM NAV — Uber style floating pill */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-1 rounded-full bg-foreground px-2 py-2 shadow-2xl">
          <Link href="/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/matching/student" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] font-medium">Jobs</span>
          </Link>
          <Link href="/student/activity" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-background text-foreground transition-colors">
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium">Activity</span>
          </Link>
          <Link href="/student/profile" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-background/60 hover:text-background transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </div>

    </div>
  )
}