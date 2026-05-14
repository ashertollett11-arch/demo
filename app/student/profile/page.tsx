"use client"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Briefcase, Calendar, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { createStudent, mapDbStudent } from "@/lib/students"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  
  const router = useRouter()
  useEffect(() => {
    const testSession = async () => {
      const sessionResult = await supabase.auth.getSession()
  
      console.log("FULL SESSION RESULT:", sessionResult)
  
      const userResult = await supabase.auth.getUser()
  
      console.log("FULL USER RESULT:", userResult)
    }
  
    testSession()
  }, [])
  
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  // Profile Info  
  const [newInterest, setNewInterest] = useState("")
  const [gpaProofUrl, setGpaProofUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
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
  "Store Associate",
]
const showUpload =
  gpaStatus === "none" ||
  gpaStatus === "rejected" ||
  !gpaProofUrl
  
  const shouldSendGpa =
  (gpaStatus === "rejected" || gpaStatus === "none") && gpaProof
// LOCK LOGIC
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
// 👇 ADD THESE RIGHT HERE
   const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
   const numAge = parseInt(age)
 
   const isAgeValid = !isNaN(numAge) && numAge >= 14 && numAge <= 21
   const isEmailValid = emailRegex.test(email)
  
   
  const [saved, setSaved] = useState(false)
  
  const nameRef = useRef<HTMLInputElement>(null)
  const ageRef = useRef<HTMLInputElement>(null)
  const gpaRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const schoolRef = useRef<HTMLInputElement>(null)
  const jobsRef = useRef<HTMLDivElement>(null)
  const interestsRef = useRef<HTMLInputElement>(null)
  const availabilityRef = useRef<HTMLDivElement>(null)

  const getProfileCompletion = () => ({
    name: !!name,
    age: !!age,
    gpa: !!gpa,
    location: !!location,
    email: !!email,
    school: !!school,
    availability: availability.some(day => day.available),
    preferredJobs: preferredJobs.length > 0,
    interests: interests.length > 0,
  });


  // Interests
  const [interests, setInterests] = useState<string[]>([
    "Music",
    "Sports",
    "Gaming"
  ])

 

  // Preferred Jobs
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const getProfileCompletionMessage = () => {
    const profileCompletion = getProfileCompletion();
    const completed = Object.values(profileCompletion).every(Boolean);
  
    if (completed) {
      return {
        title: "Profile Complete!",
        description: "You're all set. Employers can see your full profile."
      };
    } else {
      const incompleteSections = Object.entries(profileCompletion)
        .filter(([_, done]) => !done)
        .map(([section]) => section.replace(/([A-Z])/g, ' $1').toLowerCase());
        
      return {
        title: "Almost Done!",
        description: `Complete the following to finish your profile: ${incompleteSections.join(", ")}.`
      };
    }
  };
  const [availability, setAvailability] = useState([
    { day: "Monday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Thursday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Friday", start: "9:00 AM", end: "5:00 PM", available: true, hours: "8" },
    { day: "Saturday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "-" },
    { day: "Sunday", start: "9:00 AM", end: "5:00 PM", available: false, hours: "-" },
  ])
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [phone, setPhone] = useState("")
  const isPhoneValid = /^\d{10}$/.test(phone)
 // Check if profile info is fully filled
const isProfileComplete =
name.trim().length > 0 &&
age.trim().length > 0 &&
gpa.trim().length > 0 &&
location.trim().length > 0 &&
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
  
      if (!authUser) {
        setLoading(false)
        return
      }
  
      if (authUser.email) {
        setEmail(authUser.email)
      }
  
      // ✅ FETCH DATA FIRST
      const { data: profileData, error } = await supabase
        .from("Students")
        .select(`
          user_id,
          name,
          age,
          gpa,
          location,
          email,
          school,
          phone,
          interests,
          preferred_jobs,
          availability,
          shift_preference,
            gpa_proof_path,
          gpa_proof_url,
          gpa_verification_status
        `)
        .eq("user_id", authUser.id)
        .single()
  
        console.log("PROFILE FROM DB:", profileData)
        console.log("PROFILE ERROR:", error)

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }
  
      // ✅ NOW SAFE TO USE IT
      if (profileData) {
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
        Array.isArray(profileData.availability) &&
        profileData.availability.length === 7
          ? profileData.availability
          : DEFAULT_AVAILABILITY
      
      setAvailability(safeAvailability)
        setShiftPreference(profileData.shift_preference || "flexible")
      }
  
      setLoading(false)
    }
  
    loadProfile()
  }, [])
 

  useEffect(() => {
    const check = async () => {
      const { data: session } = await supabase.auth.getSession()
      const { data: user } = await supabase.auth.getUser()
  
      console.log("SESSION:", session)
      console.log("USER:", user)
    }
  
    check()
  }, [])
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser()
  
      if (error) {
        console.log(error)
        return
      }
  
      if (!data.user) {
        setTimeout(() => {
          router.push("/login")
        }, 0)
      }
    }
  
    checkUser()
  }, [router])
 
  // Load saved data from localStorage
 
  const saveStudentProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
  
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
  
        name,
        age: Number(age),
        location,
        email,
        school,
        phone,
        interests,
        preferred_jobs: preferredJobs,
        availability,
        shift_preference: shiftPreference,
  
        // 👇 ONLY allow GPA edit if NOT locked
        ...(gpaStatus !== "pending" && gpaStatus !== "approved"
          ? { gpa: Number(gpa) }
          : {}),
  
        // 👇 ONLY allow GPA upload overwrite if not approved
        ...(gpaStatus === "rejected" || gpaStatus === "none"
          ? {
              gpa_proof_url: gpaProofUrl,
              gpa_verification_status: gpaStatus,
            }
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
    <>
 
    
    <div className="min-h-screen bg-background p-4 sm:p-8">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-4">
  
        
        
        
        {/* Next Button */}
        <Button
  className={!isProfileComplete ? "opacity-50 cursor-not-allowed" : ""}
  onClick={async () => {

    // ✅ THIS IS THE KEY FIX
    if (!name.trim()) {
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      nameRef.current?.focus()
      toast.error("Please enter your name")
      return
    }
    
    if (!age.trim() || !isAgeValid) {
      ageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      ageRef.current?.focus()
      toast.error("Please enter a valid age")
      return
    }
    
    if (!gpa.trim()) {
      gpaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      gpaRef.current?.focus()
      toast.error("Please enter your GPA")
      return
    }
    
    if (!location.trim()) {
      locationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      locationRef.current?.focus()
      toast.error("Please enter your address")
      return
    }
    
    if (!emailRegex.test(email)) {
      emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      emailRef.current?.focus()
      toast.error("Please enter a valid email")
      return
    }
    
    if (!/^\d{10}$/.test(phone)) {
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      phoneRef.current?.focus()
      toast.error("Please enter a valid phone number")
      return
    }
    
    if (!school.trim()) {
      schoolRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      schoolRef.current?.focus()
      toast.error("Please enter your school")
      return
    }
    
    if (preferredJobs.length === 0) {
      jobsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      toast.error("Select at least one preferred positions")
      return
    }
    
    if (interests.length === 0) {
      interestsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      interestsRef.current?.focus()
      toast.error("Add at least one interest")
      return
    }
    
    if (!availability.some((d) => d.available)) {
      availabilityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      toast.error("Please add availability")
      return
    }
    // 👇 everything below stays EXACTLY the same
    // 👇 if everything passes, continue normal flow

    // ---- rest of your existing logic stays exactly the same ----
 
    const { data: { session } } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    toast.error("Not logged in")
    return
  }
 
  let proofUrl = null

  if (shouldSendGpa) {
    const safeName = gpaProof!.name.replace(/\s/g, "-")
    const filePath = `${user.id}/${Date.now()}-${safeName}`
  
    const { error: uploadError } = await supabase.storage
      .from("gpa-proofs")
      .upload(filePath, gpaProof!, {
        contentType: gpaProof!.type,
        upsert: false,
      })
  
    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError)
      toast.error(uploadError.message)
      return
    }
  
    const { data } = supabase.storage
      .from("gpa-proofs")
      .getPublicUrl(filePath)
  
    proofUrl = data.publicUrl
  }

  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    toast.error("Invalid Phone Number", {
      description: "Phone number must be exactly 10 digits.",
    })
    return
  }

  if (!emailRegex.test(email)) {
    toast.error("Invalid Email", {
      description: "Please enter a valid email.",
    })
    return
  }

  if (isNaN(numAge) || numAge < 14 || numAge > 21) {
    toast.error("Invalid Age", {
      description: "Age must be between 14 and 21.",
    })
    return
  }

  if (!name || !age || !gpa || !location || !email || !school) {
    toast.warning("Profile Incomplete", {
      description: "Please fill out all required fields.",
    })
    return
  }

  await createStudent({
    user_id: session.user.id,
    name,
    age: Number(age),
    gpa: Number(gpa),
    location,
    email,
    school,
    phone,
    interests,
    preferred_jobs: preferredJobs,
    availability,
    shift_preference: shiftPreference,
  })




  const { error } = await supabase
  .from("Students")
  .upsert(
    {
      user_id: user.id,

      name,
      age: Number(age),
      location,
      email,
      school,
      phone,
      interests,
      preferred_jobs: preferredJobs,
      availability,
      shift_preference: shiftPreference,

      // 👇 ONLY allow GPA edit if NOT locked
      ...(gpaStatus !== "pending" && gpaStatus !== "approved"
        ? { gpa: Number(gpa) }
        : {}),

      // 👇 ONLY allow GPA upload overwrite if not approved
      ...(gpaStatus === "rejected" || gpaStatus === "none"
        ? {
            gpa_proof_url: gpaProofUrl,
            gpa_verification_status: gpaStatus,
          }
        : {}),
    },
    { onConflict: "user_id" }
  )

