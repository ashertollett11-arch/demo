"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { ChevronLeft, ArrowRight, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 768px)").matches
  }

  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session?.user) {
        setCheckingSession(false)
        return
      }

      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (!mounted) return

      if (!roleData?.role) {
        setCheckingSession(false)
        return
      }

      if (window.location.pathname !== "/login") {
        setCheckingSession(false)
        return
      }

      if (roleData.role === "student") {
        const dest = isMobileDevice() ? "/student/mobile" : "/student"
        router.replace(dest)
      }

      if (roleData.role === "employer") {
        router.replace("/matching/employer")
      }

      setCheckingSession(false)
    }

    checkExistingSession()

    return () => {
      mounted = false
    }
  }, [])

  // SIGN UP
  const signUp = async () => {
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
      toast.error("Signup failed", { description: error.message })
      return
    }

    toast.success("Account created!", {
      description: "Check your email to confirm your account.",
      duration: 8000,
    })
  }

  // LOGIN
  const signIn = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (error) {
      toast.error("Login failed", { description: error.message })
      return
    }

    const user = data.user
    if (!user) return

    const { data: roleData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!roleData?.role) {
      router.push("/choose-role")
      return
    }

    if (roleData.role === "student") {
        router.replace("/student/mobile")
        return
      }

    if (roleData.role === "employer") {
      router.push("/matching/employer")
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0614] text-white relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* BACK BUTTON */}
      <div className="absolute left-6 top-6 z-20">
        <button
          onClick={() => router.push("/mobile")}
          className="flex items-center gap-2 rounded-xl border border-purple-900/40 bg-[#140a25] px-4 py-2 text-sm text-purple-300 hover:bg-[#1b1033]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* CENTER */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">

        <div className="w-full max-w-md">

          {/* CARD */}
          <div className="rounded-2xl border border-purple-900/40 bg-[#140a25] p-8 shadow-[0_0_35px_rgba(168,85,247,0.10)]">

            {/* HEADER */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-purple-300">
                Login or create your account to continue
              </p>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm text-purple-300">Email</label>
              <input
                className="w-full rounded-xl border border-purple-900/40 bg-[#0b0614] px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="mt-5 space-y-2">
              <label className="text-sm text-purple-300">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-purple-900/40 bg-[#0b0614] px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* LOGIN */}
            <button
              onClick={signIn}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:bg-purple-500 disabled:opacity-50"
            >
              Login
              <ArrowRight className="inline ml-2 h-4 w-4" />
            </button>

            {/* SIGN UP */}
            <button
              onClick={signUp}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-purple-800 py-3 font-semibold text-purple-300 hover:bg-[#1b1033]"
            >
              Create Account
            </button>

            {/* FOOTER */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              Secure authentication powered by Supabase
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}