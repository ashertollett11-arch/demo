"use client"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // CREATE ACCOUNT
  const signUp = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (error) {
      const message = error.message.toLowerCase()
    
      if (
        message.includes("user already registered") ||
        message.includes("already registered")
      ) {
        toast.error("Account already exists", {
          description: "Try logging in instead.",
        })
      } else if (
        message.includes("anonymous") ||
        !email ||
        !password
      ) {
        toast.error("Missing email or password", {
          description: "Please fill out both fields.",
        })
      } else {
        toast.error("Signup failed", {
          description: error.message,
        })
      }
    
      return
    }
    const user = data.user

   
    router.push("/choose-role")
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
      const message = error.message.toLowerCase()
    
      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
      ) {
        toast.error("Incorrect email or password", {
          description: "Please try again.",
        })
      } else if (!email || !password) {
        toast.error("Missing email or password", {
          description: "Please fill out both fields.",
        })
      } else {
        toast.error("Login failed", {
          description: error.message,
        })
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

      if (roleError || !roleData || !roleData.role) {
        router.push("/choose-role")
        return
      }

    if (roleData.role === "student") {
      router.push("/student")
    }

    if (roleData.role === "employer") {
      router.push("/employer")
    }
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

      {/* CENTER WRAPPER (FIXED: no stretching) */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">

        {/* FIX: prevent full-width stretching */}
        <div className="w-full flex justify-center">

          <Card className="w-full max-w-md border-border bg-card/95 shadow-2xl backdrop-blur">
            <CardContent className="p-10">

              {/* MOBILE HEADER */}
              <div className="mb-8 text-center lg:hidden">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  SimplyApply
                </div>

                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Login or create your account to continue.
                </p>
              </div>

              {/* DESKTOP HEADER */}
              <div className="mb-8 hidden lg:block text-center">
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Login or create your account to continue.
                </p>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>

                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>

                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* LOGIN BUTTON */}
              <Button
                className="mt-6 h-14 w-full rounded-xl text-lg font-semibold"
                disabled={loading}
                onClick={signIn}
              >
                Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* SIGNUP BUTTON */}
              <Button
                className="mt-3 h-14 w-full rounded-xl text-lg font-semibold"
                variant="outline"
                disabled={loading}
                onClick={signUp}
              >
                Create Account
              </Button>

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