if (error) {
  console.log("SUPABASE ERROR:", error)
toast.error(error.message)
  return
}

// 🔥 FORCE REFRESH UPDATED PROFILE
const { data: refreshedProfile } = await supabase
  .from("Students")
  .select("*")
  .eq("user_id", user.id)
  .single()

if (refreshedProfile) {
  setPreferredJobs(refreshedProfile.preferred_jobs || [])
  setInterests(refreshedProfile.interests || [])
  setAvailability(refreshedProfile.availability || [])
  setShiftPreference(refreshedProfile.shift_preference || "flexible")
}

router.push("/student")
}}
>
  Save and contuine to dashbaord
</Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      {/* Profile Info */}
      <Card className="border-border bg-card mb-4">
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          
          
          <input
            ref={nameRef}
            value={name}
            disabled={!isEditingProfile}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Full Name"
          />

<input
  type="text"
  ref={ageRef}
  value={age}
  disabled={!isEditingProfile || gpaStatus === "approved"}  
  onChange={(e) => {
    const value = e.target.value

    // allow clearing
    if (value === "") {
      setAge("")
      return
    }

    // only digits
    if (!/^\d+$/.test(value)) return

    // limit length (prevents nonsense like 999)
    if (value.length <= 2) {
      setAge(value)
    }
  }}
  className="w-full border rounded px-2 py-1 text-sm"
  placeholder="Age"
