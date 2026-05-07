"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function ChooseRolePage() {
  const router = useRouter()

  const selectRole = async (role: "student" | "employer") => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("Not logged in")
      return
    }

    // 1. Save role in users table
    const { error } = await supabase.from("users").insert({
      id: user.id,
      role
    })

    if (error) {
      alert(error.message)
      return
    }

    // 2. Create profile in correct table
    if (role === "student") {
      await supabase.from("Students").insert({
        user_id: user.id
      })

      router.push("/student/profile")
    }

    if (role === "employer") {
      await supabase.from("employers").insert({
        user_id: user.id
      })

      router.push("/employer/profile")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-4">
      <Button onClick={() => selectRole("student")}>
        I’m a Student
      </Button>

      <Button onClick={() => selectRole("employer")}>
        I’m an Employer
      </Button>
    </div>
  )
}