import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useSubscription() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser()

      const userId = userData?.user?.id

      if (!userId) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("job")
        .select("subscription_status")
        .eq("user_id", userId)
        .single()

      setStatus(data?.subscription_status || null)
      setLoading(false)
    }

    loadSubscription()
  }, [])

  return { status, loading }
}