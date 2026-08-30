"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, X, Clock, DollarSign, Briefcase } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Bell, Building2, CreditCard, LogOut, HelpCircle } from "lucide-react"
type Location = {
  id: string
  employer_id: string
  name: string
  address: string
  zip_code: string
  max_distance_miles: number
  available_shifts: any[]
  shift_preference: string
  hourly_pay: number | null
  has_tips: boolean
  preferred_jobs: string[]
}

const DEFAULT_SHIFTS = [
  { day: "Monday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Tuesday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Wednesday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Thursday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Friday", start: "9:00 AM", end: "5:00 PM", active: true },
  { day: "Saturday", start: "9:00 AM", end: "5:00 PM", active: false },
  { day: "Sunday", start: "9:00 AM", end: "5:00 PM", active: false },
]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12
  const ampm = i < 12 ? "AM" : "PM"
  return `${hour}:00 ${ampm}`
})

const JOB_ROLES = [
  "Cashier", "Server", "Busser", "Barista", "Cook", "Dishwasher", "Host/Hostess", "Food Runner", "Ice Cream Scooper",
  "Sales Associate", "Stock Associate", "Bagger", "Fitting Room Attendant", "Cart Attendant",
  "Customer Service", "Front Desk", "Receptionist",
  "Lifeguard", "Camp Counselor", "Theme Park Attendant", "Movie Theater Attendant", "Bowling Alley Attendant",
  "Car Wash Attendant", "Car Detailer",
  "Tutor", "Library Assistant", "Office Assistant",
]

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"

