"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useLoadingMessage } from "@/lib/useLoadingMessage"
import { Clock, Building2, Home, Briefcase, User, Activity } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { LogOut } from "lucide-react"
type ContactedEmployer = {
  id: string
  employer_id: string
  status: string
  updated_at: string
  company: string
  business_type: string
  location_name: string | null
}

type Application = {
  id: string
  location_id: string
  applied_at: string
  location_name: string
  company: string
  hourly_pay: number | null
  has_tips: boolean
  employer_status: string // what the employer has marked: new | contacted | hired
  employer_user_id: string
}

export default function StudentActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const loadingMessage = useLoadingMessage(["Loading activity...", "Checking who’s replied...", "Catching up on your applications..."])
  const [contacted, setContacted] = useState<ContactedEmployer[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [name, setName] = useState("")
  const [studentNotifications, setStudentNotifications] = useState<any[]>([])

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

      // NOTIFICATIONS
      const { data: notifs } = await supabase
        .from("student_notifications").select("*").eq("student_user_id", user.id)
        .eq("read", false).order("created_at", { ascending: false })
      setStudentNotifications(notifs || [])
      // Opening this page counts as reading them; the same events are shown
      // below as pipeline stages, so the badge shouldn't keep nagging.
      if (notifs?.length) {
        await supabase.from("student_notifications").update({ read: true }).eq("student_user_id", user.id).eq("read", false)
      }

      // EMPLOYER ACTIVITY (contacted/hired statuses)
      // One row per location now, so a company with two sites can appear
      // twice — which is correct, and the location name says which.
      const { data: statuses } = await supabase
        .from("student_statuses").select("id, employer_id, location_id, status, updated_at")
        .eq("student_id", studentData.id).in("status", ["contacted", "hired"])
        .order("updated_at", { ascending: false })
      if (statuses?.length) {
        const employerIds = statuses.map(s => s.employer_id)
        const { data: jobs } = await supabase.from("job").select("user_id, company, business_type").in("user_id", employerIds)
        const jobMap: Record<string, { company: string; business_type: string }> = {}
        ;(jobs || []).forEach(j => { jobMap[j.user_id] = { company: j.company, business_type: j.business_type } })
        const statusLocIds = statuses.map(s => s.location_id).filter(Boolean)
        const { data: statusLocs } = statusLocIds.length
          ? await supabase.from("locations").select("id, name").in("id", statusLocIds)
          : { data: [] }
        const locNameById: Record<string, string> = {}
        ;(statusLocs || []).forEach((l: any) => { locNameById[l.id] = l.name })
        setContacted(statuses.map(s => ({
          id: s.id, employer_id: s.employer_id, status: s.status, updated_at: s.updated_at,
          company: jobMap[s.employer_id]?.company || "Unknown Business",
          business_type: jobMap[s.employer_id]?.business_type || "",
          location_name: locNameById[s.location_id] ?? null,
        })))
      }

      // APPLICATIONS — jobs the student has applied to
      const { data: apps } = await supabase
        .from("location_applications")
        .select("id, location_id, created_at")
        .eq("student_user_id", user.id)
        .order("created_at", { ascending: false })

      if (apps?.length) {
        const locationIds = apps.map(a => a.location_id)
        const { data: locations } = await supabase
          .from("locations")
          .select("id, name, hourly_pay, has_tips, employer_id, job:employer_id(company, user_id)")
          .in("id", locationIds)

        // Get employer statuses for this student
        // Keyed by location, not employer: an application is to one site, so
        // that site's pipeline is the one that answers it.
        const { data: empStatuses } = await supabase
          .from("student_statuses")
          .select("location_id, status")
          .eq("student_id", studentData.id)

        const statusByLocation: Record<string, string> = {}
        ;(empStatuses || []).forEach(s => { if (s.location_id) statusByLocation[s.location_id] = s.status })

        const locMap: Record<string, any> = {}
        ;(locations || []).forEach(l => { locMap[l.id] = l })

        setApplications(apps.map(a => {
          const loc = locMap[a.location_id]
          const jobData = Array.isArray(loc?.job) ? loc?.job[0] : loc?.job
          const employerUserId = jobData?.user_id || ""
          const empStatus = statusByLocation[a.location_id] || "new"
          return {
            id: a.id,
            location_id: a.location_id,
            applied_at: a.created_at,
            location_name: loc?.name || "Unknown Location",
            company: jobData?.company || "Unknown Company",
            hourly_pay: loc?.hourly_pay ?? null,
            has_tips: Boolean(loc?.has_tips),
            employer_status: empStatus,
            employer_user_id: employerUserId,
          }
        }))
      }

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

  // One place that decides what a stage looks like and what the student should
  // do about it, so the same event can't be described three different ways.
  const STAGES = {
    applied:   { emoji: "📨", label: "Applied",        hint: "Waiting to hear back",                 chip: "bg-secondary text-muted-foreground" },
    contacted: { emoji: "📬", label: "They reached out", hint: "Check your phone and email — reply soon", chip: "bg-blue-500/10 text-blue-600" },
    hired:     { emoji: "🎉", label: "Hired",          hint: "Congratulations — you got the job",    chip: "bg-green-500/10 text-green-600" },
    interested:{ emoji: "⭐", label: "Interested in you", hint: "They found your profile and reached out", chip: "bg-amber-500/10 text-amber-700" },
  } as const

  type StageKey = keyof typeof STAGES

  const stageFor = (empStatus: string): StageKey =>
    empStatus === "hired" ? "hired" : empStatus === "contacted" ? "contacted" : "applied"

  const StageChip = ({ stage }: { stage: StageKey }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STAGES[stage].chip}`}>
      <span aria-hidden>{STAGES[stage].emoji}</span>
      {STAGES[stage].label}
    </span>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-muted-foreground text-sm">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  const initials = (name || "").trim().split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "?"

  // An employer who contacted a student who also applied is the SAME event —
  // show it once, on the application, instead of repeating it below.
  const appliedEmployerIds = new Set(applications.map(a => a.employer_user_id).filter(Boolean))
  const foundYou = contacted.filter(c => !appliedEmployerIds.has(c.employer_id))

  const counts = {
    applied: applications.length,
    waiting: applications.filter(a => stageFor(a.employer_status) === "applied").length,
    replied: applications.filter(a => stageFor(a.employer_status) === "contacted").length + foundYou.length,
    hired: applications.filter(a => stageFor(a.employer_status) === "hired").length
          + contacted.filter(c => c.status === "hired").length,
  }

  // What the student should do next, surfaced once at the top
  const needsReply = counts.replied > 0

  return (
    <div className="min-h-screen bg-background pb-36">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="w-9" />
          <p className="text-base font-bold text-foreground">Activity</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2.5 border-b">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-muted-foreground">Student Account</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/student/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <User className="h-4 w-4 text-muted-foreground" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/matching/student" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <Briefcase className="h-4 w-4 text-muted-foreground" /> Jobs Near You
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* WHAT TO DO NEXT — one line, only when there is something to do */}
        {needsReply && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none" aria-hidden>📬</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {counts.replied === 1 ? "An employer is waiting on you" : `${counts.replied} employers are waiting on you`}
                </p>
                <p className="mt-0.5 text-xs text-blue-700">
                  Check your phone and email — replying quickly is the single biggest thing you can do.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PIPELINE SUMMARY */}
        {(applications.length > 0 || foundYou.length > 0) && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {[
              { k: "waiting", emoji: "📨", n: counts.waiting, label: "Waiting" },
              { k: "replied", emoji: "📬", n: counts.replied, label: "Replied" },
              { k: "hired",   emoji: "🎉", n: counts.hired,   label: "Hired" },
            ].map(({ k, emoji, n, label }) => (
              <div key={k} className="rounded-2xl border border-border/60 bg-card px-3 py-3 text-center">
                <p className="text-lg leading-none" aria-hidden>{emoji}</p>
                <p className="mt-1.5 text-xl font-bold text-foreground">{n}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* APPLICATIONS */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">My applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {applications.length > 0
              ? `${applications.length} job${applications.length !== 1 ? "s" : ""} applied to`
              : "You haven't applied to any jobs yet"}
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Briefcase className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">Browse jobs and hit Apply to get started.</p>
            <Link href="/matching/student" className="mt-1 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {applications.map(app => (
              <div key={app.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                    {app.company[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm">{app.company}</p>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatTime(app.applied_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.location_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {app.hourly_pay && (
                        <span className="text-xs font-medium text-foreground">${app.hourly_pay}/hr{app.has_tips ? " + tips" : ""}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StageChip stage={stageFor(app.employer_status)} />
                      <span className="text-xs text-muted-foreground">{STAGES[stageFor(app.employer_status)].hint}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPLOYERS WHO FOUND YOU — only those the student did NOT apply to,
            so a contact is never shown twice */}
        {foundYou.length > 0 && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">Employers who found you</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {foundYou.length === 1
                  ? "1 employer reached out without an application"
                  : `${foundYou.length} employers reached out without an application`}
              </p>
            </div>

            <div className="space-y-3">
              {foundYou.map(item => {
                const stage = item.status === "hired" ? "hired" : "interested"
                return (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                        {item.company[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground text-sm truncate">{item.company}</p>
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatTime(item.updated_at)}
                          </span>
                        </div>
                        {item.business_type && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />{item.business_type}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StageChip stage={stage} />
                          <span className="text-xs text-muted-foreground">{STAGES[stage].hint}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* NOTHING AT ALL YET */}
        {applications.length === 0 && foundYou.length === 0 && (
          <div className="rounded-2xl border border-border/40 bg-secondary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Employers contact you directly by phone or email.{" "}
              <Link href="/student/profile" className="text-primary font-medium">Keep your profile updated</Link>{" "}
              so they can reach you.
            </p>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
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