"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Briefcase, AlertTriangle, Star, ChevronRight, ChevronLeft, X, Check } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const router = useRouter()
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [shiftPreference, setShiftPreference] = useState<"morning" | "night" | "flexible">("flexible")
  const [saving, setSaving] = useState(false)
  const [isLooking, setIsLooking] = useState(true)

  // Editing state — which field is open
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const MAX_INTERESTS = 3
  const MAX_JOBS = 3
  const [newInterest, setNewInterest] = useState("")
  const [gpaProofUrl, setGpaProofUrl] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gpa, setGpa] = useState("")
  const [location, setLocation] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [email, setEmail] = useState("")
  const [school, setSchool] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [gpaStatus, setGpaStatus] = useState("none")
  const [recommenderName, setRecommenderName] = useState("")
  const [recommenderEmail, setRecommenderEmail] = useState("")
  const [recommenderRelationship, setRecommenderRelationship] = useState("")
  const [recommendation, setRecommendation] = useState<any>(null)
  const [sendingRec, setSendingRec] = useState(false)

  const JOB_OPTIONS = ["Cashier","Server","Busser","Barista","Cook","Dishwasher","Host","Sales Associate","Stock Associate","Customer Service","Store Associate"]
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
  const zipRegex = /^\d{5}$/
  const numAge = parseInt(age)
  const isAgeValid = !isNaN(numAge) && numAge >= 14 && numAge <= 21
  const isEmailValid = emailRegex.test(email)

  const nameRef = useRef<HTMLInputElement>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY)
  const [phone, setPhone] = useState("")

  const isProfileComplete =
    name.trim().length > 0 &&
    age.trim().length > 0 &&
    gpa.trim().length > 0 &&
    location.trim().length > 0 &&
    zipRegex.test(zipCode) &&
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
    const missing = window.location.search.includes("missing=true")
    if (missing) setTimeout(() => { toast.error("Please complete your profile before continuing") }, 300)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "student") { router.replace("/login"); return }
    }
    checkAuth()
  }, [router])

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
        .select(`user_id, name, age, gpa, location, zip_code, email, school, phone, interests, preferred_jobs, availability, shift_preference, gpa_proof_url, gpa_verification_status, is_looking`)
        .eq("user_id", authUser.id)
        .single()
      if (error) { setLoading(false); return }
      if (profileData) {
        setGpaProofUrl(profileData.gpa_proof_url || null)
        setName(profileData.name || "")
        setAge(String(profileData.age || ""))
        setGpa(String(profileData.gpa || ""))
        setLocation(profileData.location || "")
        setZipCode(profileData.zip_code || "")
        setEmail(profileData.email || authUser.email || "")
        setSchool(profileData.school || "")
        setPhone(profileData.phone || "")
        setPreferredJobs(profileData.preferred_jobs || [])
        setInterests(profileData.interests || [])
        setGpaStatus(profileData.gpa_verification_status || "none")
        setIsLooking(profileData.is_looking !== false)
        const safeAvailability = Array.isArray(profileData.availability) && profileData.availability.length === 7
          ? profileData.availability : DEFAULT_AVAILABILITY
        setAvailability(safeAvailability)
        setShiftPreference(profileData.shift_preference || "flexible")
      }
      const { data: rec } = await supabase.from("recommendations").select("*").eq("student_user_id", authUser.id).maybeSingle()
      if (rec) {
        setRecommendation(rec)
        setRecommenderName(rec.recommender_name || "")
        setRecommenderEmail(rec.recommender_email || "")
        setRecommenderRelationship(rec.recommender_relationship || "")
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const saveStudentProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) { toast.error("Not logged in"); return false }
    const { error } = await supabase.from("Students").upsert({
      user_id: user.id,
      profile_complete: isProfileComplete,
      name, age: Number(age), location, zip_code: zipCode, email, school, phone,
      interests, preferred_jobs: preferredJobs, availability,
      shift_preference: shiftPreference,
      is_looking: isLooking,
      ...(gpaStatus !== "pending" && gpaStatus !== "approved" ? { gpa: Number(gpa) } : {}),
      ...(gpaStatus === "rejected" || gpaStatus === "none" ? { gpa_proof_url: gpaProofUrl, gpa_verification_status: gpaStatus } : {}),
    }, { onConflict: "user_id" })
    if (error) { toast.error(error.message); return false }
    await fetch("/api/calculate-distances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentUserId: user.id }),
    }).catch(() => {})
    return true
  }

  const sendRecommendationRequest = async () => {
    if (!recommenderName.trim()) { toast.error("Enter recommender name"); return }
    if (!recommenderEmail.trim()) { toast.error("Enter recommender email"); return }
    if (!recommenderRelationship) { toast.error("Select relationship"); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSendingRec(true)
    const res = await fetch("/api/send-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentUserId: user.id, studentName: name, recommenderName, recommenderEmail, relationship: recommenderRelationship }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Failed to send request."); setSendingRec(false); return }
    toast.success(`Recommendation request sent to ${recommenderName}!`)
    const { data: rec } = await supabase.from("recommendations").select("*").eq("student_user_id", user.id).maybeSingle()
    if (rec) setRecommendation(rec)
    setSendingRec(false)
  }

  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setDeleting(true)
    try {
      const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed to delete account."); setDeleting(false); return }
      supabase.auth.signOut().finally(() => { window.location.href = "/login" })
    } catch { toast.error("Something went wrong."); setDeleting(false) }
  }

  const handleSwitchRole = async () => {
    setSwitching(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSwitching(false); return }
    try {
      const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed to switch role."); setSwitching(false); return }
      supabase.auth.signOut().finally(() => { window.location.href = "/choose-role" })
    } catch { toast.error("Something went wrong."); setSwitching(false) }
  }

  // Open a field for inline editing
  const openEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const closeEdit = () => { setEditingField(null); setEditValue("") }

  const commitEdit = (field: string, value: string) => {
    switch (field) {
      case "name":
        if (!value.trim()) { toast.error("Name can't be empty"); return }
        setName(value.trim()); break
      case "age":
        const numAge = parseInt(value)
        if (isNaN(numAge) || numAge < 14 || numAge > 21) { toast.error("Age must be between 14 and 21"); return }
        setAge(String(numAge)); break
      case "gpa":
        const gpaNum = parseFloat(value)
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) { toast.error("GPA must be between 0 and 4"); return }
        setGpa(value); break
      case "location":
        if (!value.trim()) { toast.error("Address can't be empty"); return }
        setLocation(value.trim()); break
      case "zipCode":
        const cleanZip = value.replace(/\D/g, "")
        if (!/^\d{5}$/.test(cleanZip)) { toast.error("Zip code must be 5 digits"); return }
        setZipCode(cleanZip); break
      case "email":
        if (!emailRegex.test(value.trim())) { toast.error("Enter a valid email address"); return }
        setEmail(value.trim().toLowerCase()); break
      case "phone":
        const cleanPhone = value.replace(/\D/g, "")
        if (cleanPhone.length !== 10) { toast.error("Phone number must be 10 digits"); return }
        setPhone(cleanPhone); break
      case "school":
        if (!value.trim()) { toast.error("School can't be empty"); return }
        setSchool(value.trim()); break
    }
    closeEdit()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Row component
  const Row = ({ label, value, field, placeholder, inputType = "text", editValue: initialEditValue }: { label: string; value: string; field: string; placeholder?: string; inputType?: string; editValue?: string }) => {
    const isEditing = editingField === field
    const [localVal, setLocalVal] = useState(initialEditValue ?? value)
    useEffect(() => { setLocalVal(initialEditValue ?? value) }, [value, initialEditValue])
    return (
      <div className="border-b border-border last:border-0">
        {isEditing ? (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <input
                autoFocus
                type={inputType}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(field, localVal) }}
                className="w-full bg-transparent text-sm text-foreground outline-none border-b border-primary pb-1"
                placeholder={placeholder}
              />
            </div>
            <button onClick={() => commitEdit(field, localVal)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={closeEdit} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => openEdit(field, value)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-sm mt-0.5 ${value ? "text-foreground" : "text-muted-foreground/60"}`}>
                {value || placeholder || "Not set"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* DIALOGS */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Switch to Employer Role?</DialogTitle>
            <DialogDescription className="pt-2">This will permanently delete your student account including your profile, GPA verification, and all job applications. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <button onClick={() => setShowSwitchDialog(false)} className="flex-1 py-2 rounded-xl border text-sm font-medium" disabled={switching}>Cancel</button>
            <button onClick={handleSwitchRole} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium" disabled={switching}>{switching ? "Deleting..." : "Yes, delete my account"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete Account?</DialogTitle>
            <DialogDescription className="pt-2">This will permanently delete your account and all data. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <button onClick={() => setShowDeleteDialog(false)} className="flex-1 py-2 rounded-xl border text-sm font-medium" disabled={deleting}>Cancel</button>
            <button onClick={handleDeleteAccount} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium" disabled={deleting}>{deleting ? "Deleting..." : "Yes, delete"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.push("/matching/student")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <span className="text-base font-semibold text-foreground">My Profile</span>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-lg mx-auto">

        {/* AVATAR + NAME HERO */}
        <div className="flex flex-col items-center py-8 px-4 border-b border-border">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary mb-3">
            {name.trim().split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "?"}
          </div>
          <p className="text-xl font-bold text-foreground">{name || "Your Name"}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{school || "Your School"}</p>
          <div className="mt-3">
            {isLooking ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Available for work
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                Not currently looking
              </span>
            )}
          </div>
        </div>

        {/* JOB SEARCH STATUS */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visibility</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Job Search Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLooking ? "Visible to employers" : "Hidden from employers"}
              </p>
            </div>
            <button
              onClick={() => setIsLooking(!isLooking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLooking ? "bg-primary" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isLooking ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        {/* PERSONAL INFO */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Info</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <Row label="Full Name" value={name} field="name" placeholder="Add your name" />
          <Row label="Age" value={age} field="age" placeholder="14–21" inputType="number" />
          <Row label="School" value={school} field="school" placeholder="Your school name" />
          <Row label="GPA (Unweighted)" value={gpa} field="gpa" placeholder="e.g. 3.5" inputType="number" />
        </div>

        {/* CONTACT */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <Row label="Email" value={email} field="email" placeholder="your@email.com" inputType="email" />
          <Row label="Phone" value={phone ? `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}` : ""} field="phone" placeholder="10-digit number" inputType="tel" editValue={phone} />
                    <Row label="Street Address" value={location} field="location" placeholder="123 Main St" />
          <Row label="Zip Code" value={zipCode} field="zipCode" placeholder="5-digit zip" />
        </div>

        {/* PREFERRED JOBS */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferred Positions</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Select up to 3 roles you're interested in.</p>
            <div className="flex flex-wrap gap-2">
              {JOB_OPTIONS.map((job) => {
                const selected = preferredJobs.includes(job)
                return (
                  <button key={job}
                    onClick={() => setPreferredJobs(prev => {
                      if (prev.includes(job)) return prev.filter(j => j !== job)
                      if (prev.length >= MAX_JOBS) { toast.error(`Max ${MAX_JOBS} positions`); return prev }
                      return [...prev, job]
                    })}
                    className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                    {job}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* INTERESTS */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Interests</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  {interest}
                  <button onClick={() => setInterests(interests.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-foreground ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {interests.length < MAX_INTERESTS && (
              <div className="flex gap-2">
                <input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const trimmed = newInterest.trim()
                      if (!trimmed || interests.includes(trimmed) || interests.length >= MAX_INTERESTS) return
                      setInterests([...interests, trimmed]); setNewInterest("")
                    }
                  }}
                  placeholder="Add interest (e.g. Coding)"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    const trimmed = newInterest.trim()
                    if (!trimmed || interests.includes(trimmed) || interests.length >= MAX_INTERESTS) return
                    setInterests([...interests, trimmed]); setNewInterest("")
                  }}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AVAILABILITY */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Availability</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          {/* SHIFT PREFERENCE */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">Shift Preference</p>
            <div className="flex gap-2">
              {["morning", "night", "flexible"].map((type) => (
                <button key={type}
                  onClick={() => setShiftPreference(type as any)}
                  className={`flex-1 py-1.5 text-xs rounded-full border font-medium capitalize transition-all ${shiftPreference === type ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          {/* DAYS */}
          {availability.map((day, index) => (
            <div key={day.day} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{day.day}</p>
                {day.available && (
                  <div className="flex items-center gap-2 mt-1">
                    <select value={day.start}
                      onChange={(e) => { const n = [...availability]; n[index].start = e.target.value; setAvailability(n) }}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground">
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground">to</span>
                    <select value={day.end}
                      onChange={(e) => { const n = [...availability]; n[index].end = e.target.value; setAvailability(n) }}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground">
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button
                onClick={() => { const n = [...availability]; n[index].available = !n[index].available; if (!n[index].available) n[index].hours = "-"; setAvailability(n) }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-3 shrink-0 ${day.available ? "bg-primary" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${day.available ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* RECOMMENDATION */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendation</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          {recommendation?.submitted ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Recommendation received!</p>
              </div>
              <p className="text-sm text-foreground">From <strong>{recommendation.recommender_name}</strong> · {recommendation.recommender_relationship}</p>
              <p className="text-sm text-muted-foreground italic mt-2">"{recommendation.description}"</p>
            </div>
          ) : recommendation && !recommendation.submitted ? (
            <div className="p-4">
              <p className="text-sm font-medium text-yellow-700">⏳ Waiting for {recommendation.recommender_name} to submit.</p>
              <p className="text-xs text-muted-foreground mt-1">Sent to: {recommendation.recommender_email}</p>
              <button onClick={sendRecommendationRequest} disabled={sendingRec} className="mt-3 w-full py-2 rounded-xl border border-border text-sm font-medium text-foreground">
                {sendingRec ? "Resending..." : "Resend Email"}
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Ask a teacher, coach, or employer to recommend you. It shows on your profile and helps you stand out.</p>
              <input value={recommenderName} onChange={(e) => setRecommenderName(e.target.value)} placeholder="Recommender's full name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <input type="email" value={recommenderEmail} onChange={(e) => setRecommenderEmail(e.target.value)} placeholder="Recommender's email"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <select value={recommenderRelationship} onChange={(e) => setRecommenderRelationship(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                <option value="">Select relationship...</option>
                <option value="Teacher">Teacher</option>
                <option value="Coach">Coach</option>
                <option value="Employer">Previous Employer</option>
                <option value="Parent">Parent / Guardian</option>
                <option value="Mentor">Mentor</option>
                <option value="Other">Other</option>
              </select>
              <button onClick={sendRecommendationRequest} disabled={sendingRec}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                {sendingRec ? "Sending..." : "Send Recommendation Request"}
              </button>
            </div>
          )}
        </div>

        {/* DANGER ZONE */}
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
        </div>
        <div className="rounded-2xl mx-4 border border-border bg-card overflow-hidden mb-6">
          <button onClick={() => setShowSwitchDialog(true)} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border hover:bg-secondary/30 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Switch to Employer</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes your student data</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
          <button onClick={() => setShowDeleteDialog(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50/50 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium text-red-600">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes everything</p>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400/60" />
          </button>
        </div>

      </div>

      {/* FLOATING SAVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            disabled={saving}
            onClick={async () => {
              if (!isProfileComplete) {
                const missingFields = []
                if (!name.trim()) missingFields.push("name")
                if (!age.trim()) missingFields.push("age")
                if (!gpa.trim()) missingFields.push("GPA")
                if (!location.trim()) missingFields.push("location")
                if (!zipRegex.test(zipCode)) missingFields.push("zip code")
                if (!emailRegex.test(email)) missingFields.push("valid email")
                if (!school.trim()) missingFields.push("school")
                if (phone.length !== 10) missingFields.push("phone number")
                if (preferredJobs.length === 0) missingFields.push("preferred jobs")
                if (interests.length === 0) missingFields.push("interests")
                if (!availability.some((d) => d.available)) missingFields.push("availability")
                toast.error("Profile incomplete", { description: `Missing: ${missingFields.join(", ")}` })
                return
              }
              setSaving(true)
              const success = await saveStudentProfile()
              setSaving(false)
              if (!success) return
              router.push("/matching/student?from=profile&saved=true")
            }}
            className={`w-full h-14 rounded-2xl text-base font-semibold shadow-lg transition-all ${
              saving ? "bg-primary/70 text-primary-foreground cursor-not-allowed" :
              isProfileComplete ? "bg-primary text-primary-foreground active:scale-[0.98]" :
              "bg-primary/50 text-primary-foreground"
            }`}
          >
            {saving ? "Saving your profile..." : "Save Profile"}
          </button>
        </div>
      </div>

    </div>
  )
}