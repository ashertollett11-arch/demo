"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Building2, AlertTriangle, MapPin, Plus, Pencil, Bell, CreditCard, LogOut, ChevronDown, DollarSign, Clock, HelpCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Location = {
  id: string
  name: string
  address: string
  zip_code: string
  max_distance_miles: number
  hourly_pay: number | null
  has_tips: boolean
  shift_preference: string
  available_shifts: any[]
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"

export default function EmployerProfilePage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

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
  const scrollToField = (ref: FieldRef) => { ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); ref.current?.focus?.() }

  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|us|gov|io|co)$/i
  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/

  const isProfileComplete =
    companyName.trim() && ownerName.trim() && businessType.trim() && details.trim() &&
    emailRegex.test(email) && phoneRegex.test(phone) && locations.length > 0

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "employer") { router.replace("/login"); return }
      const { data: profile } = await supabase.from("profiles").select("profile_complete").eq("id", user.id).maybeSingle()
      if (!profile?.profile_complete) { router.replace("/employer/onboarding"); return }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!companyName.trim()) return
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAutoSaving(true)
      await supabase.from("job").upsert({
        id: jobId || undefined, user_id: user.id,
        title: companyName || "Untitled Job", company: companyName || "Unknown Company",
        owner_name: ownerName || null, business_type: businessType || null,
        email: email || null, phone: phone || null, details: details || "No description",
        preferred_jobs: preferredJobs, status: "new", distance: "0",
      }, { onConflict: "user_id" }).select().single().then(({ data }) => { if (data?.id) setJobId(data.id) })
      setAutoSaving(false)
      setLastSaved(new Date())
    }, 2000)
    return () => clearTimeout(timer)
  }, [companyName, ownerName, businessType, email, phone, details, preferredJobs])

  useEffect(() => {
    const missing = window.location.search.includes("missing=true")
    if (missing) setTimeout(() => { toast.error("Please complete your profile") }, 300)
  }, [])

  useEffect(() => {
    const loadEmployer = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      if (user.email) setEmail(user.email)
      const { data, error } = await supabase.from("job").select("*").eq("user_id", user.id).maybeSingle()
      if (error && error.code !== "PGRST116") { setLoading(false); return }
      if (!data) { setLoading(false); return }
      setJobId(data.id ?? null); setCompanyName(data.company ?? ""); setOwnerName(data.owner_name ?? "")
      setEmail(data.email ?? user.email ?? ""); setBusinessType(data.business_type ?? "")
      setPhone(data.phone ?? ""); setDetails(data.details ?? ""); setPreferredJobs(data.preferred_jobs ?? [])
      if (data.id) {
        setLoadingLocations(true)
        const { data: locs } = await supabase.from("locations").select("*").eq("employer_id", data.id).order("created_at", { ascending: true })
        setLocations(locs || [])
        setLoadingLocations(false)
      }
      const { data: profileData } = await supabase.from("profiles").select("email_notifications").eq("id", user.id).maybeSingle()
      setEmailNotifications(profileData?.email_notifications !== false)
      setLoading(false)
    }
    loadEmployer()
  }, [])

  const validateProfile = () => {
    if (!companyName.trim()) { toast.error("Missing company name"); scrollToField(companyRef); return false }
    if (!ownerName.trim()) { toast.error("Missing owner name"); scrollToField(ownerRef); return false }
    if (!emailRegex.test(email)) { toast.error("Invalid email"); scrollToField(emailRef); return false }
    if (!phoneRegex.test(phone)) { toast.error("Invalid phone number"); scrollToField(phoneRef); return false }
    if (!businessType.trim()) { toast.error("Missing business type"); return false }
    if (!details.trim()) { toast.error("Missing description"); scrollToField(detailsRef); return false }
    if (locations.length === 0) { toast.error("Add at least one location before saving.", { duration: 5000 }); return false }
    return true
  }

  const goToLocations = async () => {
    if (!companyName.trim()) { toast.error("Please enter your company name first"); scrollToField(companyRef); return }
    if (!ownerName.trim()) { toast.error("Please enter the owner name first"); scrollToField(ownerRef); return }
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email first"); scrollToField(emailRef); return }
    if (!phoneRegex.test(phone)) { toast.error("Please enter a valid phone number first"); scrollToField(phoneRef); return }
    if (!businessType.trim()) { toast.error("Please enter your business type first"); return }
    if (!details.trim()) { toast.error("Please enter a company description first"); scrollToField(detailsRef); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("job").upsert({
        id: jobId || undefined, user_id: user.id, title: companyName, company: companyName,
        owner_name: ownerName || null, business_type: businessType || null, email: email || null,
        phone: phone || null, details: details || "No description", preferred_jobs: preferredJobs, status: "new", distance: "0",
      }, { onConflict: "user_id" }).select().single()
      if (data?.id) setJobId(data.id)
    }
    router.push("/employer/locations")
  }

  const handleSave = async () => {
    if (!validateProfile()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Not logged in"); setSaving(false); return }
    const { data, error } = await supabase.from("job").upsert({
      id: jobId || undefined, user_id: user.id, title: companyName, company: companyName,
      owner_name: ownerName || null, business_type: businessType || null, email: email || null,
      phone: phone || null, details: details || "No description", preferred_jobs: preferredJobs, status: "new", distance: "0",
    }, { onConflict: "user_id" }).select().single()
    if (error) { toast.error(error.message); setSaving(false); return }
    if (data?.id) setJobId(data.id)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles").upsert({ id: user.id, email: user.email, profile_complete: true }, { onConflict: "id" }).select("subscription_status").single()
    if (profileError) { toast.error("Saved but failed to mark profile complete."); setSaving(false); return }
    toast.success("Profile saved!")
    setSaving(false)
    const status = profileData?.subscription_status
    if (status === "active" || status === "freeactive") { router.push("/employer") } else { router.push("/pricing/mobile") }
  }

  const handleSwitchRole = async () => {
    setSwitching(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSwitching(false); return }
    try {
      const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
      if (!res.ok) { toast.error("Failed to switch role."); setSwitching(false); return }
      await supabase.auth.signOut(); window.location.href = "/choose-role"
    } catch { toast.error("Something went wrong."); setSwitching(false) }
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

  return (
    <div className="min-h-screen bg-background">

      {/* DIALOGS */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Switch to Student Role?</DialogTitle>
            <DialogDescription className="pt-2">This will permanently delete your employer account including your company profile, all locations, and candidate pipeline. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSwitchDialog(false)} disabled={switching}>Cancel</Button>
            <Button variant="destructive" onClick={handleSwitchRole} disabled={switching}>{switching ? "Deleting..." : "Yes, delete my account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Delete Account?</DialogTitle>
            <DialogDescription className="pt-2">This will permanently delete your account and all associated data. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              const res = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
              if (!res.ok) { toast.error("Failed to delete account."); return }
              await supabase.auth.signOut(); window.location.href = "/login"
            }}>Yes, delete my account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <Image src="/icon-192x192.png" alt="SimplyApply logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/matching/employer" className="text-sm font-medium text-muted-foreground hover:text-foreground">Find Candidates</Link>
            <Link href="/employer/profile" className="text-sm font-medium text-foreground">Profile</Link>
            <Link href="/pricing/mobile" className="text-sm font-medium text-muted-foreground hover:text-foreground">Billing</Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                  {companyName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{companyName || "Your Company"}</span>
                  <span className="text-xs text-muted-foreground">Employer</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{companyName || "Your Company"}</p>
                <p className="text-xs text-muted-foreground">Employer Account</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/employer/profile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Company Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/employer/locations" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Locations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing/mobile" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help & Support
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
            <p className="mt-1 text-muted-foreground">Keep your info up to date so students can find and contact you.</p>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            {!autoSaving && lastSaved && <span className="text-xs text-muted-foreground">Saved ✓</span>}
            {!isProfileComplete && <Badge variant="secondary" className="text-xs">Incomplete</Badge>}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* LEFT COLUMN — company info */}
          <div className="lg:col-span-2 space-y-6">

            {/* COMPANY INFO */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Company Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Company Name</label>
                    <input ref={companyRef} value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company name" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Owner / Manager Name</label>
                    <input ref={ownerRef} value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Full name" className={inputClass} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Business Type</label>
                    <input value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Food service, Retail" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Phone Number</label>
                    <input ref={phoneRef} value={phone}
                      onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 10) v = v.slice(0, 10); setPhone(v) }}
                      placeholder="10 digits" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcompany.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Company Description</label>
                  <textarea ref={detailsRef} value={details} onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell students about your business — what you do, the vibe, what makes it a great place to work..."
                    rows={4} className={inputClass + " resize-none"} />
                </div>
              </CardContent>
            </Card>

            {/* LOCATIONS */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Locations
                    {locations.length > 0 && <span className="text-xs font-normal text-muted-foreground">({locations.length})</span>}
                  </div>
                  <Button size="sm" variant="outline" onClick={goToLocations} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    {locations.length === 0 ? "Add Location" : "Manage Locations"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLocations ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : locations.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/20 p-6 text-center">
                    <MapPin className="h-8 w-8 text-red-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-red-700">No locations added yet</p>
                    <p className="text-xs text-red-500 mt-1 mb-3">You must add at least one location before saving your profile.</p>
                    <Button size="sm" onClick={goToLocations}><Plus className="h-3.5 w-3.5 mr-1" />Add Your First Location</Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-foreground">{loc.name}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{loc.max_distance_miles ?? 25} mi</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />{loc.address}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {loc.hourly_pay && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              ${loc.hourly_pay}/hr{loc.has_tips ? " + tips" : ""}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 capitalize">{loc.shift_preference}</span>
                        </div>
                        <button onClick={goToLocations} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN — settings + danger */}
          <div className="space-y-6">

            {/* PROFILE COMPLETENESS */}
            <Card className={`border ${isProfileComplete ? "border-green-200 bg-green-50/20" : "border-yellow-200 bg-yellow-50/20"}`}>
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-3">Profile Status</p>
                <div className="space-y-2">
                  {[
                    { label: "Company name", done: !!companyName.trim() },
                    { label: "Owner name", done: !!ownerName.trim() },
                    { label: "Business type", done: !!businessType.trim() },
                    { label: "Email", done: emailRegex.test(email) },
                    { label: "Phone", done: phoneRegex.test(phone) },
                    { label: "Description", done: !!details.trim() },
                    { label: "At least one location", done: locations.length > 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-green-500" : "bg-gray-200"}`}>
                        {item.done && <span className="text-white text-[8px]">✓</span>}
                      </div>
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {isProfileComplete && (
                  <p className="text-xs text-green-700 font-medium mt-3">Profile complete — ready to match!</p>
                )}
              </CardContent>
            </Card>

            {/* EMAIL NOTIFICATIONS */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Application Emails</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Get notified when a student applies</p>
                  </div>
                  <button type="button"
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return
                      const newVal = !emailNotifications
                      setEmailNotifications(newVal)
                      await supabase.from("profiles").update({ email_notifications: newVal }).eq("id", user.id)
                      toast.success(newVal ? "Email notifications enabled" : "Email notifications disabled")
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? "bg-primary" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* DANGER ZONE */}
         {/* DANGER ZONE */}
         <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">Account</p>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Switch to Student</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes your employer data</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setShowSwitchDialog(true)}>
                    Switch
                  </Button>
                </div>
                <div className="border-t border-border pt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-red-700">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes everything</p>
                  </div>
                  <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowDeleteDialog(true)}>
                    Delete
                  </Button>
                </div>
                <div className="border-t border-border pt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Log Out</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }}>
                    <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log out
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}