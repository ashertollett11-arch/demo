"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Building2, MapPin, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react"

const DEFAULT_SHIFTS = [
  { day: "Monday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Thursday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Friday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Saturday", start: "9:00 AM", end: "5:00 PM", active: false },
  { day: "Sunday", start: "9:00 AM", end: "5:00 PM", active: false },
]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12
  const ampm = i < 12 ? "AM" : "PM"
  return `${hour}:00 ${ampm}`
})

const JOB_ROLES = ["Cashier", "Server", "Busser", "Barista", "Cook", "Dishwasher", "Host", "Sales Associate", "Stock Associate", "Customer Service", "Store Associate"]

const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i

export default function EmployerOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  // Step 1 — Company Info
  const [companyName, setCompanyName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [details, setDetails] = useState("")

  // Step 2 — Location
  const [locName, setLocName] = useState("")
  const [locAddress, setLocAddress] = useState("")
  const [locZip, setLocZip] = useState("")
  const [locMaxDistance, setLocMaxDistance] = useState(25)
  const [locPay, setLocPay] = useState("")
  const [locTips, setLocTips] = useState(false)
  const [locShiftPref, setLocShiftPref] = useState<"morning" | "night" | "flexible">("flexible")
  const [locShifts, setLocShifts] = useState(DEFAULT_SHIFTS)
  const [locJobs, setLocJobs] = useState<string[]>([])

  // AUTH CHECK — only for employers without complete profile
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: roleData } = await supabase
        .from("users").select("role").eq("id", user.id).maybeSingle()
      if (roleData?.role !== "employer") { router.replace("/login"); return }

      const { data: profile } = await supabase
        .from("profiles").select("profile_complete").eq("id", user.id).maybeSingle()
      if (profile?.profile_complete) { router.replace("/employer"); return }

      // Pre-fill email
      if (user.email) setEmail(user.email)

      // Pre-fill if they started before
      const { data: existing } = await supabase
        .from("job").select("*").eq("user_id", user.id).maybeSingle()
      if (existing) {
        setJobId(existing.id)
        setCompanyName(existing.company || "")
        setOwnerName(existing.owner_name || "")
        setBusinessType(existing.business_type || "")
        setEmail(existing.email || user.email || "")
        setPhone(existing.phone || "")
        setDetails(existing.details || "")
      }
    }
    check()
  }, [router])

  const validateStep1 = () => {
    if (!companyName.trim()) { toast.error("Company name is required"); return false }
    if (!ownerName.trim()) { toast.error("Owner name is required"); return false }
    if (!businessType.trim()) { toast.error("Business type is required"); return false }
    if (!emailRegex.test(email)) { toast.error("Valid email is required"); return false }
    if (phone.length !== 10) { toast.error("Valid 10-digit phone number is required"); return false }
    if (!details.trim()) { toast.error("Company description is required"); return false }
    return true
  }

  const saveStep1 = async () => {
    if (!validateStep1()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase
      .from("job")
      .upsert({
        id: jobId || undefined,
        user_id: user.id,
        title: companyName,
        company: companyName,
        owner_name: ownerName,
        business_type: businessType,
        email,
        phone,
        details,
        preferred_jobs: [],
        status: "new",
        distance: "0",
      }, { onConflict: "user_id" })
      .select().single()
    if (error) { toast.error("Failed to save. Please try again."); setSaving(false); return }
    if (data?.id) setJobId(data.id)
    setSaving(false)
    setStep(2)
  }

  const validateStep2 = () => {
    if (!locName.trim()) { toast.error("Location name is required"); return false }
    if (!locAddress.trim()) { toast.error("Address is required"); return false }
    if (!/^\d{5}$/.test(locZip)) { toast.error("Valid 5-digit zip code is required"); return false }
    if (!locPay || Number(locPay) <= 0) { toast.error("Pay rate is required"); return false }
    if (locJobs.length === 0) { toast.error("Select at least one hiring role"); return false }
    return true
  }

  const saveStep2 = async () => {
    if (!validateStep2()) return
    if (!jobId) { toast.error("Please complete step 1 first"); return }
    setSaving(true)
    const { data: locData, error: locError } = await supabase
      .from("locations")
      .insert({
        employer_id: jobId,
        name: locName.trim(),
        address: locAddress.trim(),
        zip_code: locZip,
        max_distance_miles: locMaxDistance,
        shift_preference: locShiftPref,
        available_shifts: locShifts,
        hourly_pay: Number(locPay),
        has_tips: locTips,
        preferred_jobs: locJobs,
      })
      .select("id").single()
    if (locError) { toast.error("Failed to save location. Please try again."); setSaving(false); return }

    // Mark profile complete
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles")
        .upsert({ id: user.id, email: user.email, profile_complete: true }, { onConflict: "id" })
    }

    // Calculate distances in background
    if (locData?.id) {
      fetch("/api/calculate-distances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: locData.id }),
      }).catch(() => {})
    }

    setSaving(false)
    setStep(3)
  }

  const steps = [
    { num: 1, label: "Company Info", icon: Building2 },
    { num: 2, label: "First Location", icon: MapPin },
    { num: 3, label: "Done", icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-lg">

        {/* LOGO */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
          <span className="text-lg font-bold text-foreground">SimplyApply</span>
        </div>

        {/* PROGRESS */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.num
            const isDone = step > s.num
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isDone ? "bg-primary/10 text-primary" :
                  isActive ? "bg-primary text-primary-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </div>
            )
          })}
        </div>

        {/* STEP 1 — COMPANY INFO */}
        {step === 1 && (
          <div>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Tell us about your business</h1>
              <p className="text-sm text-muted-foreground mt-1">This info appears on your employer profile that students see.</p>
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Seaside Grill" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Owner / Manager Name <span className="text-red-500">*</span></label>
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Jane Smith" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Business Type <span className="text-red-500">*</span></label>
                  <input value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. Restaurant, Retail, Coffee Shop" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Business Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={phone}
                    onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 10) v = v.slice(0, 10); setPhone(v) }}
                    placeholder="10-digit number" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">About Your Business <span className="text-red-500">*</span></label>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe your business and what it's like to work there..."
                    rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <Button className="w-full h-11" onClick={saveStep1} disabled={saving}>
                  {saving ? "Saving..." : "Continue to Location"}
                  {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2 — FIRST LOCATION */}
        {step === 2 && (
          <div>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Add your first location</h1>
              <p className="text-sm text-muted-foreground mt-1">Students near this location will see your job listing.</p>
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Location Name <span className="text-red-500">*</span></label>
                  <input value={locName} onChange={(e) => setLocName(e.target.value)}
                    placeholder='e.g. "Main Street" or "Beach Location"'
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">This is what students will see.</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Street Address <span className="text-red-500">*</span></label>
                  <input value={locAddress} onChange={(e) => setLocAddress(e.target.value)}
                    placeholder="123 Main St" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Zip Code <span className="text-red-500">*</span></label>
                    <input value={locZip}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 5) setLocZip(v) }}
                      placeholder="32459" maxLength={5} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Pay Per Hour <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" value={locPay} onChange={(e) => setLocPay(e.target.value)}
                      placeholder="$15.00" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Max Hiring Distance</label>
                  <select value={locMaxDistance} onChange={(e) => setLocMaxDistance(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                    <option value={1}>1 mile</option>
                    <option value={3}>3 miles</option>
                    <option value={5}>5 miles</option>
                    <option value={10}>10 miles</option>
                    <option value={15}>15 miles</option>
                    <option value={20}>20 miles</option>
                    <option value={25}>25 miles</option>
                    <option value={35}>35 miles</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Only students within this distance will see your listing.</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <span className="text-sm font-medium">Tips included?</span>
                  <button type="button" onClick={() => setLocTips(prev => !prev)}
                    className={`px-4 py-1 text-xs rounded border font-semibold transition-all min-w-[60px] text-center ${locTips ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {locTips ? "Yes" : "No"}
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Hiring Roles <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_ROLES.map((role) => (
                      <button key={role} type="button"
                        onClick={() => setLocJobs(prev => {
                          if (prev.includes(role)) return prev.filter(r => r !== role)
                          if (prev.length >= 3) { toast.error("Max 3 roles"); return prev }
                          return [...prev, role]
                        })}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${locJobs.includes(role) ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Select up to 3 roles you're hiring for.</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Shift Preference</label>
                  <div className="flex gap-2">
                    {["morning", "night", "flexible"].map((type) => (
                      <button key={type} type="button" onClick={() => setLocShiftPref(type as any)}
                        className={`flex-1 py-1.5 text-xs rounded-full border capitalize transition-all ${locShiftPref === type ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Available Shifts</label>
                  <div className="space-y-2">
                    {locShifts.map((day, index) => (
                      <div key={day.day} className="flex items-center gap-2 text-sm">
                        <span className="w-10 font-medium text-gray-700 text-xs">{day.day.slice(0, 3)}</span>
                        <select value={day.start} disabled={!day.active}
                          onChange={(e) => { const n = [...locShifts]; n[index].start = e.target.value; setLocShifts(n) }}
                          className={`w-24 border rounded text-xs px-1 py-1 ${!day.active ? "opacity-40" : ""}`}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={day.end} disabled={!day.active}
                          onChange={(e) => { const n = [...locShifts]; n[index].end = e.target.value; setLocShifts(n) }}
                          className={`w-24 border rounded text-xs px-1 py-1 ${!day.active ? "opacity-40" : ""}`}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button"
                          onClick={() => { const n = [...locShifts]; n[index].active = !n[index].active; setLocShifts(n) }}
                          className={`text-xs px-2 py-1 rounded-full border transition-all ${day.active ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {day.active ? "Open" : "Off"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 h-11" onClick={saveStep2} disabled={saving}>
                    {saving ? "Saving..." : "Finish Setup"}
                    {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3 — DONE */}
        {step === 3 && (
          <div className="text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">You're all set, {companyName}!</h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Your profile is live. Students near your location can now discover your job listing and apply.
            </p>
            <Card className="text-left mb-6">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{companyName}</p>
                    <p className="text-xs text-muted-foreground">{businessType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{locName}</p>
                    <p className="text-xs text-muted-foreground">{locAddress} · {locMaxDistance} mi radius</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full h-11" onClick={() => router.push("/employer")}>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              You can edit your profile and add more locations anytime from the dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}