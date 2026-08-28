"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Briefcase, Bell, Clock, Building2 } from "lucide-react"
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
  const [studentId, setStudentId] = useState<string | null>(null)
  const [name, setName] = useState("")

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: roleData } = await supabase
        .from("users").select("role").eq("id", user.id).maybeSingle()
      if (roleData?.role !== "student") { router.replace("/login"); return }

      const { data: studentData } = await supabase
        .from("Students")
        .select("id, name, profile_complete")
        .eq("user_id", user.id)
        .maybeSingle()
      if (!studentData?.profile_complete) { router.replace("/student/onboarding"); return }

      setStudentId(studentData.id)
      setName(studentData.name || "")

      // Load all statuses where this student was contacted or hired
      const { data: statuses } = await supabase
        .from("student_statuses")
        .select("id, employer_id, status, updated_at")
        .eq("student_id", studentData.id)
        .in("status", ["contacted", "hired"])
        .order("updated_at", { ascending: false })

      if (!statuses?.length) { setLoading(false); return }

      // Get employer job info for each status
      const employerIds = statuses.map((s) => s.employer_id)
      const { data: jobs } = await supabase
        .from("job")
        .select("user_id, company, business_type")
        .in("user_id", employerIds)

      // Get location names if available
      const { data: locations } = await supabase
        .from("locations")
        .select("employer_id, name")
        .in("employer_id", statuses.map((s) => s.id).filter(Boolean))

      const jobMap: Record<string, { company: string; business_type: string }> = {}
      ;(jobs || []).forEach((j) => { jobMap[j.user_id] = { company: j.company, business_type: j.business_type } })

      const merged: ContactedEmployer[] = statuses.map((s) => ({
        id: s.id,
        employer_id: s.employer_id,
        status: s.status,
        updated_at: s.updated_at,
        company: jobMap[s.employer_id]?.company || "Unknown Business",
        business_type: jobMap[s.employer_id]?.business_type || "",
        location_name: null,
      }))

      setContacted(merged)
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
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push("/matching/student")} className="h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold text-foreground">Employer Activity</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* INTRO */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Employers who have reached out or shown strong interest in hiring you.
          </p>
        </div>

        {contacted.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Bell className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                When an employer contacts you or marks you as a top candidate, it'll show up here.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/matching/student">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacted.map((item) => (
              <Card key={item.id} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* COMPANY INITIAL */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {item.company[0]?.toUpperCase() || "?"}
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
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
                      <div className="mt-2 flex items-center gap-2">
                        {item.status === "contacted" ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            📬 Reached out to you
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            ✅ Marked you as hired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TIP */}
                  {item.status === "contacted" && (
                    <div className="mt-3 rounded-lg bg-secondary/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        Check your <span className="font-medium text-foreground">phone and email</span> — they may have already reached out directly.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* FOOTER TIP */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4 mt-4 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Employers contact students directly by phone or email. Make sure your contact info in your{" "}
                <Link href="/student/profile" className="text-primary font-medium hover:underline">profile</Link>{" "}
                is up to date.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
