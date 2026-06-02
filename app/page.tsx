"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  useEffect(() => {
    const routeUser = async () => {
      if (typeof window === "undefined") return

      const isMobile =
        window.matchMedia("(max-width: 768px)").matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If not logged in, use normal device routing
      if (!session?.user) {
        window.location.replace(isMobile ? "/mobile" : "/desktop")
        return
      }

      // Check role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()

      const isStudent = userData?.role === "student"

      // ONLY send to mobile page if mobile + student
      if (isMobile && isStudent) {
        window.location.replace("/mobile")
      } else {
        window.location.replace("/desktop")
      }
    }

    routeUser()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0614]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />

        <p className="text-purple-300 text-sm">
          Loading SimplyApply...
        </p>
      </div>
    </div>
  )
}