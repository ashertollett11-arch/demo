import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { origins, destinations } = await req.json()

    if (!origins || !destinations) {
      return NextResponse.json({ error: "Missing origins or destinations" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=imperial&key=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== "OK") {
      return NextResponse.json({ error: data.status }, { status: 400 })
    }

    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== "OK") {
      return NextResponse.json({ distance: "Unknown" })
    }

    return NextResponse.json({
      distance: element.distance.text,   // e.g. "4.2 mi"
      duration: element.duration.text,   // e.g. "8 mins"
    })
  } catch (err: any) {
    console.error("DISTANCE ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}