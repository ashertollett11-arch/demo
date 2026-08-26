"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight, CheckCircle2, Briefcase } from "lucide-react"
import Link from "next/link"

const TOTAL_STEPS = 4

export default function StudentOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const finishedRef = useRef(false)  // FORM STATE
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [address, setAddress] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [school, setSchool] = useState("")
  const [gpa, setGpa] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // AUTH CHECK + LOAD EXISTING DATA
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }

      // Load existing data if they've been here before
      const { data: existing } = await supabase
        .from("Students")
        .select("name, age, gender, location, zip_code, school, gpa, email, phone")
        .eq("user_id", user.id)
        .maybeSingle()

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

  // SAVE PROGRESS (without profile_complete)
  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("Students")
      .upsert(
        {
          user_id: user.id,
          name: name || null,
          age: age ? Number(age) : null,
          gender: gender || null,
          location: address || null,
          zip_code: zipCode || null,
          school: school || null,
          gpa: gpa ? Number(gpa) : null,
          email: email || null,
          phone: phone || null,
          profile_complete: false,
        },
        { onConflict: "user_id" }
      )
    setLastSaved(new Date())
  }

  // AUTOSAVE EVERY 2 SECONDS
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

  // VALIDATION PER STEP
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
  const zipRegex = /^\d{5}$/

  const canProceed = () => {
    switch (step) {
      case 1:
        const numAge = parseInt(age)
        return name.trim().length > 0 && !isNaN(numAge) && numAge >= 14 && numAge <= 21 && gender !== ""
      case 2:
        return address.trim().length > 0 && zipRegex.test(zipCode)
      case 3:
        return school.trim().length > 0 && gpa.trim().length > 0 && parseFloat(gpa) <= 4
      case 4:
        return emailRegex.test(email) && phone.length === 10
      default:
        return false
    }
  }

  // FINAL SAVE + REDIRECT
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

    const { error } = await supabase
      .from("Students")
      .upsert(
        {
          user_id: user.id,
          name,
          age: Number(age),
          gender,
          location: address,
          zip_code: zipCode,
          school,
          gpa: Number(gpa),
          email,
          phone,
          availability: defaultAvailability,
          shift_preference: "flexible",
          interests: ["School", "Hanging out with friends"],
          preferred_jobs: ["Busser", "Customer Service", "Dishwasher"],
          profile_complete: true,
        },
        { onConflict: "user_id" }
      )

    if (error) {
      toast.error("Failed to save. Please try again.")
      setSaving(false)
      return
    }

// Wait for distances before navigating so matching page has fresh data
await fetch("/api/calculate-distances", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ studentUserId: user.id }),
}).catch(() => {})
toast.success("Welcome to SimplyApply! You can always change your information in the top right.")
router.push("/matching/student")
  }

  // NEXT — save progress first then advance
  const next = async () => {
    if (!canProceed()) {
      toast.error("Please fill out all fields before continuing.")
      return
    }
    if (step === TOTAL_STEPS) {
      handleFinish()
    } else {
      await saveProgress()
      setStep(s => s + 1)
    }
  }

  const back = () => setStep(s => s - 1)
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SimplyApply</span>
          </Link>
          <div className="flex items-center gap-2">
            {autoSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            {!autoSaving && lastSaved && <span className="text-xs text-muted-foreground">Saved ✓</span>}
            <span className="text-sm text-muted-foreground">{step} of {TOTAL_STEPS}</span>
          </div>
        </div>
        <div className="mx-auto max-w-lg mt-3">
          <div className="h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Let's get started</h1>
                <p className="text-muted-foreground mt-1">Tell us a little about yourself.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Age</label>
                  <input type="number" value={age}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") { setAge(""); return }
                      if (parseInt(value) > 21) return
                      setAge(value)
                    }}
                    placeholder="Your age (14–21)"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["male", "female"].map((g) => (
                      <button key={g} onClick={() => setGender(g as "male" | "female")}
                        className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                          gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/50"
                        }`}>
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
                <h1 className="text-2xl font-bold text-foreground">Where are you located?</h1>
                <p className="text-muted-foreground mt-1">We use this to find jobs near you.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Street Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Zip Code</label>
                  <input value={zipCode}
                    onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); if (value.length <= 5) setZipCode(value) }}
                    placeholder="12345" maxLength={5}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your education</h1>
                <p className="text-muted-foreground mt-1">Employers love seeing your academic info.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">School</label>
                  <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Your school name"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Unweighted GPA</label>
                  <input type="number" step="0.01" min="0" max="4" value={gpa}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") { setGpa(""); return }
                      if (parseFloat(value) > 4) return
                      setGpa(value)
                    }}
                    placeholder="e.g. 3.5"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <p className="text-xs text-muted-foreground mt-1">You can receive recommendations with a simple email link.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">How can employers reach you?</h1>
                <p className="text-muted-foreground mt-1">Your contact info is only shared with employers you match with.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number</label>
                  <input type="tel" value={phone}
                    onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); if (value.length <= 10) setPhone(value) }}
                    placeholder="10-digit number"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <Card className="border-primary/20 bg-primary/5 mt-2">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Almost done!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      After this we'll take you to your dashboard. You can always change your information and adjust your availability by editing your profile — just hit the icon in the top right and tap profile.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={back} className="flex-1 h-12">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button onClick={next} disabled={!canProceed() || saving} className="flex-1 h-12 text-base font-semibold">
              {saving ? "Saving..." : step === TOTAL_STEPS ? "Finish" : "Continue"}
              {!saving && step < TOTAL_STEPS && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}