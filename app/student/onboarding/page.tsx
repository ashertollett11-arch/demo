"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { authedFetch } from "@/lib/authedFetch"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

const TOTAL_STEPS = 6

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

/**
 * Onboarding asks which days, not which hours. Picking seven start/end times
 * is a lot to ask before anyone has seen a single job, so every chosen day is
 * stored as a broad 10am-10pm window and students narrow it later in their
 * profile. The matcher reads `available`, `start` and `end`, so a wide window
 * over-matches slightly rather than hiding jobs — the safe direction to err.
 */
/**
 * One window applied to every chosen day. Picking seven start/end pairs
 * before seeing a single job is far too much to ask, so onboarding offers
 * three shapes and the profile editor handles anything more precise.
 *
 * `pref` also sets Students.shift_preference, which the matcher reads and
 * which used to be hardcoded to "flexible" for everyone.
 */
const TIME_PRESETS = [
  { id: "morning", label: "Mornings", hint: "5:00 AM – 12:00 PM", start: "5:00 AM", end: "12:00 PM", hours: "7", pref: "morning" },
  { id: "allday", label: "All day", hint: "10:00 AM – 10:00 PM", start: "10:00 AM", end: "10:00 PM", hours: "12", pref: "flexible" },
  { id: "night", label: "Evenings", hint: "3:00 PM – 10:00 PM", start: "3:00 PM", end: "10:00 PM", hours: "7", pref: "night" },
] as const

