"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error("Something went wrong", { description: error.message })
      return
    }
    setDone(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* BACK BUTTON */}
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card/80 backdrop-blur"
          onClick={() => router.push("/login")}
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
                <div className="text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We sent a password reset link to{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                    Click it to set a new password.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't get it? Check your spam folder or{" "}
                    <button onClick={() => setDone(false)} className="text-primary hover:underline">
                      try again
                    </button>.
                  </p>
                  <Button className="w-full mt-4" asChild>
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Forgot your password?</h1>
                    <p className="mt-2 text-muted-foreground text-sm">
                      Enter your email and we'll send you a link to reset it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReset() }}
                    />
                  </div>

                  <Button
                    className="mt-6 h-14 w-full rounded-xl text-lg font-semibold"
                    disabled={loading}
                    onClick={handleReset}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}