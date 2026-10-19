import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { activeLocations } from "@/lib/plan"

/**
 * Location ids that should be visible to students.
 *
 * A Free employer keeps every location they ever created, but only their
 * oldest one stays live — the rest are paused and must not appear on the job
 * board. Students cannot work this out themselves: `profiles.subscription_status`
 * is behind RLS, so the join has to happen server-side with the service role.
 */
export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const [{ data: locations }, { data: jobs }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("locations").select("id, employer_id, created_at"),
      supabaseAdmin.from("job").select("id, user_id"),
      supabaseAdmin.from("profiles").select("id, subscription_status"),
    ])

    if (!locations) return NextResponse.json({ activeIds: null })

    const employerUserId = new Map((jobs ?? []).map((j: any) => [String(j.id), String(j.user_id)]))
    const planByUser = new Map((profiles ?? []).map((p: any) => [String(p.id), p.subscription_status]))

    // group by employer, then keep each employer's active set
    const byEmployer = new Map<string, any[]>()
    for (const loc of locations) {
      const key = String(loc.employer_id)
      if (!byEmployer.has(key)) byEmployer.set(key, [])
      byEmployer.get(key)!.push(loc)
    }

    const activeIds: string[] = []
    for (const [employerId, locs] of byEmployer) {
      const plan = planByUser.get(employerUserId.get(employerId) ?? "") ?? null
      for (const loc of activeLocations(locs, plan)) activeIds.push(String(loc.id))
    }

    return NextResponse.json({ activeIds })
  } catch (err: any) {
    // Fail open: a board that silently shows nothing is worse for students
    // than briefly showing a paused location.
    console.error("ACTIVE LOCATIONS ERROR:", err.message)
    return NextResponse.json({ activeIds: null })
  }
}
