"use client"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Briefcase, Calendar } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useMobileAuth } from "@/hooks/useMobileAuth"

export default function ProfilePage() {
  const router = useRouter()
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
  
      if (!session?.user) {
        router.replace("/login/mobile")
        return
      }
  
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()
  
      if (!roleData || roleData.role !== "student") {
        router.replace("/login/mobile")
      }
    }
  
    checkAuth()
  }, [])
  useEffect(() => {
    const missing = window.location.search.includes("missing=true")
    if (missing) {
      setTimeout(() => {
        toast.error("Please complete your profile before continuing")
      }, 300)
    }
  }, [])

 
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.replace("/login")
    }
    checkAuth()
  }, [router])
  const [isGpaVerified, setIsGpaVerified] = useState(false)
  const [zipCode, setZipCode] = useState("")
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [saving, setSaving] = useState(false)
  const MAX_INTERESTS = 3
  const MAX_JOBS = 3
  const [newInterest, setNewInterest] = useState("")
  const [gpaProofUrl, setGpaProofUrl] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [dob, setDob] = useState("") // YYYY-MM-DD
  const [gpa, setGpa] = useState("")
  const [location, setLocation] = useState("")
  const [isEditingProfile, setIsEditingProfile] = useState(true)
  const [email, setEmail] = useState("")
  const [school, setSchool] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [gpaProof, setGpaProof] = useState<File | null>(null)
  const [gpaStatus, setGpaStatus] = useState("none")

  const JOB_OPTIONS = [
    "Cashier", "Server", "Busser", "Barista", "Cook", "Dishwasher",
    "Host", "Sales Associate", "Stock Associate", "Customer Service", "Store Associate",
  ]

  const showUpload = gpaStatus === "none" || gpaStatus === "rejected" || !gpaProofUrl
  const isGpaLocked =
  gpaStatus === "pending" ||
  gpaStatus === "approved" ||
  !!gpaProofUrl
  const DEFAULT_AVAILABILITY = [
    { day: "Monday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Thursday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Friday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Saturday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "-" },
    { day: "Sunday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "-" },
  ]

  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
  const isDobValid = (() => {
    if (!dob) return false
    const birthDate = new Date(dob)
    const today = new Date()
  
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
  
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
  
    return age >= 14 && age <= 21
  })()
  const isEmailValid = emailRegex.test(email)

  const nameRef = useRef<HTMLInputElement>(null)
  const ageRef = useRef<HTMLInputElement>(null)
  const gpaRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const schoolRef = useRef<HTMLInputElement>(null)
  const interestsRef = useRef<HTMLInputElement>(null)

  const [interests, setInterests] = useState<string[]>(["Music", "Sports", "Gaming"])
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY)
  const [phone, setPhone] = useState("")

  const isProfileComplete =
    name.trim().length > 0 &&
    dob.trim().length > 0 &&
isDobValid &&
    gpa.trim().length > 0 &&
    location.trim().length > 0 &&
    zipCode.trim().length === 5 &&

    emailRegex.test(email) &&
    school.trim().length > 0 &&
    isDobValid&&
    isEmailValid &&
    phone.length === 10 &&
    preferredJobs.length > 0 &&
    interests.length > 0 &&
    availability.some((d) => d.available)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12
    const ampm = i < 12 ? "AM" : "PM"
    return `${hour}:00 ${ampm}`
  })

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user

      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (!authUser) { setLoading(false); return }

      if (authUser.email) setEmail(authUser.email)

      const { data: profileData, error } = await supabase
        .from("Students")
        .select(`
          user_id, name, age, gpa, location, zip_code,
          email, school, phone,
          interests, preferred_jobs, availability,
          shift_preference, dob,
          gpa_proof_path, gpa_proof_url, gpa_verification_status
        `)        .eq("user_id", authUser.id)
        .single()

      if (error) { console.log(error); setLoading(false); return }

      if (profileData) {
        setZipCode(profileData.zip_code || "")
        setGpaProofUrl(profileData.gpa_proof_url || null)
        setName(profileData.name || "")
        setDob(profileData.dob || "")
        setAge(String(profileData.age || ""))
        setGpa(String(profileData.gpa || ""))
        setLocation(profileData.location || "")
        setEmail(profileData.email || authUser.email || "")
        setSchool(profileData.school || "")
        setPhone(profileData.phone || "")
        setPreferredJobs(profileData.preferred_jobs || [])
        setInterests(profileData.interests || [])
        setGpaStatus(profileData.gpa_verification_status || "none")
        const safeAvailability =
          Array.isArray(profileData.availability) && profileData.availability.length === 7
            ? profileData.availability
            : DEFAULT_AVAILABILITY
        setAvailability(safeAvailability)
        setShiftPreference(profileData.shift_preference || "flexible")
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const saveStudentProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
  
    if (!user) {
      toast.error("Not logged in")
      return false
    }
  
    const calculatedAge =
      dob
        ? (() => {
            const birthDate = new Date(dob)
            const today = new Date()
  
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
  
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
  
            return age
          })()
        : null
  
    const { error } = await supabase
      .from("Students")
      .upsert(
        {
          user_id: user.id,
          profile_complete: isProfileComplete,
  
          name,
  
          dob,                      // ✅ stored
          age: calculatedAge,      // ✅ derived + stored
  
          location,
          zip_code: zipCode,
          email,
          school,
          phone,
          interests,
          preferred_jobs: preferredJobs,
          availability,
          shift_preference: shiftPreference,
  
          ...(gpaStatus !== "pending" && gpaStatus !== "approved"
            ? { gpa: Number(gpa) }
            : {}),
        },
        { onConflict: "user_id" }
      )
  
    if (error) {
      console.log(error)
      toast.error(error.message)
      return false
    }
  
    return true
  }

  return (
<div className="min-h-screen bg-slate-950 p-4 text-white">    
          {/* STICKY SAVE HEADER */}
          <div className="sticky top-0 z-50 mb-6 bg-slate-950">
                    <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-xl backdrop-blur gap-3">
            <div className="flex flex-col min-w-0">
            <h2   suppressHydrationWarning
className="text-base sm:text-xl font-bold text-white truncate">
                                Complete Your Profile
              </h2>
              <p className="text-xs sm:text-sm text-white/60 hidden sm:block">
                              Finish your profile so employers can discover you.
              </p>
            </div>

            <Button
              disabled={saving}
              className={`shrink-0 h-10 px-4 text-sm font-semibold rounded-xl shadow-md transition-all ${
                !isProfileComplete
                  ? "opacity-60"
                  : "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90"
              }`}
              onClick={async () => {
                if (!isProfileComplete) {
                  const missingFields = []
                  if (!zipCode.trim()) missingFields.push("Zip code")
                  if (!name.trim()) missingFields.push("Name")
                  if (!dob.trim()) missingFields.push("Date of birth")
                  if (!gpa.trim()) missingFields.push("GPA")
                  if (!location.trim()) missingFields.push("location")
                  if (!emailRegex.test(email)) missingFields.push("Valid email")
                  if (!school.trim()) missingFields.push("School")
                  if (phone.length !== 10) missingFields.push("Phone number")
                  if (preferredJobs.length === 0) missingFields.push("Preferred positions")
                  if (interests.length === 0) missingFields.push("Interests")
                  if (!availability.some((d) => d.available)) missingFields.push("Availability")
                  toast.error("Profile incomplete", {
                    description: `Please complete: ${missingFields.join(", ")}`,
                  })
                  return
                }

                try {
                  setSaving(true)
                  const success = await saveStudentProfile()
                  if (!success) return
                  router.push("/student/mobile")
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-white">
  My Profile
</h1>
      {/* PROFILE INFO */}
      <Card className="mb-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
              <CardTitle className="text-white">
  Profile Info
</CardTitle>        </CardHeader>
        <CardContent className="space-y-2">
        <div className="space-y-1">
        <label className="text-sm font-medium text-white/80">Full Name</label>
  <input
    ref={nameRef}
    value={name}
    onChange={(e) => setName(e.target.value)}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="John Doe"
  />
</div>
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">Date of Birth</label>

  <input
    type="date"
    value={dob}
    suppressHydrationWarning
    onChange={(e) => {
      const value = e.target.value
      setDob(value)

      const birthDate = new Date(value)
      const today = new Date()

      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }

      setAge(String(calculatedAge))
    }}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"  />

  <p className="text-xs text-white/60">
    Must be between 14–21 years old
  </p>
</div>
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">Address</label>
  <input
    value={location}
    onChange={(e) => setLocation(e.target.value)}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="123 Main St"
  />
</div>
          
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">ZIP Code</label>
  <input
    value={zipCode}
    onChange={(e) => {
      const value = e.target.value
      if (/^\d{0,5}$/.test(value)) setZipCode(value)
    }}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="32459"
  />
</div>

<div className="space-y-1">
<label className="text-sm font-medium text-white/80">Email</label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="you@example.com"
  />
</div>
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">Phone Number</label>
  <input
    type="tel"
    value={phone}
    onChange={(e) => {
      const value = e.target.value
      if (/^\d{0,10}$/.test(value)) setPhone(value)
    }}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="8501234567"
  />
</div>
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">School</label>
  <input
    value={school}
    onChange={(e) => setSchool(e.target.value)}
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"    placeholder="Your High School"
  />
</div>
<div className="space-y-1">
<label className="text-sm font-medium text-white/80">GPA</label>
  <input
    type="number"
    step="0.01"
    min="0"
    max="4"
    value={gpa}
    disabled={isGpaLocked}
    onChange={(e) => {
      const value = e.target.value
      if (value === "") { setGpa(""); return }
      if (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) <= 4) setGpa(value)
    }}
    className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
        isGpaLocked ? "opacity-60 cursor-not-allowed" : ""
      }`}
    placeholder="3.5"
  />
</div>

          {gpa.trim() === "" && !isGpaLocked && (
            <p className="text-xs text-white/60 mt-1">
              Enter your GPA before uploading proof.
            </p>
          )}

          {showUpload && !isGpaLocked && gpa.trim() !== "" && (
            <label className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition">
              Upload GPA Image(optional)
              <input
                type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const { data: { session } } = await supabase.auth.getSession()
                  const user = session?.user
                  if (!user) return
                  const filePath = `${user.id}/${Date.now()}-${file.name}`
                  const { error: uploadError } = await supabase.storage.from("gpa-proofs").upload(filePath, file)
                  if (uploadError) { toast.error(uploadError.message); return }
                  const { data } = supabase.storage.from("gpa-proofs").getPublicUrl(filePath)
                  await supabase.from("Students").update({
                    gpa_proof_url: data.publicUrl,
                    gpa_proof_path: filePath,
                    gpa_verification_status: "pending",
                   
                  }).eq("user_id", user.id)
                  const { data: updatedProfile } = await supabase
                  .from("Students")
                  .select("gpa_proof_url, gpa_verification_status")
                  .eq("user_id", user.id)
                  .maybeSingle()
                
                setGpaProofUrl(updatedProfile?.gpa_proof_url || null)
                setGpaStatus(updatedProfile?.gpa_verification_status || "none")
                toast.success("Submitted for review")
                }}
              />
            </label>
          )}

<div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-white/60 space-y-2">
  
  {gpaStatus === "approved" ? (
    <div className="rounded-md bg-green-50 border border-green-200 p-2 text-green-700">
      <p className="font-medium text-sm">
        🎉 Congrats — your GPA is now verified!
      </p>
      <p className="text-[11px] mt-1 text-green-600">
        Employers trust verified students more and you may get better matches.
      </p>
    </div>
  ) : (
    <>
      <p className="font-medium text-foreground text-sm">Tips for a successful upload</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Make sure your full name is visible</li>
        <li>Include your unweighted GPA clearly</li>
        <li>Do not crop or blur the image</li>
        <li>A full screenshot of your school portal works best</li>
      </ul>
      <p className="text-[11px] text-white/60">
        Once submitted, your GPA will be reviewed automatically. Verified students get higher trust and better job matches.
      </p>
    </>
  )}
</div>
        </CardContent>
      </Card>

      {/* PREFERRED JOBS */}
      <Card className="mb-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
  <Briefcase className="h-5 w-5 text-violet-300" />
  Preferred Positions
</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {JOB_OPTIONS.map((job) => {
              const selected = preferredJobs.includes(job)
              return (
                <button
                  key={job}
                  onClick={() => {
                    setPreferredJobs((prev) => {
                      if (prev.includes(job)) return prev.filter((j) => j !== job)
                      if (prev.length >= MAX_JOBS) { toast.error(`You can only select up to ${MAX_JOBS} positions`); return prev }
                      return [...prev, job]
                    })
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    selected ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" : "bg-white/5 text-white/60 border border-white/10"
                  }`}
                >
                  {job}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Select all job types you're interested in.</p>
        </CardContent>
      </Card>

      {/* INTERESTS */}
      <Card className="mb-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
              <CardTitle className="text-lg text-white">
  Interests
