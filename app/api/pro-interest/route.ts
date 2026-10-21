import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCallerId } from "@/lib/apiAuth"

/**
 * Records that a free employer hit a Pro paywall.
 *
 * The count is what the daily sweep uses to decide someone is genuinely
 * interested rather than idly curious — one click shouldn't trigger a sales
 * email. It doubles as a warm-lead signal you can read straight from the
 * profiles table.
 */
export async function POST(request: Request) {
  try {
    const userId = await getCallerId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile } = await supabase
      .from("profiles").select("pro_paywall_hits, subscription_status").eq("id", userId).maybeSingle()

    // Already paying — nothing to record.
    if (profile?.subscription_status === "active") {
      return NextResponse.json({ ok: true, skipped: "already pro" })
    }

    const next = (profile?.pro_paywall_hits ?? 0) + 1
    await supabase
      .from("profiles")
      .update({ pro_paywall_hits: next, pro_paywall_last_at: new Date().toISOString() })
      .eq("id", userId)

    return NextResponse.json({ ok: true, hits: next })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