/>

          <input
           ref={locationRef}
           value={location}
            disabled={!isEditingProfile}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Address"
          />

          <input
           ref={emailRef}
           type="email"
            value={email}
            disabled={!isEditingProfile}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Email"
          />

<input
  type="tel"
  ref={phoneRef}
  value={phone}
  disabled={!isEditingProfile}
  onChange={(e) => {
    const value = e.target.value

    if (value === "") {
      setPhone("")
      return
    }

    // ONLY digits, max 10
    if (/^\d{0,10}$/.test(value)) {
      setPhone(value)
    }
  }}
  className="w-full border rounded px-2 py-1 text-sm"
  placeholder="Phone Number"
/>


          <input
            ref={schoolRef}
            value={school}
            disabled={!isEditingProfile}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="School"
          />

       
         
{/* GPA FIELD */}
<input
  type="number"
  step="0.01"
  min="0"
  max="4"
  ref={gpaRef}
  value={gpa}
  disabled={!isEditingProfile || isGpaLocked}
  onChange={(e) => {
    const value = e.target.value

    if (value === "") {
      setGpa("")
      return
    }

    if (/^\d*\.?\d{0,2}$/.test(value)) {
      if (parseFloat(value) <= 4) {
        setGpa(value)
      }
    }
  }}
  className={`w-full border rounded px-2 py-1 text-sm ${
    isGpaLocked ? "bg-gray-100 opacity-70 cursor-not-allowed" : ""
  }`}
  placeholder="GPA"
/>
{gpaStatus === "pending" && (
  <div className="rounded border p-3 bg-yellow-50 text-yellow-700 text-sm">
    ⏳ Your GPA is under review. You cannot upload a new image yet.
  </div>
)}

{gpaStatus === "approved" && (
  <div className="rounded border p-3 bg-green-50 text-green-700 text-sm">
    🎉 Your GPA has been verified.
  </div>
)}

{gpaStatus === "rejected" && (
  <div className="rounded border p-3 bg-red-50 text-red-700 text-sm">
    ❌ Your submission was rejected. Please re-upload.
  </div>
)}

{gpaProofUrl && (
  <div className="text-sm p-2 border rounded bg-gray-50">
    📄 GPA uploaded:{" "}
    <a
      href={gpaProofUrl}
      target="_blank"
      className="text-blue-600 underline"
    >
      View file
    </a>
  </div>
)}


