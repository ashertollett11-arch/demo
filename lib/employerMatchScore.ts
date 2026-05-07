// lib/employerMatchScore.ts

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

export function calculateEmployerMatch(
  
  
  
  job: {
    shifts: string[]
    shiftPreference?: "morning" | "night" | "flexible"
    preferred_jobs?: string[]
  },
  availability: {
    day: string
    available: boolean
    start: string
    end: string
  }[],
  studentShiftPreference?: "morning" | "night" | "flexible",
  studentGpa?: number,
  studentPreferredJobs?: string[] // ✅ FIXED LOCATION
): number {
  if (!availability?.length || !job?.shifts?.length) return 22

  const jobDays = new Set(
    job.shifts.map((s) => {
      const cleanDay = s.split(" ")[0].trim()
      return dayMap[cleanDay] || cleanDay
    })
  )

  const studentDays = new Set(
    availability
      .filter((a) => a.available)
      .map((a) => dayMap[a.day.trim()] || a.day.trim())
  )

  let matchedDays = 0

  studentDays.forEach((day) => {
    if (jobDays.has(day)) matchedDays++
  })

  // 🎯 base score (MUST be declared before using it)
  let score =
    jobDays.size > 0 ? (matchedDays / jobDays.size) * 100 : 0

 // ===== JOB ROLE MATCH BONUS =====
if (job.preferred_jobs?.length && studentPreferredJobs?.length) {
  const normalizedStudentJobs = studentPreferredJobs.map((j) =>
    j.trim().toLowerCase()
  )

  const matches = job.preferred_jobs.filter((jobRole) =>
    normalizedStudentJobs.includes(jobRole.trim().toLowerCase())
  )

  score += matches.length * 3
}

  // 🎓 GPA BOOST
  if (studentGpa && studentGpa > 3) {
    const extra = studentGpa - 3
    const increments = Math.floor(extra / 0.1)
    score += increments * 1.5
  }

  // ⚡ shift preference boost
  if (
    studentShiftPreference &&
    job.shiftPreference &&
    studentShiftPreference === job.shiftPreference
  ) {
    score += 8
  }

  // clamp + scale
  score = Math.min(100, Math.max(0, score))
  score = 22 + (score / 100) * 78
  score = Math.min(100, Math.max(22, Math.round(score)))

  return score
}