"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

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
      alert(error.message)
      return
    }
  
    const user = data.user
  
    if (!user) {
      alert("Check your email to confirm account")
      return
    }
  
    // ⚠️ IMPORTANT: we DON'T know role yet here
    // so we redirect to a role selection page
  
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
      alert(error.message)
      return
    }
  
    const user = data.user
  
    if (!user) return
  
    // STEP 1: get role from your users table
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
  
    if (roleError || !roleData) {
      alert("No role found. Please contact support.")
      return
    }
  
    // STEP 2: redirect based on role
    if (roleData.role === "student") {
      router.push("/student")
    }
  
    if (roleData.role === "employer") {
      router.push("/employer")
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">

        <h1 className="text-xl font-bold text-center">
          Login
        </h1>

        {/* EMAIL */}
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN BUTTON */}
        <Button
          className="w-full"
          disabled={loading}
          onClick={signIn}
        >
          Login
        </Button>

        {/* SIGNUP BUTTON */}
        <Button
          className="w-full"
          variant="outline"
          disabled={loading}
          onClick={signUp}
        >
          Create Account
        </Button>

      </div>
    </div>
  )
}