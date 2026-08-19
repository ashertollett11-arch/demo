// lib/matchScore.ts

const dayMap: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
  Mon: "Mon", Tue: "Tue", Wed: "Wed",
  Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun",
}

// Parse "3:00 PM" → minutes since midnight
function parseTime(timeStr: string): number {
  if (!timeStr) return 0
  const [time, period] = timeStr.trim().split(" ")
  const [hourStr, minStr] = time.split(":")
  let hour = parseInt(hourStr)
  const min = parseInt(minStr) || 0
  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0
  return hour * 60 + min
}

// Returns overlapping minutes between two time ranges
function getOverlapMinutes(
  startA: string, endA: string,
  startB: string, endB: string
): number {
  const sA = parseTime(startA)
  const eA = parseTime(endA)
  const sB = parseTime(startB)
  const eB = parseTime(endB)
  const overlapStart = Math.max(sA, sB)
  const overlapEnd = Math.min(eA, eB)
  return Math.max(0, overlapEnd - overlapStart)
}

export function calculateMatch(
  student: {
    availability: {
      day: string
      available: boolean
      start?: string
      end?: string
    }[]
    shiftPreference?: "morning" | "night" | "flexible"
    preferred_jobs?: string[]
    hasRecommendation?: boolean
    distanceMeters?: number
  },
  job: {
    shifts: string[] | { day: string; start?: string; end?: string; active?: boolean }[]
    shiftPreference?: "morning" | "night" | "flexible"
    preferred_jobs?: string[]
  }
): number {
  if (!student?.availability?.length || !job?.shifts?.length) return 0

  // Normalize job shifts to objects with day/start/end
  const jobShifts = (job.shifts as any[]).map((s) => {
    if (typeof s === "string") {
      const cleanDay = s.split(" ")[0].trim()
      return { day: dayMap[cleanDay] || cleanDay, start: null, end: null }
    }
    return {
      day: dayMap[s.day?.trim()] || s.day?.trim(),
      start: s.start || null,
      end: s.end || null,
    }
  })

  // Normalize student availability
  const studentDays = student.availability
    .filter((a) => a.available)
    .map((a) => ({
      day: dayMap[a.day?.trim()] || a.day?.trim(),
      start: a.start || null,
      end: a.end || null,
    }))

  if (studentDays.length === 0) return 0

  // ── DAYS + HOURS SCORE (60 points max) ──
  // Day match = 6pts base, hour overlap = up to 4pts bonus per day
  // Only penalized if student doesn't have the day at all
  let dayHourScore = 0
  const totalJobDays = jobShifts.length || 1

  jobShifts.forEach((jobShift) => {
    const studentDay = studentDays.find((s) => s.day === jobShift.day)
    if (!studentDay) return // no match on this day — no points

    // Day matches — base points
    const dayPoints = 6

    // Hour overlap bonus — up to 4 extra points
    let hourBonus = 0
    if (studentDay.start && studentDay.end && jobShift.start && jobShift.end) {
      const employerMinutes = parseTime(jobShift.end) - parseTime(jobShift.start)
      const overlap = getOverlapMinutes(
        studentDay.start, studentDay.end,
        jobShift.start, jobShift.end
      )
      const overlapRatio = employerMinutes > 0 ? overlap / employerMinutes : 0
      hourBonus = overlapRatio * 4
    } else {
      hourBonus = 4 // no time data — assume full overlap
    }

    dayHourScore += dayPoints + hourBonus
  })

  // Scale to 60 points max based on how many job days are covered
  dayHourScore = Math.min(60, (dayHourScore / (totalJobDays * 10)) * 60)

  // ── DISTANCE SCORE (up to 12 points) ──
  let distanceScore = 0
  if (student.distanceMeters !== undefined && student.distanceMeters !== null) {
    const miles = student.distanceMeters / 1609.34
    if (miles <= 5) distanceScore = 12
    else if (miles <= 10) distanceScore = 8
    else if (miles <= 15) distanceScore = 5
  }

  // ── SHIFT PREFERENCE (up to 8 points) ──
  let shiftScore = 0
  if (student.shiftPreference && job.shiftPreference) {
    if (student.shiftPreference === job.shiftPreference) {
      shiftScore = 8
    } else if (student.shiftPreference === "flexible" || job.shiftPreference === "flexible") {
      shiftScore = 4
    }
  }

  // ── JOB ROLE MATCH (up to 8 points) ──
  let jobRoleScore = 0
  if (student.preferred_jobs?.length && job.preferred_jobs?.length) {
    const matches = student.preferred_jobs.filter((r) =>
      job.preferred_jobs!.includes(r)
    ).length
    jobRoleScore = Math.min(8, matches * 4)
  }

  // ── RECOMMENDATION BOOST (6 points) ──
  const recScore = student.hasRecommendation ? 6 : 0

  // ── TOTAL ──
  // Max possible: 60 + 12 + 8 + 8 + 6 = 94 — scale to 100
  const total = dayHourScore + distanceScore + shiftScore + jobRoleScore + recScore
  const scaled = Math.round((total / 94) * 100)

  return Math.min(100, Math.max(0, scaled))
}