"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, Plus, Pencil, Trash2, MapPin, X } from "lucide-react"
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
  employer_id: string
  name: string
  address: string
  zip_code: string
  zip_match_precision: 5 | 3
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

const JOB_ROLES = ["Cashier","Server","Busser","Barista","Cook","Dishwasher","Host","Sales Associate","Stock Associate","Customer Service","Store Associate"]

export default function LocationsPage() {
  const router = useRouter()
  const [jobId, setJobId] = useState<string | null>(null)
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
  const [formPrecision, setFormPrecision] = useState<5 | 3>(5)
  const [formShiftPref, setFormShiftPref] = useState<"morning" | "night" | "flexible">("flexible")
  const [formShifts, setFormShifts] = useState(DEFAULT_SHIFTS)
  const [formPay, setFormPay] = useState("")
  const [formTips, setFormTips] = useState(false)
  const [formJobs, setFormJobs] = useState<string[]>([])

  // -------------------------
  // AUTH + LOAD
  // -------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: job } = await supabase
        .from("job")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!job) {
        toast.error("Please complete your company profile first.")
        router.replace("/employer/profile")
        return
      }

      setJobId(job.id)
      await loadLocations(job.id)
      setLoading(false)
    }
    load()
  }, [router])

  const loadLocations = async (jId: string) => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("employer_id", jId)
      .order("created_at", { ascending: true })
    if (error) { console.error(error); return }
    setLocations(data || [])
  }

  // -------------------------
  // FORM HELPERS
  // -------------------------
  const resetForm = () => {
    setFormName("")
    setFormAddress("")
    setFormZip("")
    setFormPrecision(5)
    setFormShiftPref("flexible")
    setFormShifts(DEFAULT_SHIFTS)
    setFormPay("")
    setFormTips(false)
    setFormJobs([])
    setEditingId(null)
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (loc: Location) => {
    setFormName(loc.name)
    setFormAddress(loc.address || "")
    setFormZip(loc.zip_code || "")
    setFormPrecision(loc.zip_match_precision || 5)
    setFormShiftPref((loc.shift_preference as any) || "flexible")
    setFormShifts(loc.available_shifts?.length ? loc.available_shifts : DEFAULT_SHIFTS)
    setFormPay(loc.hourly_pay ? String(loc.hourly_pay) : "")
    setFormTips(loc.has_tips || false)
    setFormJobs(loc.preferred_jobs || [])
    setEditingId(loc.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // -------------------------
  // SAVE LOCATION
  // -------------------------
  const saveLocation = async () => {
    if (!formName.trim()) { toast.error("Location name is required"); return }
    if (!formAddress.trim()) { toast.error("Address is required"); return }
    if (!/^\d{5}$/.test(formZip)) { toast.error("Valid zip code required"); return }
    if (!formPay || Number(formPay) <= 0) { toast.error("Pay rate is required"); return }
    if (formJobs.length === 0) { toast.error("Select at least one hiring role"); return }
    if (!jobId) return

    setSaving(true)

    const payload = {
      employer_id: jobId,
      name: formName.trim(),
      address: formAddress.trim(),
      zip_code: formZip,
      zip_match_precision: formPrecision,
      shift_preference: formShiftPref,
      available_shifts: formShifts,
      hourly_pay: Number(formPay),
      has_tips: formTips,
      preferred_jobs: formJobs,
    }

    let error
    if (editingId) {
      const { error: e } = await supabase.from("locations").update(payload).eq("id", editingId)
      error = e
    } else {
      const { error: e } = await supabase.from("locations").insert(payload)
      error = e
    }

    if (error) {
      toast.error("Failed to save location.")
      setSaving(false)
      return
    }

    toast.success(editingId ? "Location updated!" : "Location added!")
    await loadLocations(jobId)
    setShowForm(false)
    resetForm()
    setSaving(false)
  }

  // -------------------------
  // DELETE LOCATION
  // -------------------------
  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const deleteLocation = async () => {
    if (!deletingId || !jobId) return
    const { error } = await supabase.from("locations").delete().eq("id", deletingId)
    if (error) { toast.error("Failed to delete location."); return }
    toast.success("Location deleted.")
    await loadLocations(jobId)
    setShowDeleteDialog(false)
    setDeletingId(null)
  }

  // -------------------------
  // LOADING STATE
  // -------------------------
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
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/employer/profile")} className="flex items-center gap-1 px-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Locations</h1>
              <p className="text-sm text-muted-foreground">Manage your business locations</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={openAddForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          )}
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <Card className={`mb-6 ${editingId ? "border-blue-300 bg-blue-50/30" : "border-primary/30"}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
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
                <button onClick={() => { setShowForm(false); resetForm() }}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* NAME */}
              <div>
                <label className="text-sm font-medium block mb-1">Location Name (Visible to Students)</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder='e.g. "Main Street" or "Beach Location"'
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="text-sm font-medium block mb-1">Street Address</label>
                <input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* ZIP */}
              <div>
                <label className="text-sm font-medium block mb-1">Zip Code</label>
                <input
                  value={formZip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    if (value.length <= 5) setFormZip(value)
                  }}
                  placeholder="32459"
                  maxLength={5}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* SEARCH AREA */}
              <div>
                <label className="text-sm font-medium block mb-2">Search Area</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPrecision(5)}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                      formPrecision === 5 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    Local (same zip)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPrecision(3)}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                      formPrecision === 3 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    Regional (nearby zips)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formPrecision === 5
                    ? "Only show students with the exact same zip code."
                    : "Show students in your broader region (first 3 digits match)."}
                </p>
              </div>

              {/* PAY */}
              <div>
                <label className="text-sm font-medium block mb-1">Pay Per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPay}
                  onChange={(e) => setFormPay(e.target.value)}
                  placeholder="15.50"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* TIPS */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tips?</span>
                <button
                  type="button"
                  onClick={() => setFormTips(prev => !prev)}
                  className={`px-4 py-1 text-xs rounded border font-semibold transition-all min-w-[60px] text-center ${
                    formTips ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {formTips ? "Yes" : "No"}
                </button>
              </div>

              {/* HIRING ROLES */}
              <div>
                <label className="text-sm font-medium block mb-2">Hiring Roles for this Location</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setFormJobs(prev => {
                          if (prev.includes(role)) return prev.filter(r => r !== role)
                          if (prev.length >= 3) { toast.error("Max 3 roles per location"); return prev }
                          return [...prev, role]
                        })
                      }}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        formJobs.includes(role)
                          ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Select up to 3 roles you're hiring for at this location.</p>
              </div>

              {/* SHIFT PREFERENCE */}
              <div>
                <label className="text-sm font-medium block mb-2">Shift Preference</label>
                <div className="flex gap-2">
                  {["morning", "night", "flexible"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormShiftPref(type as any)}
                      className={`flex-1 py-1.5 text-xs rounded-full border capitalize transition-all ${
                        formShiftPref === type
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* AVAILABLE SHIFTS */}
              <div>
                <label className="text-sm font-medium block mb-2">Available Shifts</label>
                <div className="space-y-2">
                  {formShifts.map((day, index) => (
                    <div key={day.day} className="flex items-center gap-2 text-sm">
                      <span className="w-10 font-medium text-gray-700">{day.day.slice(0, 3)}</span>
                      <select
                        value={day.start}
                        disabled={!day.active}
                        onChange={(e) => {
                          const n = [...formShifts]
                          n[index].start = e.target.value
                          setFormShifts(n)
                        }}
                        className={`w-24 border rounded text-xs px-1 py-1 ${!day.active ? "opacity-40" : ""}`}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select
                        value={day.end}
                        disabled={!day.active}
                        onChange={(e) => {
                          const n = [...formShifts]
                          n[index].end = e.target.value
                          setFormShifts(n)
                        }}
                        className={`w-24 border rounded text-xs px-1 py-1 ${!day.active ? "opacity-40" : ""}`}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const n = [...formShifts]
                          n[index].active = !n[index].active
                          setFormShifts(n)
                        }}
                        className={`text-xs px-2 py-1 rounded-full border transition-all ${
                          day.active
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {day.active ? "Available" : "Off"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE */}
              <div className="flex gap-2 pt-2">
                <Button onClick={saveLocation} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : editingId ? "Update Location" : "Add Location"}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancel
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {/* LOCATIONS LIST */}
        {otherLocations.length === 0 && !showForm ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No locations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first location to start matching with students.</p>
              <Button className="mt-4" onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" /> Add Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {editingId && (
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Editing "{locations.find(l => l.id === editingId)?.name}" above — other locations shown below
              </p>
            )}
            {otherLocations.map((loc) => (
              <Card key={loc.id} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{loc.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          loc.zip_match_precision === 5
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {loc.zip_match_precision === 5 ? "Local" : "Regional"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {loc.address} · {loc.zip_code}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-primary">
                          ${loc.hourly_pay}/hr{loc.has_tips ? " + tips" : ""}
                        </span>
                        <span className="capitalize">{loc.shift_preference} shifts</span>
                      </div>
                      {loc.preferred_jobs?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {loc.preferred_jobs.map((job) => (
                            <span key={job} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {job}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEditForm(loc)} className="flex items-center gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmDelete(loc.id)}
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
    </div>
  )
}