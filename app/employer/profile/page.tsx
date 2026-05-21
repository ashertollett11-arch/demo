"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Briefcase, Calendar, ChevronLeft, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
export default function EmployerProfilePage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
  
      if (!user) {
        router.replace("/login")
        return
      }
  
      setUserId(user.id)
    }
  
    checkAuth()
  }, [router])
  useEffect(() => {
    const missing = window.location.search.includes("missing=true")
  
    if (missing) {
      setTimeout(() => {
        toast.error("Please complete your profile")
      }, 300)
    }
  }, [])



  // ===== PROFILE STATE =====
  const [companyName, setCompanyName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")
  const [businessType, setBusinessType] = useState("")  
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState("")
  const [details, setDetails] = useState("")
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  // ===== toast errors
  const companyRef = useRef<HTMLInputElement>(null)
const ownerRef = useRef<HTMLInputElement>(null)
const emailRef = useRef<HTMLInputElement>(null)
const phoneRef = useRef<HTMLInputElement>(null)
const detailsRef = useRef<HTMLTextAreaElement>(null)
  
  // ===== JOB PAY INFO =====
const [hourlyPay, setHourlyPay] = useState("")
const [hasTips, setHasTips] = useState(false)
  // ===== SHIFT PREFERENCE =====
  const [shiftPreference, setShiftPreference] = useState<
    "morning" | "night" | "flexible"
  >("flexible")

  type FieldRef = React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>

  const scrollToField = (ref: FieldRef) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  
    ref.current?.focus?.()
  }
  const markError = (key: string, ref: FieldRef) => {
    setErrors((prev) => ({ ...prev, [key]: true }))
  
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  
    ref.current?.focus?.()
  }
  // ===== AVAILABLE SHIFTS (REBRANDED AVAILABILITY) =====
  const [availableShifts, setAvailableShifts] = useState([
    { day: "Monday", start: "9:00 AM", end: "5:00 PM", active: true },
    { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", active: true },
    { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", active: true },
    { day: "Thursday", start: "9:00 AM", end: "5:00 PM", active: true },
    { day: "Friday", start: "9:00 AM", end: "5:00 PM", active: true },
    { day: "Saturday", start: "9:00 AM", end: "5:00 PM", active: false },
    { day: "Sunday", start: "9:00 AM", end: "5:00 PM", active: false },
  ])

  // ===== HIRING ROLES =====
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  // ===== VALIDATION =====
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i

  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/

  const isProfileComplete =
  companyName.trim() &&
  ownerName.trim() &&
  location.trim() &&
  businessType.trim() &&
  details.trim() &&
  emailRegex.test(email) &&
  phoneRegex.test(phone) &&
  hourlyPay.trim() &&
  Number(hourlyPay) > 0 &&
  preferredJobs.length > 0
  
  const validateProfile = () => {
    if (!companyName.trim()) {
      toast.error("Missing company name")
      scrollToField(companyRef)
      return false
    }
  
    if (!ownerName.trim()) {
      toast.error("Missing owner name")
      scrollToField(ownerRef)
      return false
    }
  
    if (!emailRegex.test(email)) {
      toast.error("Invalid email")
      scrollToField(emailRef)
      return false
    }
  
    if (!phoneRegex.test(phone)) {
      toast.error("Invalid phone number")
      scrollToField(phoneRef)
      return false
    }
  
    if (!businessType.trim()) {
      toast.error("Missing business type")
      return false
    }
  
    if (!location.trim()) {
      toast.error("Missing location")
      return false
    }
  
    if (!details.trim()) {
      toast.error("Missing description")
      scrollToField(detailsRef)
      return false
    }
  
    if (!hourlyPay.trim() || Number(hourlyPay) <= 0) {
      toast.error("Missing hourly pay")
      return false
    }
  
    if (preferredJobs.length === 0) {
      toast.error("Select at least one Hiring Role")
      return false
    }
  
    return true
  }

  // ===== TIME OPTIONS =====
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12
    const ampm = i < 12 ? "AM" : "PM"
    return `${hour}:00 ${ampm}`
  })

  // ===== LOAD DATA =====
  useEffect(() => {
    const loadEmployer = async () => {
      setLoading(true)
  
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      // auto-fill auth email
      if (user.email) {
        setEmail(user.email)
      }
  
      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
  
      if (error && error.code !== "PGRST116") {
        console.log("Employer load error:", error)
        setLoading(false)
        return
      }
  
      if (!data) {
        setLoading(false)
        return
      }
  
      // ===== AUTO FILL (same pattern as student page) =====
      setJobId(data.id ?? null)
  
      setCompanyName(data.company ?? "")
      setOwnerName(data.owner_name ?? "")
      setEmail(data.email ?? user.email ?? "")
      setLocation(data.location ?? "")
      setBusinessType(data.business_type ?? "")
      setPhone(data.phone ?? "")
      setDetails(data.details ?? "")
  
      setPreferredJobs(data.preferred_jobs ?? [])
    setAvailableShifts(data.available_shifts ?? availableShifts)
  
      setShiftPreference(data.shift_preference ?? "flexible")
  
      setHourlyPay(
        data.hourly_pay ? String(data.hourly_pay) : ""
      )
  
      setHasTips(Boolean(data.has_tips))
  
      setLoading(false)
    }
  
    loadEmployer()
  }, [])

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
{/* STICKY SAVE HEADER */}
<div className="sticky top-0 z-50 mb-6">
  <div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-xl backdrop-blur px-6 py-5 sm:px-7">

      {/* LEFT SIDE */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            Employer
          </div>

          {!isProfileComplete && (
            <div className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-semibold text-yellow-800 border border-yellow-200">
              Incomplete
            </div>
          )}
        </div>

        <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
          Complete Your Hiring Profile
        </h2>

        <p className="text-sm text-gray-600 mt-1 max-w-md">
          Add your company details and hiring preferences to start matching with students.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <Button
          className={`h-12 px-6 rounded-xl text-sm font-semibold shadow-lg transition-all ${
            !isProfileComplete
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-[1.02]"
          }`}
          onClick={async () => {
            const isValid = validateProfile()
            if (!isValid) return
          
            const { data: { user } } = await supabase.auth.getUser()
          
            if (!user) {
              toast.error("Not logged in")
              return
            }
          
            const { data, error } = await supabase
              .from("job")
              .upsert(
                {
                  id: jobId || undefined,
                  user_id: user.id,
                  title: companyName || "Untitled Job",
                  company: companyName || "Unknown Company",
                  owner_name: ownerName || null,
                  business_type: businessType || null,
                  email: email || null,
                  phone: phone || null,
                  location: location || "Unknown",
                  details: details || "No description",
                  pay: hourlyPay ? `$${Number(hourlyPay).toFixed(2)}/hr` : null,
                  hourly_pay: hourlyPay ? Number(hourlyPay) : null,
                  has_tips: hasTips,
                  shift_preference: shiftPreference,
                  available_shifts: availableShifts,
                  preferred_jobs: preferredJobs,
                  status: "new",
                  distance: "0",
                },
                { onConflict: "user_id" }
              )
              .select()
              .single()
          
            if (error) {
              console.error(error)
              toast.error(error.message)
              return
            }
          
            if (data?.id) setJobId(data.id)
          
            // Mark profile as complete in profiles table
       // Mark profile as complete in profiles table
const { data: profileData, error: profileError } = await supabase
.from("profiles")
.upsert(
  { id: user.id, email: user.email, profile_complete: true },
  { onConflict: "id" }
)
.select("subscription_status")
.single()

if (profileError) {
console.error("PROFILE COMPLETE ERROR:", profileError)
toast.error("Saved but failed to mark profile complete.")
return
}

toast.success("Saved!")

toast.success("Saved!")

            if (profileData?.subscription_status === "active") {
              router.push("/employer")
            } else {
              router.push("/billing")
            }
          }}
        >
          Save Profile
        </Button>
      </div>
    </div>
  </div>
</div>
    {/* HEADER */}
  {/* HEADER */}

    <h1 className="text-2xl font-bold mb-4">Employer Profile</h1>
  
    {/* COMPANY INFO */}
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Info
        </CardTitle>
      </CardHeader>
  
      <CardContent className="space-y-2">
        <input ref={companyRef} value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Company Name"
        />
  
        <input ref={ownerRef} value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Owner / Manager Name"
        />
  
        <input value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Business Type (ex. food service)"
        />
  
        <input value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Location"
        />
  
        <input ref={emailRef} value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Email"
        />
  
  <input
  ref={phoneRef}
  value={phone}
  onChange={(e) => {
    // remove anything that's not a number
    let value = e.target.value.replace(/\D/g, "")

    // HARD LIMIT: max 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10)
    }

    setPhone(value)
  }}
  className="w-full border rounded px-2 py-1 text-sm"
  placeholder="Phone Number (10 digits)"
