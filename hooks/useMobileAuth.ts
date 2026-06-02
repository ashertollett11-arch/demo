"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function useMobileAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.replace("/login/mobile")
        return
      }

      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (!roleData || roleData.role !== "student") {
        router.replace("/login/mobile")
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  return { loading, user }
}