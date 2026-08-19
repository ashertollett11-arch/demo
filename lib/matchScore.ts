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

  if (studentDays.size === 0) return 0

  // ── DAYS + HOURS SCORE (60 points max) ──
  // Score = total overlapping hours / employer's total shift hours
  // Answers: "what fraction of the employer's needs can this student cover?"

  let employerTotalMinutes = 0
  let overlappingMinutes = 0

  jobShifts.forEach((jobShift) => {
    // Employer's total minutes for this shift day
    const employerShiftMinutes = jobShift.start && jobShift.end
      ? parseTime(jobShift.end) - parseTime(jobShift.start)
      : 480 // assume 8hr day if no times

    employerTotalMinutes += employerShiftMinutes

    // Find matching student day
    const studentDay = studentDays.find((s) => s.day === jobShift.day)
    if (!studentDay) return // student not available this day — 0 overlap

    if (studentDay.start && studentDay.end && jobShift.start && jobShift.end) {
      const overlap = getOverlapMinutes(
        studentDay.start, studentDay.end,
        jobShift.start, jobShift.end
      )
      overlappingMinutes += overlap
    } else {
      // No time data on one side — count as full day match
      overlappingMinutes += employerShiftMinutes
    }
  })

  const dayHourScore = employerTotalMinutes > 0
    ? (overlappingMinutes / employerTotalMinutes) * 60
    : 0

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
  if (
    student.shiftPreference &&
    job.shiftPreference &&
    student.shiftPreference === job.shiftPreference
  ) {
    shiftScore = 8
  } else if (
    student.shiftPreference === "flexible" ||
    job.shiftPreference === "flexible"
  ) {
    shiftScore = 4
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