{showUpload && !isGpaLocked && (
    <label className="flex w-full items-center justify-center rounded border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
    Upload GPA Image
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        const filePath = `${user.id}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from("gpa-proofs")
          .upload(filePath, file)

        if (uploadError) {
          toast.error(uploadError.message)
          return
        }

        const { data } = supabase.storage
          .from("gpa-proofs")
          .getPublicUrl(filePath)

        const publicUrl = data.publicUrl

        await supabase
        .from("Students")
        .update({
          gpa_proof_url: publicUrl,
          gpa_proof_path: filePath,
          gpa_verification_status: "pending",
          is_gpa_verified: false,
        })
          .eq("user_id", user.id)

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

<Button
  className="w-full mt-2"
  onClick={async () => {
    const success = await saveStudentProfile()

    if (!success) return

    toast.success("Saved!", {
      description: "Your profile has been updated.",
    })
  }}
>
  Save
</Button>
        </CardContent>
      </Card>

   {/* Preferred Jobs */}
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
              setPreferredJobs((prev) =>
                prev.includes(job)
                  ? prev.filter((j) => j !== job)
                  : [...prev, job]
              )
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              selected
                ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {job}
          </button>
        )
      })}
    </div>

    {/* optional helper text */}
    <p className="text-xs text-muted-foreground mt-2">
      Select all job types you're interested in.
    </p>
  </CardContent>
</Card>

      {/* Interests */}
      <input
 ref={interestsRef}
 value={newInterest}
  onChange={(e) => setNewInterest(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault()

      const trimmed = newInterest.trim()
      if (!trimmed) return

      if (interests.includes(trimmed)) {
        toast.error("Interest already added")
        return
      }

      setInterests([...interests, trimmed])
      setNewInterest("")
    }
  }}
  onBlur={() => {
    const trimmed = newInterest.trim()

    if (!trimmed) return

    if (interests.includes(trimmed)) {
      setNewInterest("")
      return
    }

    setInterests([...interests, trimmed])
    setNewInterest("")
  }}
  placeholder="Add interest (e.g. Coding)"
  className="w-full border rounded px-2 py-1 text-sm mt-2"
/>
<Button
  className="mt-2 w-full"
  onClick={() => {
    const trimmed = newInterest.trim()

    if (!trimmed) return

    if (interests.includes(trimmed)) {
      toast.error("Interest already added")
      return
    }

    setInterests([...interests, trimmed])
    setNewInterest("")
  }}
>
  Add Interest
</Button>
<div className="flex flex-wrap gap-2 mt-3">
  {interests.map((interest, index) => (
    <Badge
      key={index}
      variant="secondary"
      className="flex items-center gap-1"
    >
      {interest}
      <button
        className="ml-1 text-xs text-red-500"
        onClick={() => {
          setInterests(interests.filter((_, i) => i !== index))
        }}
      >
        ×
      </button>
    </Badge>
  ))}
</div>
<div className="h-6" />


      {/* Availability */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" /> Availability
          </CardTitle>
        </CardHeader>
        <CardContent>

        <div className="mt-4">
  <label className="text-sm font-medium mb-2 block">
    Shift Preference
  </label>

  <div className="flex gap-2">
  <Button
  variant={shiftPreference === "morning" ? "default" : "outline"}
  onClick={() => setShiftPreference("morning")}
>
  Morning
</Button>

<Button
  variant={shiftPreference === "night" ? "default" : "outline"}
  onClick={() => setShiftPreference("night")}
>
  Night
</Button>

<Button
  variant={shiftPreference === "flexible" ? "default" : "outline"}
  onClick={() => setShiftPreference("flexible")}
>
  Flexible
</Button>
  </div>
</div>

        <div className="space-y-2">
  {availability.map((day, index) => {
    return (
      <div
        key={day.day}
       className="flex items-center justify-between gap-2 rounded-xl p-3 border bg-white hover:bg-gray-50 transition-all"
      >
        <span className="text-sm font-medium text-gray-700 w-12">
          {day.day.slice(0, 3)}
        </span>

        <div className="flex gap-1">
          <select
            value={day.start}
            disabled={!day.available}
            onChange={(e) => {
              const newAvailability = [...availability]
              newAvailability[index].start = e.target.value
              setAvailability(newAvailability)
            }}
             
            
            className="w-24 text-xs px-2 py-1 rounded-full border bg-white text-gray-700"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>

          <select
            value={day.end}
            disabled={!day.available}
            onChange={(e) => {
              const newAvailability = [...availability]
              newAvailability[index].end = e.target.value
              setAvailability(newAvailability)
            
            
            }}
            className="w-24 text-xs px-2 py-1 rounded-full border bg-white text-gray-700"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>

          <button
           onClick={ () => {
              const newAvailability = [...availability]
              newAvailability[index].available = !newAvailability[index].available
              if (!newAvailability[index].available) newAvailability[index].hours = "-"
              
              setAvailability(newAvailability)
            
              // Save profile info
   

              
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
    )
  })}
</div>

<Button
  className="w-full mt-2"
  onClick={async () => {
    const success = await saveStudentProfile()

    if (!success) return

    toast.success("Saved!", {
      description: "Your availability has been updated.",
    })
  }}
>
  Save
</Button>

 {/* Next Button */}
 
 
 

        </CardContent>
      </Card>
      </div>
  </>
)

}