/>
  
        <textarea ref={detailsRef} value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Company Description"
        />
  
        {/* PAY */}
        <input
          value={hourlyPay}
          onChange={(e) => setHourlyPay(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Pay per hour (e.g. 15.50)"
          type="number"
          step="0.01"
        />
  
        {/* TIPS */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm">Tips?</span>
          <button
  type="button"
  onClick={() => setHasTips(prev => !prev)}
  className={`px-4 py-1 text-xs rounded border font-semibold transition-all min-w-[80px] text-center
    ${hasTips
      ? "bg-white text-blue-700 border-blue-400"
      : "bg-white text-blue-700 border-blue-400"
    }
  `}
>
  {hasTips ? "Yes" : "No"}
</button>
        </div>
      </CardContent>
    </Card>

{/* HIRING ROLE (NEW SYSTEM) */}
<Card className="mb-4">
  <CardHeader>
    <CardTitle>Hiring Role</CardTitle>
  </CardHeader>

  <CardContent>
    <div className="flex gap-2 mt-2">
    {[
  "Cashier",
  "Server",
  "Busser",
  "Barista",
  "Cook",
  "Dishwasher",
  "Host",
  "Sales Associate",
  "Stock Associate",
  "Customer Service",
  "Store Associate"
].map((role) => (
  <button
    key={role}
    onClick={() => {
      setPreferredJobs((prev) => {
        const isSelected = prev.includes(role)
    
        // REMOVE if already selected (always allowed)
        if (isSelected) {
          return prev.filter((r) => r !== role)
        }
    
        // BLOCK if already at 3
        if (prev.length >= 3) {
          toast.error("You can only select up to 3 hiring roles")
          return prev
        }
    
        // OTHERWISE ADD
        return [...prev, role]
      })
    }}className={`px-3 py-1 text-xs rounded-full border transition-all ${
        preferredJobs.includes(role)       
         ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
        : "bg-gray-100 text-gray-600 border-gray-200"
    }`}
  >
    {role}
  </button>
))}
    </div>
  </CardContent>
</Card>

      {/* AVAILABLE SHIFTS */}
     {/* AVAILABLE SHIFTS */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      Available Shifts
    </CardTitle>
  </CardHeader>

  <CardContent>
    {/* SHIFT PREF */}
    <div className="mb-4">
      <label className="text-sm font-medium">Preferred Shift Type</label>

      <div className="flex gap-2 mt-2">
      {["morning", "night", "flexible"].map((type) => (
  <button
    key={type}
    onClick={() => setShiftPreference(type as any)}
    className={`px-3 py-1 text-xs rounded-full border transition-all ${
      shiftPreference === type
        ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
        : "bg-gray-100 text-gray-600 border-gray-200"
    }`}
  >
    {type}
  </button>
))}
      </div>
    </div>

    {/* DAYS */}
    <div className="space-y-2">
      {availableShifts.map((day, index) => (
        <div
          key={day.day}
          className="flex justify-between items-center text-sm"
        >
          <span className="w-16 font-medium text-gray-700">
  {day.day.slice(0, 3)}
</span>

          <div className="flex gap-1 items-center">

            {/* START */}
            <select
              value={day.start}
              disabled={!day.active}
              onChange={(e) =>
                setAvailableShifts((prev) =>
                  prev.map((d, i) =>
                    i === index ? { ...d, start: e.target.value } : d
                  )
                )
              }
              className={`w-24 border rounded text-xs px-1 py-1 text-black bg-white ${
                !day.active ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* END */}
            <select
              value={day.end}
              disabled={!day.active}
              onChange={(e) =>
                setAvailableShifts((prev) =>
                  prev.map((d, i) =>
                    i === index ? { ...d, end: e.target.value } : d
                  )
                )
              }
              className={`w-24 border rounded text-xs px-1 py-1 text-black bg-white ${
                !day.active ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* TOGGLE */}
            <button
  onClick={() =>
    setAvailableShifts((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, active: !d.active } : d
      )
    )
  }
  className="w-24 px-2 py-1 text-xs rounded text-center font-medium transition-all"
>
  <span
    className={`px-2 py-1 rounded-full border transition-all
      ${
        day.active
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
  >
    {day.active ? "Available" : "Unavailable"}
  </span>
</button>
          </div>
        </div>
      ))}
    </div>

    {/* SAVE */}
 
  </CardContent>
</Card>
    </div>
  )
}