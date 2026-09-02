// lib/matchScore.ts
const dayMap: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
  Mon: "Mon", Tue: "Tue", Wed: "Wed",
  Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun",
}

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

  const studentDays = student.availability
    .filter((a) => a.available)
    .map((a) => ({
      day: dayMap[a.day?.trim()] || a.day?.trim(),
      start: a.start || null,
      end: a.end || null,
    }))

  if (studentDays.length === 0) return 0

  // ── DAYS + HOURS SCORE (60 points max) ──
  let dayHourScore = 0

  // Total student available hours across all available days
  let totalStudentMinutes = 0
  studentDays.forEach((s) => {
    if (s.start && s.end) {
      totalStudentMinutes += Math.max(0, parseTime(s.end) - parseTime(s.start))
    } else {
      totalStudentMinutes += 480 // assume 8hr day if no time data
    }
  })

  // Total overlapping minutes between student and employer shifts
  let matchedMinutes = 0
  jobShifts.forEach((jobShift) => {
    const studentDay = studentDays.find((s) => s.day === jobShift.day)
    if (!studentDay) return
    if (studentDay.start && studentDay.end && jobShift.start && jobShift.end) {
      matchedMinutes += getOverlapMinutes(
        studentDay.start, studentDay.end,
        jobShift.start, jobShift.end
      )
    } else {
      matchedMinutes += 480 // assume 8hr overlap if no time data
    }
  })

  const hourCoverageRatio = totalStudentMinutes > 0 ? matchedMinutes / totalStudentMinutes : 0
  const curvedRatio = Math.sqrt(hourCoverageRatio)
  dayHourScore = Math.min(60, curvedRatio * 60)
  // ── DISTANCE SCORE (up to 20 points) ──
  let distanceScore = 0
  if (student.distanceMeters !== undefined && student.distanceMeters !== null) {
    const miles = student.distanceMeters / 1609.34
    if (miles <= 2) distanceScore = 20
    else if (miles <= 5) distanceScore = 16
    else if (miles <= 10) distanceScore = 10
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
  // Max possible: 60 + 20 + 8 + 8 + 6 = 102 — scale to 100
  const total = dayHourScore + distanceScore + shiftScore + jobRoleScore + recScore
  const scaled = Math.round((total / 86) * 100)
  return Math.min(100, Math.max(0, scaled))
}