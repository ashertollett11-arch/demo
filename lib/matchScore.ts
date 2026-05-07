// lib/matchScore.ts

const dayMap: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",

  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
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
    preferred_jobs?: string[]   // 👈 add this

  },

  job: {
    shifts: string[]
    shiftPreference?: "morning" | "night" | "flexible"
    preferred_jobs?: string[]   // 👈 add this

  }
): number {
  // fallback minimum score
  if (!student?.availability?.length || !job?.shifts?.length) {
    return 22
  }

  // normalize employer job days
  const jobDays = new Set(
    job.shifts.map((s) => {
      const cleanDay = s.split(" ")[0].trim()
      return dayMap[cleanDay] || cleanDay
    })
  )

  // normalize student available days
  const studentDays = new Set(
    student.availability
      .filter((a) => a.available)
      .map((a) => {
        const cleanDay = a.day.trim()
        return dayMap[cleanDay] || cleanDay
      })
  )

  // if student has no available days
  if (studentDays.size === 0) {
    return 22
  }
  // ===== JOB ROLE MATCH BONUS =====
  if (student.preferred_jobs?.length && job.preferred_jobs?.length) {
    const matches = student.preferred_jobs.filter((jobRole) =>
      job.preferred_jobs!.includes(jobRole)
    )

    score += matches.length // +1 per match
  }
  // count overlaps
  let matchedDays = 0

  studentDays.forEach((day) => {
    if (jobDays.has(day)) {
      matchedDays++
    }
  })

  // IMPORTANT:
  // divide by TOTAL STUDENT AVAILABLE DAYS
  let score = (matchedDays / studentDays.size) * 100

  // shift preference bonus
  if (
    student.shiftPreference &&
    job.shiftPreference &&
    student.shiftPreference === job.shiftPreference
  ) {
    score += 8
  }

  // clamp raw score
  score = Math.min(100, Math.max(0, score))

  // soft scaling
  score = 22 + (score / 100) * 78

  // final rounding + clamp
  score = Math.min(100, Math.max(22, Math.round(score)))

  return score
}