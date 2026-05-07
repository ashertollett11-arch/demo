// lib/students.ts
import { supabase } from "./supabase"

export type AvailabilityDay = {
  day: string
  start: string
  end: string
  available: boolean
  hours: string
}

export type ShiftPreference = "morning" | "night" | "flexible"

export type Student = {
  id: string
  name: string
  age: number
  gpa: number
  location: string
  email: string
  school: string
  phone: string
  interests: string[]
  preferredJobs: string[]
  availability: AvailabilityDay[]
  shiftPreference: ShiftPreference
}

export type StudentCard = Student & {
  verified: boolean
  status: "new" | "contacted" | "hired"
  distance: string
  matchScore: number
}

/**
 * Safely gets the logged-in user (FIXES your error)
 */
async function getCurrentUser() {
  // 1. Try session first (more reliable after OAuth redirect)
  const { data: sessionData } = await supabase.auth.getSession()
  const sessionUser = sessionData?.session?.user

  if (sessionUser) return sessionUser

  // 2. Fallback to getUser
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) return null

  return data.user
}

/**
 * CREATE STUDENT PROFILE (FIXED)
 */
export async function createStudent(data: any) {
    const { data: result, error } = await supabase
      .from("Students")
      .insert(data)
      .select()
  
    if (error) {
      console.log("DB ERROR:", error)
      return { error }
    }
  
    return { data: result }
  }
/**
 * Map DB → UI
 */
export function mapDbStudent(s: any) {
  return {
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    age: s.age,
    gpa: s.gpa,
    location: s.location,
    email: s.email,
    school: s.school,
    phone: s.phone,
    interests: s.interests,
    preferredJobs: s.preferred_jobs,
    availability: s.availability,
    shiftPreference: s.shift_preference,

    // 🔥 THESE ARE WHAT YOU WERE MISSING:
    status: s.status,
    is_gpa_verified: s.is_gpa_verified,
    gpa_verification_status: s.gpa_verification_status,
    gpa_proof_url: s.gpa_proof_url
  }
}

/**
 * LocalStorage fallback (unchanged)
 */
export function getStudentFromStorage(): Student | null {
  if (typeof window === "undefined") return null

  const hasProfile = localStorage.getItem("hasProfile")
  if (!hasProfile) return null

  return {
    id: localStorage.getItem("studentId") || "",

    name: localStorage.getItem("name") || "",
    age: Number(localStorage.getItem("age") || 0),
    gpa: Number(localStorage.getItem("gpa") || 0),
    location: localStorage.getItem("location") || "",
    email: localStorage.getItem("email") || "",
    school: localStorage.getItem("school") || "",
    phone: localStorage.getItem("phone") || "",

    interests: JSON.parse(localStorage.getItem("interests") || "[]"),
    preferredJobs: JSON.parse(localStorage.getItem("preferredJobs") || "[]"),
    availability: JSON.parse(localStorage.getItem("availability") || "[]"),

    shiftPreference:
      (localStorage.getItem("shiftPreference") as ShiftPreference) ||
      "flexible",
  }
}