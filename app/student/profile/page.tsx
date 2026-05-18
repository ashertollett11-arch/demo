"use client"
import { calculateMatch } from "@/lib/matchScore"
import { useState, useEffect, useRef } from "react"
import { useRouter  } from "next/navigation"
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

    if (!data.user) {
      router.replace("/login")
    }
  }

  checkAuth()
}, [router])


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
  const [saving, setSaving] = useState(false)
  const MAX_INTERESTS = 3
const MAX_JOBS = 3
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
        profile_complete: isProfileComplete,
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
    {/* STICKY SAVE HEADER */}
{/* STICKY SAVE HEADER */}
<div className="sticky top-0 z-50 mb-6">
  <div className="max-w-4xl mx-auto">
    <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4 shadow-lg backdrop-blur">

      <div className="flex flex-col">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Complete Your Profile
        </h2>

        <p className="text-sm text-gray-600">
          Finish your profile so employers can discover you.
        </p>
      </div>

      <Button
        disabled={saving}
        className={`h-11 px-6 text-sm font-semibold shadow-md transition-all ${
          !isProfileComplete
            ? "opacity-60"
            : "hover:scale-[1.03]"
        }`}
        onClick={async () => {
          if (!isProfileComplete) {
            const missingFields = []

            if (!name.trim()) missingFields.push("name")
            if (!age.trim()) missingFields.push("age")
            if (!gpa.trim()) missingFields.push("GPA")
            if (!location.trim()) missingFields.push("location")
            if (!emailRegex.test(email)) missingFields.push("valid email")
            if (!school.trim()) missingFields.push("school")
            if (phone.length !== 10) missingFields.push("phone number")
            if (preferredJobs.length === 0) missingFields.push("preferred jobs")
            if (interests.length === 0) missingFields.push("interests")
            if (!availability.some((d) => d.available)) {
              missingFields.push("availability")
            }

            toast.error("Profile incomplete", {
              description: `Please complete: ${missingFields.join(", ")}`,
            })

            return
          }

          try {
            setSaving(true)

            const success = await saveStudentProfile()

            if (!success) return

         

            router.push("/student?from=profile&saved=true")          } finally {
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
  disabled={!isEditingProfile}
  onChange={(e) => {
    const value = e.target.value

    // allow clearing
    if (value === "") {
      setAge("")
      return
    }

    // ONLY digits allowed
    if (!/^\d+$/.test(value)) return

    // limit to 2 digits max
    if (value.length > 2) return

    const num = parseInt(value)

    // live clamp while typing
    if (num > 21) return

    setAge(value)
  }}
  onBlur={() => {
    // final enforcement when leaving field
    const num = parseInt(age)

    if (isNaN(num)) {
      setAge("")
      return
    }

    if (num < 14) setAge("14")
    if (num > 21) setAge("21")
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

{gpa.trim() === "" && !isGpaLocked && (
  <p className="text-xs text-muted-foreground mt-1">
    Enter your GPA before uploading proof.
  </p>
)}

{showUpload && !isGpaLocked && gpa.trim() !== "" && (
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
{/* GPA Upload Tips */}
<div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
  <p className="font-medium text-foreground text-sm">
    Tips for a successful upload
  </p>

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
              setPreferredJobs((prev) => {
                const alreadySelected = prev.includes(job)
            
                if (alreadySelected) {
                  return prev.filter((j) => j !== job)
                }
            
                if (prev.length >= MAX_JOBS) {
                  toast.error(`You can only select up to ${MAX_JOBS} positions`)
                  return prev
                }
            
                return [...prev, job]
              })
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

      if (interests.length >= MAX_INTERESTS) {
        toast.error(`You can only add up to ${MAX_INTERESTS} interests`)
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

    if (interests.length >= MAX_INTERESTS) return

    setInterests([...interests, trimmed])
    setNewInterest("")
  }}
  placeholder={
    interests.length >= MAX_INTERESTS
      ? `Max ${MAX_INTERESTS} interests reached`
      : "Add interest (e.g. Coding)"
  }
  disabled={interests.length >= MAX_INTERESTS}
  className="w-full border rounded px-2 py-1 text-sm mt-2"
/>

<Button
  className="mt-2 w-full"
  disabled={interests.length >= MAX_INTERESTS}
  onClick={() => {
    const trimmed = newInterest.trim()

    if (!trimmed) return

    if (interests.includes(trimmed)) {
      toast.error("Interest already added")
      return
    }

    if (interests.length >= MAX_INTERESTS) {
      toast.error(`You can only add up to ${MAX_INTERESTS} interests`)
      return
    }

    setInterests([...interests, trimmed])
    setNewInterest("")
  }}
>
  {interests.length >= MAX_INTERESTS
    ? "Max interests reached"
    : "Add Interest"}
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


 {/* Next Button */}
 
 
 

        </CardContent>
      </Card>
      </div>
  </>
)

}