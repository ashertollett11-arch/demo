import { supabase } from "@/lib/supabase"

/**
 * fetch() for our own API routes, with the caller's Supabase access token
 * attached. Routes derive the acting user from this token.
 */
export async function authedFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
