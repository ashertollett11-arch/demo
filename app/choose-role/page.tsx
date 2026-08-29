"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Briefcase,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react"

export default function ChooseRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleUserRedirect = async (userId: string) => {
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
  
      if (!roleData?.role) return // no role yet, stay on this page
  
      if (roleData.role === "student") {
        const { data: profile } = await supabase
          .from("Students")
          .select("profile_complete")
          .eq("user_id", userId)
          .maybeSingle()
        router.replace(profile?.profile_complete ? "/student" : "/student/onboarding")
        return
      }
  
      if (roleData.role === "employer") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_complete")
          .eq("id", userId)
          .maybeSingle()
        router.replace(profile?.profile_complete ? "/employer" : "/employer/onboarding")
        return
      }
    }
  
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        handleUserRedirect(session.user.id)
        return
      }
      // No session yet — listen for it (handles mobile email confirmation links)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          handleUserRedirect(session.user.id)
        }
      })
      setTimeout(() => subscription.unsubscribe(), 10000)
    }
  
    checkAuth()
  }, [router])

  const selectRole = async (role: "student" | "employer") => {
    setLoading(true)
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Not logged in")
      setLoading(false)
      return
    }
  
    const { error } = await supabase
      .from("users")
      .upsert({ id: user.id, role }, { onConflict: "id" })  // ← upsert, not insert
  
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
  
    if (role === "student") {
      await supabase.from("Students").insert({ user_id: user.id })
      router.push("/student/onboarding")
    }
  
    if (role === "employer") {
      router.push("/employer/onboarding")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12">

        {/* TOP */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Welcome to SimplyApply
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose how you want to use the platform
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Whether you're looking for your first job or hiring great students,
            SimplyApply helps make the process fast and simple.
          </p>
        </div>

        {/* ROLE CARDS */}
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">

          {/* STUDENT */}
          <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/30">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>

              <h2 className="text-2xl font-bold text-foreground">I'm a Student</h2>

              <p className="mt-3 text-muted-foreground">
                Find flexible jobs near you, apply quickly, and build your
                experience while balancing school.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Personalized matches</p>
                    <p className="text-sm text-muted-foreground">Get matched to jobs based on your availability and goals.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Fast applications</p>
                    <p className="text-sm text-muted-foreground">Apply to jobs in just a few clicks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Build experience</p>
                    <p className="text-sm text-muted-foreground">Start building your resume while still in school.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => selectRole("student")}
                disabled={loading}
                className="mt-10 h-11 w-full text-base font-medium"
              >
                {loading ? "Loading..." : "Continue as Student"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* EMPLOYER */}
          <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/30">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>

              <h2 className="text-2xl font-bold text-foreground">I'm an Employer</h2>

              <p className="mt-3 text-muted-foreground">
                Connect with motivated students, manage applicants, and hire
                faster with smart matching tools.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Smart candidate matching</p>
                    <p className="text-sm text-muted-foreground">Discover students who fit your schedule and needs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Simple hiring workflow</p>
                    <p className="text-sm text-muted-foreground">Track applicants and manage interviews easily.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Reach local students</p>
                    <p className="text-sm text-muted-foreground">Hire students looking for flexible work opportunities.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => selectRole("employer")}
                disabled={loading}
                variant="outline"
                className="mt-10 h-11 w-full text-base font-medium"
              >
                {loading ? "Loading..." : "Continue as Employer"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* BOTTOM */}
     {/* BOTTOM */}
     <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace("/")
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Trusted by students and employers looking for better local hiring
          </div>
        </div>
      </div>
    </div>
  )
}