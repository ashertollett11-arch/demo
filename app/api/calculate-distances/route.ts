import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

async function getDistance(
  studentAddress: string,
  studentZip: string,
  locationAddress: string,
  locationZip: string
): Promise<{ meters: number; distanceText: string; durationText: string } | null> {
  try {
    const origin = encodeURIComponent(`${studentAddress} ${studentZip}`)
    const destination = encodeURIComponent(`${locationAddress} ${locationZip}`)
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    const element = data?.rows?.[0]?.elements?.[0]
    if (!element || element.status !== "OK") return null

    return {
      meters: element.distance.value,
      distanceText: element.distance.text,
      durationText: element.duration.text,
    }
  } catch {
    return null
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentUserId, locationId } = body

    if (!studentUserId && !locationId) {
      return NextResponse.json({ error: "Provide studentUserId or locationId" }, { status: 400 })
    }

    let pairs: {
      locationId: string
      locationAddress: string
      locationZip: string
      studentUserId: string
      studentAddress: string
      studentZip: string
    }[] = []

    if (studentUserId) {
      // Delete existing distances for this student so address changes are recalculated fresh
      await supabaseAdmin
        .from("employer_student_distances")
        .delete()
        .eq("student_user_id", studentUserId)

      const { data: student } = await supabaseAdmin
        .from("Students")
        .select("user_id, location, zip_code")
        .eq("user_id", studentUserId)
        .maybeSingle()

      if (!student?.location || !student?.zip_code) {
        return NextResponse.json({ error: "Student has no address" }, { status: 400 })
      }

      const { data: locations } = await supabaseAdmin
        .from("locations")
        .select("id, address, zip_code")

      if (!locations?.length) {
        return NextResponse.json({ success: true, calculated: 0 })
      }

      pairs = locations
        .filter(loc => loc.address && loc.zip_code)
        .map(loc => ({
          locationId: loc.id,
          locationAddress: loc.address,
          locationZip: loc.zip_code,
          studentUserId: student.user_id,
          studentAddress: student.location,
          studentZip: student.zip_code,
        }))
    }

    if (locationId) {
      // Delete existing distances for this location so address changes are recalculated fresh
      await supabaseAdmin
        .from("employer_student_distances")
        .delete()
        .eq("employer_location_id", locationId)

      const { data: location } = await supabaseAdmin
        .from("locations")
        .select("id, address, zip_code")
        .eq("id", locationId)
        .maybeSingle()

      if (!location?.address || !location?.zip_code) {
        return NextResponse.json({ error: "Location has no address" }, { status: 400 })
      }

      const { data: students } = await supabaseAdmin
        .from("Students")
        .select("user_id, location, zip_code")
        .eq("profile_complete", true)

      if (!students?.length) {
        return NextResponse.json({ success: true, calculated: 0 })
      }

      pairs = students
        .filter(s => s.location && s.zip_code)
        .map(s => ({
          locationId: location.id,
          locationAddress: location.address,
          locationZip: location.zip_code,
          studentUserId: s.user_id,
          studentAddress: s.location,
          studentZip: s.zip_code,
        }))
    }

    let calculated = 0
    const upsertRows = []

    for (const pair of pairs) {
      const result = await getDistance(
        pair.studentAddress,
        pair.studentZip,
        pair.locationAddress,
        pair.locationZip
      )

      if (result) {
        upsertRows.push({
          employer_location_id: pair.locationId,
          student_user_id: pair.studentUserId,
          distance_meters: result.meters,
          distance_text: result.distanceText,
          duration_text: result.durationText,
          calculated_at: new Date().toISOString(),
        })
        calculated++
      }

      await sleep(50)
    }

    if (upsertRows.length > 0) {
      await supabaseAdmin
        .from("employer_student_distances")
        .upsert(upsertRows, { onConflict: "employer_location_id,student_user_id" })
    }

    return NextResponse.json({ success: true, calculated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}