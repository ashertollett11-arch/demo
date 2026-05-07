
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
console.log("RAW BODY:", body)
console.log("JOB SHIFTS:", job?.shifts)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// 🔥 normalize days so everything matches
const normalize = (d: string) =>
  (d || "")
    .toString()
    .trim()
    .toLowerCase()
    .slice(0, 3)

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("🔥 EDGE FUNCTION HIT")

    const body = await req.json()

    const job = body?.job ?? {}
    const availability = body?.availability ?? []
    const gpa = Number(body?.gpa ?? 0)

    const shifts = Array.isArray(job.shifts)
      ? job.shifts
      : []

    const activeJobDays = shifts
      .filter((s) => s?.active)
      .map((s) => normalize(s.day))
      .filter(Boolean)

    const studentDays = availability
      .filter((a) => a?.available)
      .map((a) => normalize(a.day))
      .filter(Boolean)

    console.log("📅 JOB DAYS:", activeJobDays)
    console.log("🎓 STUDENT DAYS:", studentDays)

    if (!job?.shifts?.length) {
      return new Response(JSON.stringify({ score: 0 }))
    }
    }

    let matchedDays = 0

    activeJobDays.forEach((day) => {
      if (studentDays.includes(day)) {
        matchedDays++
      }
    })

    const percentage =
      (matchedDays / activeJobDays.length) * 100

    let finalScore = Math.round(percentage)
    console.log("JOB SHIFTS:", job.shifts)
    console.log("AVAILABILITY:", availability)
    // GPA bonus
    if (gpa >= 3.8) finalScore += 10
    else if (gpa >= 3.5) finalScore += 6
    else if (gpa >= 3.0) finalScore += 3

    finalScore = Math.min(100, finalScore)

    return new Response(
      JSON.stringify({
        score: finalScore,
        matchedDays,
        employerDays: activeJobDays.length,
      }),
      { headers: corsHeaders }
    )
  } catch (err) {
    console.error("❌ ERROR:", err)

    return new Response(
      JSON.stringify({
        error: String(err),
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})