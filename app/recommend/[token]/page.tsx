"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CheckCircle2, Briefcase } from "lucide-react"
import Link from "next/link"

export default function RecommendPage() {
  const params = useParams()
  const token = params.token as string

  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [howLongKnown, setHowLongKnown] = useState("")
  const [wouldRecommend, setWouldRecommend] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select(`
          id,
          recommender_name,
          recommender_relationship,
          submitted,
          student_user_id
        `)
        .eq("token", token)
        .single()

      if (error || !data) { setLoading(false); return }

      if (data.submitted) {
        setSubmitted(true)
        setLoading(false)
        return
      }

      // Get student name
      const { data: student } = await supabase
        .from("Students")
        .select("name")
        .eq("user_id", data.student_user_id)
        .single()

      setRecommendation({ ...data, studentName: student?.name || "this student" })
      setLoading(false)
    }

    load()
  }, [token])

  const handleSubmit = async () => {
    if (recommendation?.submitted) {
      toast.error("This recommendation has already been submitted.")
      setSubmitted(true)
      return
    }
    if (!howLongKnown.trim()) { toast.error("Please fill in how long you've known them"); return }    
    if (!howLongKnown.trim()) { toast.error("Please fill in how long you've known them"); return }
    if (!wouldRecommend) { toast.error("Please select whether you'd recommend them"); return }
    if (!description.trim()) { toast.error("Please write a short description"); return }
    if (description.trim().length < 20) { toast.error("Please write a bit more — at least a sentence or two"); return }

    setSubmitting(true)

    const { error } = await supabase
      .from("recommendations")
      .update({
        how_long_known: howLongKnown,
        would_recommend: wouldRecommend,
        description: description.trim(),
        submitted: true,
      })
      .eq("token", token)

    if (error) {
      toast.error("Failed to submit. Please try again.")
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }
  if (!recommendation && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="font-semibold text-foreground">This recommendation link is invalid or has expired.</p>
            <p className="text-sm text-muted-foreground mt-2">If you believe this is an error, ask the student to send you a new link.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Recommendation submitted!</h2>
            <p className="text-muted-foreground text-sm">
              Thank you for supporting {recommendation?.studentName || "this student"}. 
              Your recommendation will appear on their profile for employers to read.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">

        {/* HEADER */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SimplyApply</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recommendation for {recommendation.studentName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              You're listed as their <strong>{recommendation.recommender_relationship}</strong>. 
              This takes about 2 minutes and means a lot to their job search.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* HOW LONG KNOWN */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                How long have you known {recommendation.studentName}?
              </label>
              <input
                value={howLongKnown}
                onChange={(e) => setHowLongKnown(e.target.value)}
                placeholder='e.g. "2 years" or "since 9th grade"'
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* WOULD RECOMMEND */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Would you recommend {recommendation.studentName} for a part-time job?
              </label>
              <div className="flex gap-2">
                {["Yes, absolutely", "Yes, with some reservations", "I'm not sure"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setWouldRecommend(option)}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                      wouldRecommend === option
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                In a few sentences, why would {recommendation.studentName} be a good hire?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Share what makes ${recommendation.studentName} stand out — reliability, attitude, skills, etc.`}
                rows={4}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length} characters</p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Recommendation"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your recommendation will be visible to employers on SimplyApply. 
              By submitting you confirm this is your honest assessment.
            </p>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}