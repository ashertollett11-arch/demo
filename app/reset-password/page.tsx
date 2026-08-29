"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — getSession picks it up automatically
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidSession(true)
      }
      setChecking(false)
    }
    checkSession()

    // Listen for the PASSWORD_RECOVERY event from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password) { toast.error("Please enter a new password."); return }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return }
    if (password !== confirm) { toast.error("Passwords don't match."); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error("Failed to reset password", { description: error.message })
      return
    }
    setDone(true)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
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
                  <h1 className="text-2xl font-bold text-foreground">Password updated!</h1>
                  <p className="text-muted-foreground text-sm">
                    Your password has been reset successfully. You can now log in with your new password.
                  </p>
                  <Button className="w-full mt-4" onClick={() => router.push("/login")}>
                    Go to Login
                  </Button>
                </div>
              ) : !validSession ? (
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Link expired</h1>
                  <p className="text-muted-foreground text-sm">
                    This reset link has expired or is invalid. Please request a new one.
                  </p>
                  <Button className="w-full mt-4" asChild>
                    <Link href="/forgot-password">Request new link</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Set a new password</h1>
                    <p className="mt-2 text-muted-foreground text-sm">
                      Choose a strong password for your account.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <input
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReset() }}
                    />
                  </div>

                  <Button
                    className="mt-6 h-14 w-full rounded-xl text-lg font-semibold"
                    disabled={loading}
                    onClick={handleReset}
                  >
                    {loading ? "Updating..." : "Update Password"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}