"use client"
import { toast } from "sonner"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

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
      if (window.location.pathname !== "/login") { setCheckingSession(false); return }
      if (roleData.role === "student") {
        router.replace(isMobileDevice() ? "/matching/student" : "/student")
      }
      if (roleData.role === "employer") {
        const redirect = searchParams.get("redirect")
        router.replace(redirect || "/employer")
      }
      setCheckingSession(false)
    }
    checkExistingSession()
    return () => { mounted = false }
  }, [])

  const signIn = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
        toast.error("Incorrect email or password", {
          description: "Check your details or create an account if you're new.",
        })
      } else if (!email || !password) {
        toast.error("Missing email or password", { description: "Please fill out both fields." })
      } else {
        toast.error("Login failed", { description: error.message })
      }
      return
    }
    const user = data.user
    if (!user) return
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    if (roleError || !roleData?.role) { router.push("/choose-role"); return }
    if (roleData.role === "student") {
      router.push(isMobileDevice() ? "/matching/student" : "/student")
    }
    if (roleData.role === "employer") {
      const redirect = searchParams.get("redirect")
      router.push(redirect || "/employer")
    }
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
      <div className="absolute left-6 top-6 z-20">
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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full flex justify-center">
          <Card className="w-full max-w-md border-border bg-card/95 shadow-2xl backdrop-blur">
            <CardContent className="p-10">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-2 text-muted-foreground">Log in to your SimplyApply account.</p>
              </div>
              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") signIn() }}
                />
              </div>
              {/* PASSWORD */}
              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") signIn() }}
                />
              </div>
              {/* LOGIN BUTTON */}
              <Button
                className="mt-6 h-14 w-full rounded-xl text-lg font-semibold"
                disabled={loading}
                onClick={signIn}
              >
                {loading ? "Logging in..." : "Log In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {/* SWITCH TO SIGNUP */}
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
              {/* NOT WORKING */}
              <div className="mt-6 border-t border-border pt-5">
                <details className="group">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                    <span className="text-primary underline underline-offset-2">Not working?</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      <span className="font-medium text-foreground">New here?</span> Hit "Sign up" above to get started — no existing account needed.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Just switched roles or deleted your account?</span> You'll need to create a new account. You can reuse the same email or a different one.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Still having trouble?</span> Email us at{" "}
                      <a href="mailto:simplyapplyapp@gmail.com" className="text-primary hover:underline">
                        simplyapplyapp@gmail.com
                      </a>{" "}
                      and we'll get you sorted.
                    </p>
                  </div>
                </details>
              </div>
              {/* FOOTER */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Secure authentication powered by Supabase
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}