import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Verifies the caller's Supabase access token and returns their user id.
 *
 * Routes must act on this id, never on a userId taken from the request body —
 * a body value is attacker-controlled, and employer user_ids are readable from
 * the public `job` table.
 */
export async function getCallerId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization")
  if (!header?.toLowerCase().startsWith("bearer ")) return null

  const token = header.slice(7).trim()
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null

  return data.user.id
}

/** Same verification, but also returns the caller's email. */
export async function getCaller(
  req: Request
): Promise<{ id: string; email: string | null } | null> {
  const header = req.headers.get("authorization")
  if (!header?.toLowerCase().startsWith("bearer ")) return null

  const token = header.slice(7).trim()
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null

  return { id: data.user.id, email: data.user.email ?? null }
}
