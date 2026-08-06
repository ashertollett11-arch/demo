"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Building2, AlertTriangle, MapPin, Plus, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type Location = {
  id: string
  name: string
  address: string
  zip_code: string
  zip_match_precision: number
  hourly_pay: number | null
  has_tips: boolean
  shift_preference: string
  available_shifts: any[]
}

export default function EmployerProfilePage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Profile fields
  const [companyName, setCompanyName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [phone, setPhone] = useState("")
  const [details, setDetails] = useState("")
  const [preferredJobs, setPreferredJobs] = useState<string[]>([])

  const companyRef = useRef<HTMLInputElement>(null)
  const ownerRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const detailsRef = useRef<HTMLTextAreaElement>(null)

  type FieldRef = React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  const scrollToField = (ref: FieldRef) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    ref.current?.focus?.()
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/

  const isProfileComplete =
    companyName.trim() &&
    ownerName.trim() &&
    businessType.trim() &&
    details.trim() &&
    emailRegex.test(email) &&
    phoneRegex.test(phone) &&
    preferredJobs.length > 0 &&
    locations.length > 0

  // -------------------------
  // AUTH
  // -------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    const missing = window.location.search.includes("missing=true")
    if (missing) setTimeout(() => { toast.error("Please complete your profile") }, 300)
  }, [])

  // -------------------------
  // LOAD EMPLOYER
  // -------------------------
  useEffect(() => {
    const loadEmployer = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      if (user.email) setEmail(user.email)

      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") { console.log("Employer load error:", error); setLoading(false); return }
      if (!data) { setLoading(false); return }

      setJobId(data.id ?? null)
      setCompanyName(data.company ?? "")
      setOwnerName(data.owner_name ?? "")
      setEmail(data.email ?? user.email ?? "")
      setBusinessType(data.business_type ?? "")
      setPhone(data.phone ?? "")
      setDetails(data.details ?? "")
      setPreferredJobs(data.preferred_jobs ?? [])

      // Load locations
      if (data.id) {
        setLoadingLocations(true)
        const { data: locs } = await supabase
          .from("locations")
          .select("*")
          .eq("employer_id", data.id)
          .order("created_at", { ascending: true })
        setLocations(locs || [])
        setLoadingLocations(false)
      }

      setLoading(false)
    }
    loadEmployer()
  }, [])

  // -------------------------
  // VALIDATE
  // -------------------------
  const validateProfile = () => {
    if (!companyName.trim()) { toast.error("Missing company name"); scrollToField(companyRef); return false }
    if (!ownerName.trim()) { toast.error("Missing owner name"); scrollToField(ownerRef); return false }
    if (!emailRegex.test(email)) { toast.error("Invalid email"); scrollToField(emailRef); return false }
    if (!phoneRegex.test(phone)) { toast.error("Invalid phone number"); scrollToField(phoneRef); return false }
    if (!businessType.trim()) { toast.error("Missing business type"); return false }
    if (!details.trim()) { toast.error("Missing description"); scrollToField(detailsRef); return false }
    if (preferredJobs.length === 0) { toast.error("Select at least one Hiring Role"); return false }
    if (locations.length === 0) {
      toast.error("Add at least one location before saving.", {
        description: "Use the Locations section below to add your first location.",
        duration: 5000,
      })
      return false
    }
    return true
  }

  // -------------------------
  // SAVE
  // -------------------------
  const handleSave = async () => {
    const isValid = validateProfile()
    if (!isValid) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Not logged in"); return }

    const { data, error } = await supabase
      .from("job")
      .upsert(
        {
          id: jobId || undefined,
          user_id: user.id,
          title: companyName || "Untitled Job",
          company: companyName || "Unknown Company",
          owner_name: ownerName || null,
          business_type: businessType || null,
          email: email || null,
          phone: phone || null,
          details: details || "No description",
          preferred_jobs: preferredJobs,
          status: "new",
          distance: "0",
        },
        { onConflict: "user_id" }
      )
      .select()
      .single()

    if (error) { console.error(error); toast.error(error.message); return }
    if (data?.id) setJobId(data.id)

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email, profile_complete: true },
        { onConflict: "id" }
      )
      .select("subscription_status")
      .single()

    if (profileError) { console.error("PROFILE COMPLETE ERROR:", profileError); toast.error("Saved but failed to mark profile complete."); return }

    toast.success("Saved!")

    const status = profileData?.subscription_status
    if (status === "active" || status === "freeactive") {
      router.push("/employer")
    } else {
      router.push("/pricing/mobile")
    }
  }

  // -------------------------
  // SWITCH ROLE
  // -------------------------
  const handleSwitchRole = async () => {
    setSwitching(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSwitching(false); return }
    await supabase.from("student_statuses").delete().eq("employer_id", user.id)
    await supabase.from("notifications").delete().eq("employer_id", user.id)
    await supabase.from("job").delete().eq("user_id", user.id)
    await supabase.from("profiles").delete().eq("id", user.id)
    await supabase.from("users").delete().eq("id", user.id)
    await supabase.auth.signOut()
    toast.success("Account removed. You can now sign up with a new role.")
    router.replace("/")
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">

      {/* SWITCH ROLE DIALOG */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Switch to Student Role?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>This will <span className="font-semibold text-foreground">permanently delete</span> your employer account and all associated data including:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Your company profile</li>
                <li>All locations</li>
                <li>Candidate pipeline and statuses</li>
                <li>Billing information</li>
              </ul>
              <p className="font-medium text-foreground">This cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSwitchDialog(false)} disabled={switching}>Cancel</Button>
            <Button variant="destructive" onClick={handleSwitchRole} disabled={switching}>
              {switching ? "Deleting account..." : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STICKY SAVE HEADER */}
      <div className="sticky top-0 z-50 mb-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-xl backdrop-blur px-6 py-5 sm:px-7">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">Employer</div>
                {!isProfileComplete && (
                  <div className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-semibold text-yellow-800 border border-yellow-200">Incomplete</div>
                )}
              </div>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">Complete Your Hiring Profile</h2>
              <p className="text-sm text-gray-600 mt-1 max-w-md">Add your company details and at least one location to start matching with students.</p>
            </div>
            <Button
              className={`h-12 px-6 rounded-xl text-sm font-semibold shadow-lg transition-all ${!isProfileComplete ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}`}
              onClick={handleSave}
            >
              Save Profile
            </Button>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Employer Profile</h1>

      {/* COMPANY INFO */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input ref={companyRef} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Company Name" />
          <input ref={ownerRef} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Owner / Manager Name" />
          <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Business Type (ex. food service)" />
          <input ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Email" />
          <input
            ref={phoneRef} value={phone}
            onChange={(e) => { let value = e.target.value.replace(/\D/g, ""); if (value.length > 10) value = value.slice(0, 10); setPhone(value) }}
            className="w-full border rounded px-2 py-1 text-sm" placeholder="Phone Number (10 digits)"
          />
          <textarea ref={detailsRef} value={details} onChange={(e) => setDetails(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Company Description" rows={3} />
        </CardContent>
      </Card>

    

      {/* LOCATIONS */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
              {locations.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({locations.length} {locations.length === 1 ? "location" : "locations"})</span>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push("/employer/locations")} className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              {locations.length === 0 ? "Add Location" : "Manage"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLocations ? (
            <p className="text-sm text-muted-foreground">Loading locations...</p>
          ) : locations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50/30 p-4 text-center">
              <MapPin className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">No locations added yet</p>
              <p className="text-xs text-red-500 mt-1">You must add at least one location before saving your profile.</p>
              <Button size="sm" className="mt-3" onClick={() => router.push("/employer/locations")}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Location
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{loc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-muted-foreground truncate">{loc.address} · {loc.zip_code}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        loc.zip_match_precision === 5
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {loc.zip_match_precision === 5 ? "Local" : "Regional"}
                      </span>
                      {loc.hourly_pay && (
                        <span className="text-xs font-medium text-primary">${loc.hourly_pay}/hr{loc.has_tips ? " + tips" : ""}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/employer/locations")}
                    className="shrink-0 flex items-center gap-1 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SWITCH ROLE */}
      <Card className="border-red-100 bg-red-50/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Switch to Student Role</p>
              <p className="text-sm text-muted-foreground mt-1">
                Want to look for jobs instead? This will permanently delete all your employer data.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowSwitchDialog(true)}
            >
              Switch Role
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}