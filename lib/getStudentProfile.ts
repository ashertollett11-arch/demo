import { students, StudentCard } from "@/lib/students"
import { calculateEmployerMatch } from "@/lib/employerMatchScore"

type EmployerData = {
  shifts: string[]
  shiftPreference: "morning" | "night" | "flexible"
}

/**
 * Get ONE student with REAL match score
 */
export function getStudentProfile(
  studentId: string,
  employer: EmployerData
): StudentCard | null {
  const student = students.find((s) => s.id === studentId)

  if (!student) return null

  const matchScore = calculateEmployerMatch(
    employer,
    student.availability,
    student.shiftPreference
  )

  return {
    ...student,
    matchScore,
  }
}