/** Everything on step 6 arrives pre-filled so it costs one tap to accept. */
const INTEREST_OPTIONS = [
  "School", "Hanging out with friends", "Sports", "Music", "Gaming", "Art",
  "Fitness", "Cooking", "Reading", "Photography", "Outdoors", "Volunteering",
]
const JOB_OPTIONS = [
  "Cashier", "Server", "Busser", "Barista", "Cook", "Dishwasher", "Host/Hostess", "Food Runner", "Ice Cream Scooper",
  "Sales Associate", "Stock Associate", "Bagger", "Fitting Room Attendant", "Cart Attendant",
  "Customer Service", "Front Desk", "Receptionist",
  "Lifeguard", "Camp Counselor", "Theme Park Attendant", "Movie Theater Attendant", "Bowling Alley Attendant",
  "Car Wash Attendant", "Car Detailer",
  "Tutor", "Library Assistant", "Office Assistant",
]
const MAX_PICKS = 3

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
  const [availDays, setAvailDays] = useState<string[]>([])
  const [timePreset, setTimePreset] = useState<string>("allday")
  const [interests, setInterests] = useState<string[]>(["School", "Hanging out with friends"])
  const [preferredJobs, setPreferredJobs] = useState<string[]>(["Busser", "Customer Service", "Dishwasher"])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login?redirect=/student/onboarding"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
      const { data: existing } = await supabase.from("Students")
        .select("name, age, gender, location, zip_code, school, gpa, email, phone").eq("user_id", user.id).maybeSingle()
      if (existing) {
        if (existing.age) setAge(String(existing.age))
        if (existing.gender) setGender(existing.gender)
        if (existing.location) setAddress(existing.location)
        if (existing.zip_code) setZipCode(existing.zip_code)
        if (existing.school) setSchool(existing.school)
        if (existing.gpa) setGpa(String(existing.gpa))
        if (existing.phone) setPhone(existing.phone)
      }
      // Fall back to the signed-in account for email and name. These were
      // previously only read when no Students row existed, but /choose-role
      // always inserts one, so the fallback never ran and the email field
      // started empty even though we already knew it.
      setEmail(existing?.email || user.email || "")
      setName(existing?.name || user.user_metadata?.full_name || "")
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
  const zipRegex = /^\d{5}$/

  const canProceed = () => {
    switch (step) {
      case 1: const n = parseInt(age); return name.trim().length > 0 && !isNaN(n) && n >= 14 && n <= 21 && gender !== ""
      case 2: return address.trim().length > 0 && zipRegex.test(zipCode)
      case 3: const g = parseFloat(gpa); return school.trim().length > 0 && gpa.trim().length > 0 && !isNaN(g) && g >= 0 && g <= 4
      case 4: return emailRegex.test(email) && phone.length === 10
      case 5: return availDays.length > 0
      case 6: return interests.length > 0 && preferredJobs.length > 0
      default: return false
    }
  }

  const handleFinish = async () => {
    if (!canProceed()) return
    setSaving(true)
    finishedRef.current = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    // Built from what they actually picked in step 5. This used to be a fixed
    // weekends-only block written for everyone, so every student looked
    // identical to the matcher no matter when they could really work.
    const preset = TIME_PRESETS.find(p => p.id === timePreset) ?? TIME_PRESETS[1]
    const chosenAvailability = DAYS.map((day) => {
      const available = availDays.includes(day)
      return { day, start: preset.start, end: preset.end, available, hours: available ? preset.hours : "-" }
    })
    const { error } = await supabase.from("Students").upsert({
      user_id: user.id, name, age: Number(age), gender,
      location: address, zip_code: zipCode, school, gpa: Number(gpa), email, phone,
      availability: chosenAvailability, shift_preference: preset.pref,
      interests, preferred_jobs: preferredJobs,
      profile_complete: true,
    }, { onConflict: "user_id" })
    if (error) { toast.error("Failed to save. Please try again."); setSaving(false); return }
    // Jobs are filtered by stored distance, so if this fails the student lands
    // on an empty board. Say so rather than letting it look like "no jobs".
    let distancesOk = false
    try {
      const res = await authedFetch("/api/calculate-distances", {
        method: "POST",
        body: JSON.stringify({ studentUserId: user.id }),
      })
      const body = await res.json().catch(() => null)
      distancesOk = res.ok && (body?.calculated ?? 0) > 0
    } catch {
      distancesOk = false
    }

    // Welcome email. Deliberately not awaited into the happy path: a mail
    // failure must not block someone finishing onboarding, and the route
    // records what it sent so a retry can't double-send.
    authedFetch("/api/send-welcome-email", { method: "POST" }).catch(() => {})

    if (distancesOk) {
      toast.success("Welcome to SimplyApply!")
    } else {
      toast.warning("We couldn't find jobs near you yet", {
        description: "Your profile is saved. Check that your address and zip are correct, or try again shortly.",
      })
    }
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
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 1 of 5</p>
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
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 2 of 5</p>
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
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 3 of 5</p>
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
                    onChange={(e) => { const v = e.target.value; if (v === "") { setGpa(""); return } const n = parseFloat(v); if (n > 4 || n < 0) return; setGpa(v) }}
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
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 4 of 5</p>
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

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 5 of 6</p>
                <h1 className="text-3xl font-bold text-foreground">When can you work?</h1>
                <p className="text-muted-foreground mt-2">Tap the days you&apos;re usually free.</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {DAYS.map((day) => {
                  const on = availDays.includes(day)
                  return (
                    <button key={day} type="button" role="switch" aria-checked={on}
                      onClick={() => setAvailDays(prev => on ? prev.filter(d => d !== day) : [...prev, day])}
                      className={`py-3.5 rounded-2xl border text-sm font-semibold transition-all ${on ? "bg-foreground text-background border-foreground" : "bg-secondary/40 border-border text-foreground"}`}>
                      {day}
                    </button>
                  )
                })}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">What time, roughly?</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {TIME_PRESETS.map((p) => {
                    const on = timePreset === p.id
                    return (
                      <button key={p.id} type="button" role="radio" aria-checked={on}
                        onClick={() => setTimePreset(p.id)}
                        className={`py-3 px-2 rounded-2xl border transition-all ${on ? "bg-foreground text-background border-foreground" : "bg-secondary/40 border-border text-foreground"}`}>
                        <span className="block text-sm font-semibold">{p.label}</span>
                        <span className={`block text-[11px] mt-0.5 ${on ? "text-background/70" : "text-muted-foreground"}`}>{p.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                This applies to every day you picked. You can set exact hours for each day in your profile whenever you like.
              </p>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step 6 of 6</p>
                <h1 className="text-3xl font-bold text-foreground">A bit about you</h1>
                <p className="text-muted-foreground mt-2">We&apos;ve filled these in — change anything that isn&apos;t right.</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Interests{" "}
                  <span className={`font-normal ${interests.length >= MAX_PICKS ? "text-primary" : "text-muted-foreground"}`}>
                    {interests.length} of {MAX_PICKS}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((item) => {
                    const on = interests.includes(item)
                    return (
                      <button key={item} type="button" aria-pressed={on}
                        onClick={() => setInterests(prev =>
                          on ? prev.filter(i => i !== item) : prev.length >= MAX_PICKS ? prev : [...prev, item])}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${on ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Jobs you&apos;d like{" "}
                  <span className={`font-normal ${preferredJobs.length >= MAX_PICKS ? "text-primary" : "text-muted-foreground"}`}>
                    {preferredJobs.length} of {MAX_PICKS}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {JOB_OPTIONS.map((role) => {
                    const on = preferredJobs.includes(role)
                    return (
                      <button key={role} type="button" aria-pressed={on}
                        onClick={() => setPreferredJobs(prev =>
                          on ? prev.filter(r => r !== role) : prev.length >= MAX_PICKS ? prev : [...prev, role])}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${on ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                        {role}
                      </button>
                    )
                  })}
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