"use client"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [done, setDone] = useState(false)

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 768px)").matches
  }

  useEffect(() => {
    let mounted = true
    const checkExistingSession = async () => {
      setCheckingSession(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (!session?.user) { setCheckingSession(false); return }
      const { data: roleData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()
      if (!mounted) return
      if (error || !roleData?.role) { router.replace("/choose-role"); setCheckingSession(false); return }
      if (roleData.role === "student") {
        router.replace(isMobileDevice() ? "/matching/student" : "/student")
      }
      if (roleData.role === "employer") {
        router.replace("/employer")
      }
      setCheckingSession(false)
    }
    checkExistingSession()
    return () => { mounted = false }
  }, [])
  const signUp = async () => {
    if (!email || !password) {
      toast.error("Missing email or password", { description: "Please fill out both fields." })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("already registered") || message.includes("already exists")) {
        toast.error("Account already exists", {
          description: "An account with this email already exists. Try logging in instead.",
          action: { label: "Log in", onClick: () => router.push("/login") },
        })
      } else if (message.includes("password") && message.includes("short")) {
        toast.error("Password too short", { description: "Password must be at least 6 characters." })
      } else {
        toast.error("Signup failed", { description: error.message })
      }
      return
    }
    setDone(true)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* BACK BUTTON */}
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
                <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card/80 backdrop-blur"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-12">
        <div className="w-full flex justify-center">
          <Card className="w-full max-w-md border-border bg-card/95 shadow-2xl backdrop-blur">
            <CardContent className="p-6 sm:p-10">
              {done ? (
                /* SUCCESS STATE */
                <div className="text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We sent a confirmation link to{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                    Click it to activate your account and get started.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't get it? Check your spam folder or{" "}
                    <button onClick={() => setDone(false)} className="text-primary hover:underline">
                      try again
                    </button>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-foreground">Create your account</h1>
                    <p className="mt-2 text-muted-foreground">
                      Join SimplyApply — free for students, free to start for employers.
                    </p>
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") signUp() }}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="mt-5 space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <input
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") signUp() }}
                    />
                  </div>

                  {/* SIGNUP BUTTON */}
                  <Button
                    className="mt-6 h-14 w-full rounded-xl text-lg font-semibold"
                    disabled={loading}
                    onClick={signUp}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {/* SWITCH TO LOGIN */}
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>

                  {/* FOOTER */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Secure authentication powered by Supabase
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}