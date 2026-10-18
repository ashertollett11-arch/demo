import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCallerId } from "@/lib/apiAuth"

export async function POST(request: Request) {
  // The acting user comes from the verified access token, never from the body:
  // anyone can post a userId, and employer user_ids are publicly readable.
  const userId = await getCallerId(request)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("student_user_id", userId)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
