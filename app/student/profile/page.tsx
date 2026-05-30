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

export default function ProfilePage() {
  const router = useRouter()

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
  const [zipCode, setZipCode] = useState("")
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [saving, setSaving] = useState(false)
  const MAX_INTERESTS = 3
  const MAX_JOBS = 3
  const [newInterest, setNewInterest] = useState("")
  const [gpaProofUrl, setGpaProofUrl] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
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
  const isGpaLocked = gpaStatus === "pending" || gpaStatus === "approved" || !!gpaProofUrl

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
  const numAge = parseInt(age)
  const isAgeValid = !isNaN(numAge) && numAge >= 14 && numAge <= 21
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
    age.trim().length > 0 &&
    gpa.trim().length > 0 &&
    location.trim().length > 0 &&
    zipCode.trim().length === 5 &&

    emailRegex.test(email) &&
    school.trim().length > 0 &&
    isAgeValid &&
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
          shift_preference,
          gpa_proof_path, gpa_proof_url, gpa_verification_status
        `)        .eq("user_id", authUser.id)
        .single()

      if (error) { console.log(error); setLoading(false); return }

      if (profileData) {
        setZipCode(profileData.zip_code || "")
        setGpaProofUrl(profileData.gpa_proof_url || null)
        setName(profileData.name || "")
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
  
    const { error } = await supabase
      .from("Students")
      .upsert(
        {
          user_id: user.id,
          profile_complete: isProfileComplete,
          name,
          age: Number(age),
          location,
          zip_code: zipCode,   // ✅ REQUIRED
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
<div className="min-h-screen bg-background p-4">
      {/* STICKY SAVE HEADER */}
      <div className="sticky top-0 z-50 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-3 shadow-lg backdrop-blur gap-3">
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                Complete Your Profile
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Finish your profile so employers can discover you.
              </p>
            </div>

            <Button
              disabled={saving}
              className={`shrink-0 h-10 px-4 text-sm font-semibold shadow-md transition-all ${
                !isProfileComplete ? "opacity-60" : "hover:scale-[1.03]"
              }`}
              onClick={async () => {
                if (!isProfileComplete) {
                  const missingFields = []
                  if (!zipCode.trim()) missingFields.push("zip code")
                  if (!name.trim()) missingFields.push("name")
                  if (!age.trim()) missingFields.push("age")
                  if (!gpa.trim()) missingFields.push("GPA")
                  if (!location.trim()) missingFields.push("location")
                  if (!emailRegex.test(email)) missingFields.push("valid email")
                  if (!school.trim()) missingFields.push("school")
                  if (phone.length !== 10) missingFields.push("phone number")
                  if (preferredJobs.length === 0) missingFields.push("preferred positions")
                  if (interests.length === 0) missingFields.push("interests")
                  if (!availability.some((d) => d.available)) missingFields.push("availability")
                  toast.error("Profile incomplete", {
                    description: `Please complete: ${missingFields.join(", ")}`,
                  })
                  return
                }

                try {
                  setSaving(true)
                  const success = await saveStudentProfile()
                  if (!success) return
                  router.push("/student?from=profile&saved=true")
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

      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      {/* PROFILE INFO */}
      <Card className="border-border bg-card mb-4">
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            ref={nameRef} value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Full Name"
          />
          <input
            type="text" ref={ageRef} value={age}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") { setAge(""); return }
              if (!/^\d+$/.test(value)) return
              if (value.length > 2) return
              if (parseInt(value) > 21) return
              setAge(value)
            }}
            onBlur={() => {
              const num = parseInt(age)
              if (isNaN(num)) { setAge(""); return }
              if (num < 14) setAge("14")
              if (num > 21) setAge("21")
            }}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Age"
          />
          <input
            ref={locationRef} value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Address"
          />
          
          <input
  value={zipCode}
  onChange={(e) => {
    const value = e.target.value
    if (/^\d{0,5}$/.test(value)) setZipCode(value)
  }}
  className="w-full border rounded px-3 py-2 text-sm"
  placeholder="ZIP Code"
/>

          <input
            ref={emailRef} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Email"
          />
          <input
            type="tel" ref={phoneRef} value={phone}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") { setPhone(""); return }
              if (/^\d{0,10}$/.test(value)) setPhone(value)
            }}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Phone Number"
          />
          <input
            ref={schoolRef} value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="School(Put Most Recent School Atented)"
          />
          <input
            type="number" step="0.01" min="0" max="4"
            ref={gpaRef} value={gpa}
            disabled={isGpaLocked}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") { setGpa(""); return }
              if (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) <= 4) setGpa(value)
            }}
            className={`w-full border rounded px-3 py-2 text-sm ${isGpaLocked ? "bg-gray-100 opacity-70 cursor-not-allowed" : ""}`}
            placeholder="GPA(Unweighted)"
          />

          {gpa.trim() === "" && !isGpaLocked && (
            <p className="text-xs text-muted-foreground mt-1">
              Enter your GPA before uploading proof.
            </p>
          )}

          {showUpload && !isGpaLocked && gpa.trim() !== "" && (
            <label className="flex w-full items-center justify-center rounded border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
              Upload GPA Image
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
                    is_gpa_verified: false,
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

          <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground text-sm">Tips for a successful upload</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Make sure your full name is visible</li>
              <li>Include your unweighted GPA clearly</li>
              <li>Do not crop or blur the image</li>
              <li>A full screenshot of your school portal works best</li>
            </ul>
            <p className="text-[11px] text-muted-foreground/80">
              Once submitted, your GPA will be reviewed automatically. Verified students get higher trust and better job matches.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PREFERRED JOBS */}
      <Card className="border-border bg-card mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
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
                    selected ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm" : "bg-gray-100 text-gray-600 border-gray-200"
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
      <Card className="border-border bg-card mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Interests</CardTitle>
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
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <Button
            className="mt-2 w-full"
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
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {interest}
                <button className="ml-1 text-xs text-red-500" onClick={() => setInterests(interests.filter((_, i) => i !== index))}>×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AVAILABILITY */}
      <Card className="border-border bg-card mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" /> Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-2 mb-4">
            <label className="text-sm font-medium mb-2 block">Shift Preference</label>
            <div className="flex gap-2">
              {["morning", "night", "flexible"].map((type) => (
                <Button
                  key={type}
                  variant={shiftPreference === type ? "default" : "outline"}
                  className="flex-1 text-xs h-9"
                  onClick={() => setShiftPreference(type as any)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {availability.map((day, index) => (
              <div key={day.day} className="flex flex-wrap items-center gap-2 rounded-xl p-3 border bg-white hover:bg-gray-50 transition-all">
                <span className="text-sm font-medium text-gray-700 w-10">
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
                    className="w-20 text-xs px-1 py-1 rounded-full border bg-white text-gray-700"
                  >
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
                    className="w-20 text-xs px-1 py-1 rounded-full border bg-white text-gray-700"
                  >
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
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
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