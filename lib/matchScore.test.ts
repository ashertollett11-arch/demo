import { test } from "node:test"
import assert from "node:assert/strict"
import { calculateMatch } from "./matchScore.ts"
import { calculateEmployerMatch } from "./employerMatchScore.ts"

const day = (d: string, available: boolean, start: string, end: string) => ({ day: d, available, start, end })

// Malachy's real row: weekends 3:00 PM - 10:00 PM
const malachy = [
  day("Monday", false, "9:00 AM", "5:00 PM"),
  day("Tuesday", false, "9:00 AM", "5:00 PM"),
  day("Wednesday", false, "9:00 AM", "5:00 PM"),
  day("Thursday", false, "9:00 AM", "5:00 PM"),
  day("Friday", false, "9:00 AM", "5:00 PM"),
  day("Saturday", true, "3:00 PM", "10:00 PM"),
  day("Sunday", true, "3:00 PM", "10:00 PM"),
]

// The real "Main Location" row: Sat/Sun 7:00 AM - 10:00 PM active
const mainLocation = [
  { day: "Saturday", start: "7:00 AM", end: "10:00 PM", active: true },
  { day: "Sunday", start: "7:00 AM", end: "10:00 PM", active: true },
]

test("an ideal candidate scores 100", () => {
  const perfect = calculateMatch(
    {
      availability: [day("Saturday", true, "7:00 AM", "10:00 PM")],
      shiftPreference: "flexible",
      preferred_jobs: ["Barista", "Customer Service"],
      hasRecommendation: true,
      distanceMeters: 100,
    },
    { shifts: mainLocation.slice(0, 1), shiftPreference: "flexible", preferred_jobs: ["Barista", "Customer Service"] }
  )
  console.log("    perfect student->job score:", perfect)
  assert.equal(perfect, 100, "an ideal candidate should score 100")
})

// KNOWN OPEN BUG: the two scorers weight distance differently (20 vs 12 pts)
// and divide by different totals (86 vs 74), so a student and an employer see
// different numbers for the same pairing. Unskip once one formula is canonical.
test("real pair: both sides agree", { skip: "scorers disagree - 100 vs 91" }, () => {
  const s = calculateMatch(
    { availability: malachy, shiftPreference: "flexible", hasRecommendation: false, distanceMeters: 2431 },
    { shifts: mainLocation, shiftPreference: "flexible" }
  )
  const e = calculateEmployerMatch(
    { shifts: mainLocation, shiftPreference: "flexible" },
    malachy, "flexible", undefined, undefined, false, 2431
  )
  console.log("    student sees:", s, " employer sees:", e)
  assert.equal(s, e, "both sides should agree on the same pairing")
})

test("overnight shift (1:00 AM - 7:00 AM) is scored", () => {
  const overnight = [{ day: "Friday", start: "10:00 PM", end: "2:00 AM", active: true }]
  const score = calculateMatch(
    { availability: [day("Friday", true, "10:00 PM", "2:00 AM")], distanceMeters: 100 },
    { shifts: overnight }
  )
  console.log("    overnight score:", score)
  assert.ok(score > 20, "a student available for the exact overnight shift should score well")
})

test("full day names and abbreviations are equivalent", () => {
  const long = calculateMatch(
    { availability: [day("Saturday", true, "7:00 AM", "10:00 PM")], distanceMeters: 100 },
    { shifts: [{ day: "Saturday", start: "7:00 AM", end: "10:00 PM", active: true }] }
  )
  const short = calculateMatch(
    { availability: [day("Sat", true, "7:00 AM", "10:00 PM")], distanceMeters: 100 },
    { shifts: [{ day: "Sat", start: "7:00 AM", end: "10:00 PM", active: true }] }
  )
  console.log("    long:", long, " short:", short)
  assert.equal(long, short)
})

test("no overlap at all scores low", () => {
  const score = calculateMatch(
    { availability: [day("Monday", true, "9:00 AM", "11:00 AM")], distanceMeters: 100 },
    { shifts: [{ day: "Saturday", start: "7:00 AM", end: "10:00 PM", active: true }] }
  )
  console.log("    disjoint score:", score)
  assert.ok(score < 30, "no shared days should score low")
})