</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={interestsRef} value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const trimmed = newInterest.trim()
                if (!trimmed) return
                if (interests.includes(trimmed)) { toast.error("Interest already added"); return }
                if (interests.length >= MAX_INTERESTS) { toast.error(`Max ${MAX_INTERESTS} interests`); return }
                setInterests([...interests, trimmed])
                setNewInterest("")
              }
            }}
            onBlur={() => {
              const trimmed = newInterest.trim()
              if (!trimmed || interests.includes(trimmed) || interests.length >= MAX_INTERESTS) { setNewInterest(""); return }
              setInterests([...interests, trimmed])
              setNewInterest("")
            }}
            placeholder={interests.length >= MAX_INTERESTS ? `Max ${MAX_INTERESTS} interests reached` : "Add interest (e.g. Coding)"}
            disabled={interests.length >= MAX_INTERESTS}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40"          />
        <Button
  className="mt-2 w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-semibold"
  disabled={interests.length >= MAX_INTERESTS}
  onClick={() => {
    const trimmed = newInterest.trim()
    if (!trimmed) return
    if (interests.includes(trimmed)) { toast.error("Interest already added"); return }
    if (interests.length >= MAX_INTERESTS) { toast.error(`Max ${MAX_INTERESTS} interests`); return }
    setInterests([...interests, trimmed])
    setNewInterest("")
  }}
