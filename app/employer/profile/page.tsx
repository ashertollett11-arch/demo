"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Briefcase, Calendar, ChevronLeft, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
export default function EmployerProfilePage() {
  const router = useRouter()


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
  // ===== JOB PAY INFO =====
const [hourlyPay, setHourlyPay] = useState("")
const [hasTips, setHasTips] = useState(false)
  // ===== SHIFT PREFERENCE =====
  const [shiftPreference, setShiftPreference] = useState<
    "morning" | "night" | "flexible"
  >("flexible")

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
  companyName &&
  ownerName &&
  email &&
  location &&
  businessType &&
  phone &&
  details

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

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <Button
        onClick={async () => {
            const {
                data: { user },
              } = await supabase.auth.getUser()
          
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
          
                pay: hourlyPay ? `$${hourlyPay}/hr` : null,
                hourly_pay: hourlyPay ? Number(hourlyPay) : null,
                has_tips: hasTips,
          
                shift_preference: shiftPreference,
                available_shifts: availableShifts,
                preferred_jobs: preferredJobs,           
                status: "new",
                distance: "0",
              },
              {
                onConflict: "user_id",
              }
            )
            .select()
            .single()
          
          console.log("SUPABASE RESULT:", { data, error })
          
          if (error) {
            console.error("FULL SUPABASE ERROR:", error)
            toast.error(error.message)
            return
          }
          
          if (data?.id) {
            setJobId(data.id)
          }
            console.log("SAVING JOB:", {
                user_id: user.id,
                companyName,
                hourlyPay,
                availableShifts,
              })
              console.log("ERROR:", error)
              toast.success("Saved!")
            router.push("/employer")
          }}
        >
          Next
        </Button>
      </div>

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
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Company Name" />
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Owner / Manager Name" />
          <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Business Type" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Location" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Email" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Phone Number" />
          <textarea
  value={details}
  onChange={(e) => setDetails(e.target.value)}
  className="w-full border rounded px-2 py-1 text-sm"
  placeholder="Company Description"
/>          {/* PAY PER HOUR */}
<input
  value={hourlyPay}
  onChange={(e) => setHourlyPay(e.target.value)}
  className="w-full border rounded px-2 py-1 text-sm"
  placeholder="Pay per hour (e.g. 15.50)"
  type="number"
  step="0.01"
/>

{/* TIPS TOGGLE */}
{/* TIPS TOGGLE */}
<div className="flex items-center justify-between mt-2">
  <span className="text-sm">Tips?</span>

  <button
    type="button"
    onClick={() => setHasTips(prev => !prev)}
    className={`px-3 py-1 text-xs rounded border transition-all ${
      hasTips
        ? "bg-blue-700 text-blue-700 border-blue-700"
        : "bg-white text-blue-600 border-blue-400"
    }`}
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
        setPreferredJobs((prev) =>
          prev.includes(role)
            ? prev.filter((r) => r !== role) // remove if already selected
            : [...prev, role] // add if not selected
        )
      }}    className={`px-3 py-1 text-xs rounded-full border transition-all ${
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
    <Button
      className="w-full mt-3"
      onClick={() => {
       
        toast.success("Saved!", {
          description: "Availability updated successfully.",
        })
      }}
    >
      Save Shifts
    </Button>
  </CardContent>
</Card>
    </div>
  )
}