export default function LocationsPage() {
  const router = useRouter()
  const [jobId, setJobId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formName, setFormName] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formZip, setFormZip] = useState("")
  const [formMaxDistance, setFormMaxDistance] = useState<number>(10)
  const [formShiftPref, setFormShiftPref] = useState<"morning" | "night" | "flexible">("flexible")
  const [formShifts, setFormShifts] = useState(DEFAULT_SHIFTS)
  const [formPay, setFormPay] = useState("")
  const [formTips, setFormTips] = useState(false)
  const [formJobs, setFormJobs] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (!roleData?.role) { router.replace("/choose-role"); return }
      if (roleData.role !== "employer") { router.replace("/login"); return }
      const { data: job } = await supabase.from("job").select("id, company").eq("user_id", user.id).maybeSingle()
      if (!job) { toast.error("Please complete your company profile first."); router.replace("/employer/profile"); return }
      setJobId(job.id)
      setCompanyName(job.company || "")
      await loadLocations(job.id)
      // Auto-open edit form if ?edit=locationId is in the URL
      const editId = new URLSearchParams(window.location.search).get("edit")
      if (editId) {
        const { data: locToEdit } = await supabase.from("locations").select("*").eq("id", editId).single()
        if (locToEdit) {
          setFormName(locToEdit.name); setFormAddress(locToEdit.address || ""); setFormZip(locToEdit.zip_code || "")
          setFormMaxDistance(locToEdit.max_distance_miles ?? 10); setFormShiftPref(locToEdit.shift_preference || "flexible")
          setFormShifts(locToEdit.available_shifts?.length ? locToEdit.available_shifts : DEFAULT_SHIFTS)
          setFormPay(locToEdit.hourly_pay ? String(locToEdit.hourly_pay) : ""); setFormTips(locToEdit.has_tips || false)
          setFormJobs(locToEdit.preferred_jobs || []); setEditingId(editId); setShowForm(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const loadLocations = async (jId: string) => {
    const { data, error } = await supabase.from("locations").select("*").eq("employer_id", jId).order("created_at", { ascending: true })
    if (error) return
    setLocations(data || [])
  }

  const resetForm = () => {
    setFormName(""); setFormAddress(""); setFormZip(""); setFormMaxDistance(10)
    setFormShiftPref("flexible"); setFormShifts(DEFAULT_SHIFTS); setFormPay("")
    setFormTips(false); setFormJobs([]); setEditingId(null)
  }

  const openAddForm = () => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }) }

  const openEditForm = (loc: Location) => {
    setFormName(loc.name); setFormAddress(loc.address || ""); setFormZip(loc.zip_code || "")
    setFormMaxDistance(loc.max_distance_miles ?? 10); setFormShiftPref((loc.shift_preference as any) || "flexible")
    setFormShifts(loc.available_shifts?.length ? loc.available_shifts : DEFAULT_SHIFTS)
    setFormPay(loc.hourly_pay ? String(loc.hourly_pay) : ""); setFormTips(loc.has_tips || false)
    setFormJobs(loc.preferred_jobs || []); setEditingId(loc.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const saveLocation = async () => {
    if (!formName.trim()) { toast.error("Location name is required"); return }
    if (!formAddress.trim()) { toast.error("Address is required"); return }
    if (!/^\d{5}$/.test(formZip)) { toast.error("Valid zip code required"); return }
    if (!formPay || Number(formPay) <= 0) { toast.error("Pay rate is required"); return }
    if (formJobs.length === 0) { toast.error("Select at least one hiring role"); return }
    if (!jobId) return
    setSaving(true)
    const payload = {
      employer_id: jobId, name: formName.trim(), address: formAddress.trim(), zip_code: formZip,
      max_distance_miles: formMaxDistance, shift_preference: formShiftPref, available_shifts: formShifts,
      hourly_pay: Number(formPay), has_tips: formTips, preferred_jobs: formJobs,
    }
    let savedLocationId: string | null = editingId
    if (editingId) {
      const { error } = await supabase.from("locations").update(payload).eq("id", editingId)
      if (error) { toast.error("Failed to save location."); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from("locations").insert(payload).select("id").single()
      if (error) { toast.error("Failed to save location."); setSaving(false); return }
      savedLocationId = data?.id ?? null
    }
    toast.success(editingId ? "Location updated!" : "Location added!")
    await loadLocations(jobId)
    setShowForm(false); resetForm(); setSaving(false)
    if (savedLocationId) {
      await fetch("/api/calculate-distances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: savedLocationId }) }).catch(() => {})
    }
  }

  const confirmDelete = (id: string) => { setDeletingId(id); setShowDeleteDialog(true) }

  const deleteLocation = async () => {
    if (!deletingId || !jobId) return
    const { error } = await supabase.from("locations").delete().eq("id", deletingId)
    if (error) { toast.error("Failed to delete location."); return }
    toast.success("Location deleted.")
    await loadLocations(jobId)
    setShowDeleteDialog(false); setDeletingId(null)
    const { data: remaining } = await supabase.from("locations").select("id").eq("employer_id", jobId)
    if (!remaining || remaining.length === 0) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from("profiles").update({ profile_complete: false }).eq("id", user.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading locations...</p>
        </div>
      </div>
    )
  }

  const otherLocations = locations.filter(loc => loc.id !== editingId)

  return (
    <div className="min-h-screen bg-background">

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
            <Link href="/employer/locations" className="text-sm font-medium text-foreground">Locations</Link>
            <Link href="/pricing/mobile" className="text-sm font-medium text-muted-foreground hover:text-foreground">Billing</Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                  {companyName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{companyName}</span>
                  <span className="text-xs text-muted-foreground">Employer</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Locations</h1>
            <p className="mt-1 text-muted-foreground">Manage your business locations and hiring settings.</p>
          </div>
          <div className="flex items-center gap-3">
            {locations.length > 0 && (
              <Button variant="outline" onClick={async () => {
                if (showForm) {
                  const isValid = formName.trim().length > 0 && formAddress.trim().length > 0 && /^\d{5}$/.test(formZip) && Number(formPay) > 0 && formJobs.length > 0
                  if (isValid) await saveLocation()
                }
                router.push("/employer")
              }}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
              </Button>
            )}
            {!showForm && (
              <Button onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" /> Add Location
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">

          {/* FORM — takes up 3 cols on desktop */}
          {showForm && (
            <div className="lg:col-span-3">
              <Card className={`border ${editingId ? "border-blue-300 bg-blue-50/20" : "border-primary/20"}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      {editingId ? (
                        <>
                          <Pencil className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700">Editing: {locations.find(l => l.id === editingId)?.name}</span>
                        </>
                      ) : (
                        <span>New Location</span>
                      )}
                    </div>
                    <button onClick={() => { setShowForm(false); resetForm() }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* TWO COLUMN on desktop */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Location Name</label>
                      <input value={formName} onChange={(e) => setFormName(e.target.value)}
                        placeholder='"Main Street" or "Beach Location"' className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Pay Per Hour ($)</label>
                      <input type="number" step="0.01" value={formPay} onChange={(e) => setFormPay(e.target.value)}
                        placeholder="15.50" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Street Address</label>
                      <input value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="123 Main St" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Zip Code</label>
                      <input value={formZip}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 5) setFormZip(v) }}
                        placeholder="32459" maxLength={5} className={inputClass} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Max Hiring Distance</label>
                      <select value={formMaxDistance} onChange={(e) => setFormMaxDistance(Number(e.target.value))} className={inputClass}>
                        {[1,3,5,10,15,20,25,35].map(m => <option key={m} value={m}>{m} miles</option>)}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Only students within this distance see your listing.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Tips?</label>
                      <div className="flex gap-2 mt-1">
                        <button type="button" onClick={() => setFormTips(true)}
                          className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${formTips ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                          Yes
                        </button>
                        <button type="button" onClick={() => setFormTips(false)}
                          className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${!formTips ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                          No
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* HIRING ROLES */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Hiring Roles <span className="text-muted-foreground font-normal">(up to 3)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {JOB_ROLES.map((role) => (
                        <button key={role} type="button"
                          onClick={() => setFormJobs(prev => {
                            if (prev.includes(role)) return prev.filter(r => r !== role)
                            if (prev.length >= 3) { toast.error("Max 3 roles per location"); return prev }
                            return [...prev, role]
                          })}
                          className={`px-3 py-1 text-xs rounded-full border transition-all ${formJobs.includes(role) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SHIFT PREFERENCE */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Shift Preference</label>
                    <div className="flex gap-2">
                      {["morning", "night", "flexible"].map((type) => (
                        <button key={type} type="button" onClick={() => setFormShiftPref(type as any)}
                          className={`flex-1 py-2 text-sm rounded-lg border capitalize font-medium transition-all ${formShiftPref === type ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AVAILABLE SHIFTS */}
                  <div>
                    <label className="text-sm font-medium block mb-3">Available Shifts</label>
                    <div className="rounded-xl border border-border overflow-hidden">
                      {formShifts.map((day, index) => (
                        <div key={day.day} className={`flex items-center gap-3 px-4 py-2.5 ${index < formShifts.length - 1 ? "border-b border-border" : ""} ${!day.active ? "bg-secondary/20" : ""}`}>
                          <span className="text-sm font-medium text-foreground w-8">{day.day.slice(0, 3)}</span>
                          <select value={day.start} disabled={!day.active}
                            onChange={(e) => { const n = [...formShifts]; n[index].start = e.target.value; setFormShifts(n) }}
                            className={`text-xs border border-border rounded-lg px-2 py-1 bg-background ${!day.active ? "opacity-40" : ""}`}>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-xs text-muted-foreground">to</span>
                          <select value={day.end} disabled={!day.active}
                            onChange={(e) => { const n = [...formShifts]; n[index].end = e.target.value; setFormShifts(n) }}
                            className={`text-xs border border-border rounded-lg px-2 py-1 bg-background ${!day.active ? "opacity-40" : ""}`}>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button type="button"
                            onClick={() => { const n = [...formShifts]; n[index].active = !n[index].active; setFormShifts(n) }}
                            className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${day.active ? "bg-primary" : "bg-gray-300"}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${day.active ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SAVE BUTTONS */}
                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveLocation} disabled={saving} className="flex-1">
                      {saving ? "Saving..." : editingId ? "Update Location" : "Add Location"}
                    </Button>
                    <Button onClick={async () => { await saveLocation(); router.push("/employer") }} disabled={saving} variant="outline" className="flex-1">
                      {saving ? "Saving..." : "Save & Go to Dashboard"}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </div>
          )}

          {/* LOCATIONS LIST — takes remaining cols */}
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-5"}>
            {editingId && (
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-3">
                <Pencil className="h-3 w-3" />
                Editing "{locations.find(l => l.id === editingId)?.name}" — other locations below
              </p>
            )}

            {otherLocations.length === 0 && !showForm ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary mx-auto mb-4">
                    <MapPin className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="font-semibold text-foreground">No locations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first location to start matching with students.</p>
                  <Button className="mt-4" onClick={openAddForm}>
                    <Plus className="h-4 w-4 mr-2" /> Add Location
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-4 ${!showForm ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}>
                {otherLocations.map((loc) => (
                  <Card key={loc.id} className="border-border bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{loc.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {loc.address}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{loc.max_distance_miles ?? 10} mi</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 font-medium">
                          <DollarSign className="h-3 w-3" />
                          ${loc.hourly_pay}/hr{loc.has_tips ? " + tips" : ""}
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground rounded-full px-2.5 py-1 capitalize">
                          <Clock className="h-3 w-3" />
                          {loc.shift_preference}
                        </div>
                      </div>

                      {loc.preferred_jobs?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {loc.preferred_jobs.map((job) => (
                            <span key={job} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{job}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 border-t border-border pt-3">
                        <Button size="sm" variant="outline" onClick={() => openEditForm(loc)} className="flex-1 gap-1.5">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => confirmDelete(loc.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50 px-3">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* ADD NEW CARD */}
                {!showForm && (
                  <button onClick={openAddForm} className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all p-5 flex flex-col items-center justify-center gap-2 min-h-[160px] text-muted-foreground hover:text-primary">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Add Location</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* DELETE CONFIRM */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Location?</DialogTitle>
            <DialogDescription>
              This will permanently delete this location and remove it from student matching. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteLocation}>Yes, delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}