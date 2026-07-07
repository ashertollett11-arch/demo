"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  useEffect(() => {
    const routeUser = async () => {
      if (typeof window === "undefined") return

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.replace("/desktop")
        return
      }

      window.location.replace("/desktop")
    }

    routeUser()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading SimplyApply...</p>
      </div>
    </div>
  )
}