>
  {interests.length >= MAX_INTERESTS ? "Max interests reached" : "Add Interest"}
</Button>
          <div className="flex flex-wrap gap-2 mt-3">
            {interests.map((interest, index) => (
                <Badge
  key={index}
  className="flex items-center gap-1 bg-violet-500/10 text-violet-200 border border-violet-500/20 hover:bg-violet-500/20"
>                {interest}
                <button className="ml-1 text-xs text-red-500" onClick={() => setInterests(interests.filter((_, i) => i !== index))}>×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AVAILABILITY */}
      <Card className="mb-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
  <Calendar className="h-5 w-5 text-violet-300" />
  Availability
</CardTitle>

<p className="text-xs text-white/60 mt-1">
  You can change this anytime in your profile settings.
</p>
        </CardHeader>
        <CardContent>
          <div className="mt-2 mb-4">
            <label className="text-sm font-medium mb-2 block">Shift Preference</label>
            <div className="flex gap-2">
              {["morning", "night", "flexible"].map((type) => (
               <Button
               key={type}
               variant="ghost"
               className={`flex-1 text-xs h-9 rounded-xl border transition-all ${
                 shiftPreference === type
                   ? "bg-violet-500/15 text-violet-200 border-violet-500/30 shadow-sm"
                   : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
               }`}
               onClick={() => setShiftPreference(type as any)}
             >
               {type.charAt(0).toUpperCase() + type.slice(1)}
             </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {availability.map((day, index) => (
              <div key={day.day} className="flex flex-wrap items-center gap-2 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
<span className="text-sm font-medium text-white w-10">
                      {day.day.slice(0, 3)}
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  <select
                    value={day.start}
                    disabled={!day.available}
                    onChange={(e) => {
                      const newAvailability = [...availability]
                      newAvailability[index].start = e.target.value
                      setAvailability(newAvailability)
                    }}
                    className="w-20 text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-900/80 text-white/80 focus:outline-none focus:ring-2 focus:ring-violet-500/40"                  >
                    {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                  <select
                    value={day.end}
                    disabled={!day.available}
                    onChange={(e) => {
                      const newAvailability = [...availability]
                      newAvailability[index].end = e.target.value
                      setAvailability(newAvailability)
                    }}
                    className="w-20 text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-900/80 text-white/80 focus:outline-none focus:ring-2 focus:ring-violet-500/40"                  >
                    {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const newAvailability = [...availability]
                      newAvailability[index].available = !newAvailability[index].available
                      if (!newAvailability[index].available) newAvailability[index].hours = "-"
                      setAvailability(newAvailability)
                    }}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        day.available
                          ? "bg-gradient-to-r from-violet-600/20 to-blue-600/20 text-violet-200 border-violet-500/20"
                          : "bg-slate-800/60 text-white/50 border-white/10"
                      }`}
                  >
                    {day.available ? "Available" : "Unavailable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}