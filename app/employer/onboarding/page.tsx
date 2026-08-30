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

const JOB_ROLES = [
  "Cashier", "Server", "Busser", "Barista", "Cook", "Dishwasher", "Host/Hostess", "Food Runner", "Ice Cream Scooper",
  "Sales Associate", "Stock Associate", "Bagger", "Fitting Room Attendant", "Cart Attendant",
  "Customer Service", "Front Desk", "Receptionist",
  "Lifeguard", "Camp Counselor", "Theme Park Attendant", "Movie Theater Attendant", "Bowling Alley Attendant",
  "Car Wash Attendant", "Car Detailer",
  "Tutor", "Library Assistant", "Office Assistant",
]

const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"

export default function EmployerOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [details, setDetails] = useState("")

  const [locName, setLocName] = useState("")
  const [locAddress, setLocAddress] = useState("")
  const [locZip, setLocZip] = useState("")
  const [locMaxDistance, setLocMaxDistance] = useState(25)
  const [locPay, setLocPay] = useState("")
  const [locTips, setLocTips] = useState(false)
  const [locShiftPref, setLocShiftPref] = useState<"morning" | "night" | "flexible">("flexible")
  const [locShifts, setLocShifts] = useState(DEFAULT_SHIFTS)
  const [locJobs, setLocJobs] = useState<string[]>([])

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (roleData?.role !== "employer") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("profiles").select("profile_complete").eq("id", user.id).maybeSingle()
      if (profile?.profile_complete) { router.replace("/employer"); return }
      if (user.email) setEmail(user.email)
      const { data: existing } = await supabase.from("job").select("*").eq("user_id", user.id).maybeSingle()
      if (existing) {
        setJobId(existing.id); setCompanyName(existing.company || ""); setOwnerName(existing.owner_name || "")
        setBusinessType(existing.business_type || ""); setEmail(existing.email || user.email || "")
        setPhone(existing.phone || ""); setDetails(existing.details || "")
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
    const { data, error } = await supabase.from("job").upsert({
      id: jobId || undefined, user_id: user.id, title: companyName, company: companyName,
      owner_name: ownerName, business_type: businessType, email, phone, details,
      preferred_jobs: [], status: "new", distance: "0",
    }, { onConflict: "user_id" }).select().single()
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
    const { data: locData, error: locError } = await supabase.from("locations").insert({
      employer_id: jobId, name: locName.trim(), address: locAddress.trim(), zip_code: locZip,
      max_distance_miles: locMaxDistance, shift_preference: locShiftPref, available_shifts: locShifts,
      hourly_pay: Number(locPay), has_tips: locTips, preferred_jobs: locJobs,
    }).select("id").single()
    if (locError) { toast.error("Failed to save location. Please try again."); setSaving(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, email: user.email, profile_complete: true, subscription_status: "freeactive" }, { onConflict: "id" })
    }
    if (locData?.id) {
      await fetch("/api/calculate-distances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: locData.id }) }).catch(() => {})
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
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <div className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
            <span className="text-lg font-bold text-foreground">SimplyApply</span>
          </div>
          {/* PROGRESS */}
          <div className="flex items-center gap-2">
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
                  {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
                </div>
              )
            })}
          </div>
          <div className="w-32" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* STEP 1 — COMPANY INFO */}
        {step === 1 && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground">Tell us about your business</h1>
              <p className="text-muted-foreground mt-2">This info appears on your employer profile that students see.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
              {/* FORM */}
              <div className="lg:col-span-3">
                <Card className="border-border">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Company Name <span className="text-red-500">*</span></label>
                        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Seaside Grill" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Owner / Manager Name <span className="text-red-500">*</span></label>
                        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Jane Smith" className={inputClass} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Business Type <span className="text-red-500">*</span></label>
                        <input value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                          placeholder="e.g. Restaurant, Retail" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                        <input type="tel" value={phone}
                          onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 10) v = v.slice(0, 10); setPhone(v) }}
                          placeholder="10-digit number" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Business Email <span className="text-red-500">*</span></label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">About Your Business <span className="text-red-500">*</span></label>
                      <textarea value={details} onChange={(e) => setDetails(e.target.value)}
                        placeholder="Describe your business and what it's like to work there..."
                        rows={4} className={inputClass + " resize-none"} />
                    </div>
                    <Button className="w-full h-11" onClick={saveStep1} disabled={saving}>
                      {saving ? "Saving..." : "Continue to Location"}
                      {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <button
                      onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          await supabase.from("job").delete().eq("user_id", user.id)
                          await supabase.from("users").delete().eq("id", user.id)
                        }
                        await supabase.auth.signOut()
                        router.replace("/choose-role")
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 py-2">
                      ← Wrong role? Go back to choose role
                    </button>
                  </CardContent>
                </Card>
              </div>
              {/* SIDEBAR */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <p className="text-sm font-semibold text-foreground mb-3">Why we ask for this</p>
                  <div className="space-y-3">
                    {[
                      { icon: "🏢", text: "Your company name and type help students understand where they'd be working." },
                      { icon: "📞", text: "Phone and email let students contact you directly when you reach out." },
                      { icon: "✍️", text: "Your description is the first thing students read — make it welcoming." },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm font-semibold text-foreground mb-2">✅ Free during early access</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">SimplyApply is completely free for employers right now. No credit card needed — just set up your profile and start finding candidates.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — FIRST LOCATION */}
        {step === 2 && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground">Add your first location</h1>
              <p className="text-muted-foreground mt-2">Students near this location will see your job listing.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">

              {/* LEFT — basic info */}
              <div className="space-y-5">
                <Card className="border-border">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm font-semibold text-foreground">Location Details</p>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Location Name <span className="text-red-500">*</span></label>
                      <input value={locName} onChange={(e) => setLocName(e.target.value)}
                        placeholder='"Main Street" or "Beach Location"' className={inputClass} />
                      <p className="text-xs text-muted-foreground mt-1">This is what students will see.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Street Address <span className="text-red-500">*</span></label>
                      <input value={locAddress} onChange={(e) => setLocAddress(e.target.value)}
                        placeholder="123 Main St" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Zip Code <span className="text-red-500">*</span></label>
                        <input value={locZip} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 5) setLocZip(v) }}
                          placeholder="32459" maxLength={5} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Pay Per Hour <span className="text-red-500">*</span></label>
                        <input type="number" step="0.01" value={locPay} onChange={(e) => setLocPay(e.target.value)}
                          placeholder="$15.00" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Max Hiring Distance</label>
                      <select value={locMaxDistance} onChange={(e) => setLocMaxDistance(Number(e.target.value))} className={inputClass}>
                        {[1,3,5,10,15,20,25,35].map(m => <option key={m} value={m}>{m} miles</option>)}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Only students within this distance will see your listing.</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                      <span className="text-sm font-medium">Tips included?</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setLocTips(true)}
                          className={`px-4 py-1 text-xs rounded-lg border font-semibold transition-all ${locTips ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                          Yes
                        </button>
                        <button type="button" onClick={() => setLocTips(false)}
                          className={`px-4 py-1 text-xs rounded-lg border font-semibold transition-all ${!locTips ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                          No
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT — roles + shifts */}
              <div className="space-y-5">
                <Card className="border-border">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm font-semibold text-foreground">Hiring Preferences</p>
                    <div>
                      <label className="text-sm font-medium block mb-2">Hiring Roles <span className="text-red-500">*</span> <span className="text-muted-foreground font-normal">(up to 3)</span></label>
                      <div className="flex flex-wrap gap-2">
                        {JOB_ROLES.map((role) => (
                          <button key={role} type="button"
                            onClick={() => setLocJobs(prev => {
                              if (prev.includes(role)) return prev.filter(r => r !== role)
                              if (prev.length >= 3) { toast.error("Max 3 roles"); return prev }
                              return [...prev, role]
                            })}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${locJobs.includes(role) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Shift Preference</label>
                      <div className="flex gap-2">
                        {["morning", "night", "flexible"].map((type) => (
                          <button key={type} type="button" onClick={() => setLocShiftPref(type as any)}
                            className={`flex-1 py-2 text-sm rounded-lg border capitalize font-medium transition-all ${locShiftPref === type ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Available Shifts</label>
                      <div className="rounded-xl border border-border overflow-hidden">
                        {locShifts.map((day, index) => (
                          <div key={day.day} className={`flex items-center gap-3 px-3 py-2.5 ${index < locShifts.length - 1 ? "border-b border-border" : ""} ${!day.active ? "bg-secondary/20" : ""}`}>
                            <span className="text-sm font-medium text-foreground w-8">{day.day.slice(0, 3)}</span>
                            <select value={day.start} disabled={!day.active}
                              onChange={(e) => { const n = [...locShifts]; n[index].start = e.target.value; setLocShifts(n) }}
                              className={`text-xs border border-border rounded-lg px-2 py-1 bg-background ${!day.active ? "opacity-40" : ""}`}>
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-xs text-muted-foreground">to</span>
                            <select value={day.end} disabled={!day.active}
                              onChange={(e) => { const n = [...locShifts]; n[index].end = e.target.value; setLocShifts(n) }}
                              className={`text-xs border border-border rounded-lg px-2 py-1 bg-background ${!day.active ? "opacity-40" : ""}`}>
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button type="button"
                              onClick={() => { const n = [...locShifts]; n[index].active = !n[index].active; setLocShifts(n) }}
                              className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${day.active ? "bg-primary" : "bg-gray-300"}`}>
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${day.active ? "translate-x-4" : "translate-x-0.5"}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* BUTTONS */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 h-11" onClick={saveStep2} disabled={saving}>
                    {saving ? "Saving..." : "Finish Setup"}
                    {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3 — DONE */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">You're all set, {companyName}!</h1>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Your profile is live. Students near your location can now discover your job listing and apply.
            </p>
            <Card className="text-left w-full mb-6">
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