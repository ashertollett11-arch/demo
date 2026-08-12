import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    const user = data?.session?.user

    if (user) {
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (roleData?.role === "student") {
        return NextResponse.redirect(new URL("/student", url.origin))
      }
      if (roleData?.role === "employer") {
        return NextResponse.redirect(new URL("/employer", url.origin))
      }
    }
  }

  return NextResponse.redirect(new URL("/choose-role", url.origin))
}