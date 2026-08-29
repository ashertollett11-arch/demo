"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

const TOTAL_STEPS = 4

export default function StudentOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const finishedRef = useRef(false)
  const navigatingRef = useRef(false)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [address, setAddress] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [school, setSchool] = useState("")
  const [gpa, setGpa] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
      const { data: existing } = await supabase.from("Students")
        .select("name, age, gender, location, zip_code, school, gpa, email, phone").eq("user_id", user.id).maybeSingle()
      if (existing) {
        if (existing.name) setName(existing.name)
        if (existing.age) setAge(String(existing.age))
        if (existing.gender) setGender(existing.gender)
        if (existing.location) setAddress(existing.location)
        if (existing.zip_code) setZipCode(existing.zip_code)
        if (existing.school) setSchool(existing.school)
        if (existing.gpa) setGpa(String(existing.gpa))
        if (existing.phone) setPhone(existing.phone)
        if (existing.email) setEmail(existing.email)
      } else {
        if (user.email) setEmail(user.email)
        if (user.user_metadata?.full_name) setName(user.user_metadata.full_name)
      }
    }
    load()
  }, [router])

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("Students").upsert({
      user_id: user.id,
      name: name || null, age: age ? Number(age) : null, gender: gender || null,
      location: address || null, zip_code: zipCode || null, school: school || null,
      gpa: gpa ? Number(gpa) : null, email: email || null, phone: phone || null,
      profile_complete: false,
    }, { onConflict: "user_id" })
    setLastSaved(new Date())
  }

  useEffect(() => {
    if (!name && !age && !address && !zipCode && !school && !gpa && !phone) return
    const timer = setTimeout(async () => {
      if (finishedRef.current) return
      setAutoSaving(true)
      await saveProgress()
      setAutoSaving(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [name, age, gender, address, zipCode, school, gpa, email, phone])

  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
  const zipRegex = /^\d{5}$/

  const canProceed = () => {
    switch (step) {
      case 1: const n = parseInt(age); return name.trim().length > 0 && !isNaN(n) && n >= 14 && n <= 21 && gender !== ""
      case 2: return address.trim().length > 0 && zipRegex.test(zipCode)
      case 3: return school.trim().length > 0 && gpa.trim().length > 0 && parseFloat(gpa) <= 4
      case 4: return emailRegex.test(email) && phone.length === 10
      default: return false
    }
  }

  const handleFinish = async () => {
    if (!canProceed()) return
    setSaving(true)
    finishedRef.current = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const defaultAvailability = [
      { day: "Monday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "8" },
      { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "8" },
      { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "8" },
      { day: "Thursday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "8" },
      { day: "Friday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "8" },
      { day: "Saturday", start: "3:00 PM", end: "10:00 PM", available: true, hours: "7" },
      { day: "Sunday", start: "3:00 PM", end: "10:00 PM", available: true, hours: "7" },
    ]
    const { error } = await supabase.from("Students").upsert({
      user_id: user.id, name, age: Number(age), gender,
      location: address, zip_code: zipCode, school, gpa: Number(gpa), email, phone,
      availability: defaultAvailability, shift_preference: "flexible",
      interests: ["School", "Hanging out with friends"],
      preferred_jobs: ["Busser", "Customer Service", "Dishwasher"],
      profile_complete: true,
    }, { onConflict: "user_id" })
    if (error) { toast.error("Failed to save. Please try again."); setSaving(false); return }
    await fetch("/api/calculate-distances", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentUserId: user.id }),
    }).catch(() => {})
    toast.success("Welcome to SimplyApply!")
    router.push("/student")
  }

  const next = async () => {
    if (!canProceed()) { toast.error("Please fill out all fields before continuing."); return }
    if (navigatingRef.current || saving) return
    navigatingRef.current = true
    if (step === TOTAL_STEPS) {
      await handleFinish()
    } else {
      await saveProgress()
      setStep(s => s + 1)
    }
    navigatingRef.current = false
  }

  const back = () => setStep(s => s - 1)
  const progress = (step / TOTAL_STEPS) * 100

  const inputClass = "w-full rounded-2xl border border-border bg-secondary/40 px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">S</div>
            <span className="text-base font-bold text-foreground">SimplyApply</span>
          </div>
          {/* STATUS */}
          <div className="flex items-center gap-2">
            {autoSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            {!autoSaving && lastSaved && <span className="text-xs text-muted-foreground">Saved ✓</span>}
            <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-1">{step} / {TOTAL_STEPS}</span>
          </div>
        </div>
        {/* PROGRESS BAR */}
        <div className="h-1 w-full bg-secondary">
          <div className="h-1 bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col justify-between px-5 py-8 max-w-lg mx-auto w-full">
        <div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 1 of 4</p>
                <h1 className="text-3xl font-bold text-foreground">Let's get started</h1>
                <p className="text-muted-foreground mt-2">Tell us a little about yourself.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Age</label>
                  <input type="number" value={age}
                    onChange={(e) => { const v = e.target.value; if (v === "") { setAge(""); return } if (parseInt(v) > 21) return; setAge(v) }}
                    placeholder="14–21" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["male", "female"].map((g) => (
                      <button key={g} onClick={() => setGender(g as "male" | "female")}
                        className={`py-3.5 rounded-2xl border text-sm font-semibold capitalize transition-all ${gender === g ? "bg-foreground text-background border-foreground" : "bg-secondary/40 border-border text-foreground"}`}>
                        {g === "male" ? "Male" : "Female"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 2 of 4</p>
                <h1 className="text-3xl font-bold text-foreground">Where are you?</h1>
                <p className="text-muted-foreground mt-2">We use this to find jobs near you.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Street Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Zip Code</label>
                  <input value={zipCode}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 5) setZipCode(v) }}
                    placeholder="12345" maxLength={5} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 3 of 4</p>
                <h1 className="text-3xl font-bold text-foreground">Your education</h1>
                <p className="text-muted-foreground mt-2">Employers love seeing your academic info.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">School</label>
                  <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Your school name" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Unweighted GPA</label>
                  <input type="number" step="0.01" min="0" max="4" value={gpa}
                    onChange={(e) => { const v = e.target.value; if (v === "") { setGpa(""); return } if (parseFloat(v) > 4) return; setGpa(v) }}
                    placeholder="e.g. 3.5" className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-2">Max 4.0 unweighted.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 4 of 4</p>
                <h1 className="text-3xl font-bold text-foreground">Almost there!</h1>
                <p className="text-muted-foreground mt-2">How can employers reach you?</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number</label>
                  <input type="tel" value={phone}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setPhone(v) }}
                    placeholder="10-digit number" className={inputClass} />
                </div>
                {/* ALMOST DONE CARD */}
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 mt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Your info is private</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Contact info is only shared with employers you match with. You can update everything from your profile anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* NAVIGATION */}
   {/* NAVIGATION */}
   {step === 1 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await supabase.from("Students").delete().eq("user_id", user.id)
                  await supabase.from("users").delete().eq("id", user.id)
                }
                await supabase.auth.signOut()
                router.replace("/choose-role")
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Wrong role? Go back to choose role
            </button>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button onClick={back}
              className="flex items-center justify-center h-14 px-5 rounded-2xl border border-border bg-secondary/40 text-foreground font-semibold transition-all active:scale-[0.97]">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed() || saving}
            className={`flex-1 h-14 rounded-2xl text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${
              !canProceed() || saving
                ? "bg-foreground/30 text-background/60 cursor-not-allowed"
                : "bg-foreground text-background shadow-lg"
            }`}>
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background" />
                Saving...
              </>
            ) : step === TOTAL_STEPS ? (
              "Finish & Find Jobs"
            ) : (
              <>Continue <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}