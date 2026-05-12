"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Student = {
  user_id: string
  name: string
  gpa: number
  gpa_proof_url: string | null
  gpa_proof_path: string | null
  gpa_verification_status: string
}
export default function GpaVerificationPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("Students")
      .select("*")
      .eq("gpa_verification_status", "pending")

    if (error) {
      console.log(error)
      toast.error("Failed to load submissions")
      setLoading(false)
      return
    }

    setStudents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const updateStatus = async (
    student: Student,
    status: "approved" | "rejected"
  ) => {
  
    // 🔥 DELETE IMAGE IF REJECTED
    if (
      status === "rejected" &&
      student.gpa_proof_path
    ) {
      const { error: storageError } = await supabase.storage
        .from("gpa-proofs")
        .remove([student.gpa_proof_path])
  
      if (storageError) {
        console.log("STORAGE DELETE ERROR:", storageError)
        toast.error("Failed to delete image")
        return
      }
    }
  
    const updateData =
      status === "rejected"
        ? {
            gpa_verification_status: "rejected",
            is_gpa_verified: false,
  
            // 🔥 CLEAR OLD IMAGE
            gpa_proof_url: null,
            gpa_proof_path: null,
          }
        : {
            gpa_verification_status: "approved",
            is_gpa_verified: true,
          }
  
    const { error } = await supabase
      .from("Students")
      .update(updateData)
      .eq("user_id", student.user_id)
  
    if (error) {
      console.log(error)
      toast.error("Update failed")
      return
    }
  
    toast.success(`Marked as ${status}`)
    fetchPending()
  }
  return (
    <div className="min-h-screen p-6 bg-background">
      <h1 className="text-2xl font-bold mb-6">GPA Verification</h1>

      {loading && <p>Loading...</p>}

      {!loading && students.length === 0 && (
        <p className="text-muted-foreground">
          No pending submissions 🎉
        </p>
      )}

      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.user_id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{student.name}</span>
                <Badge>GPA: {student.gpa}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {student.gpa_proof_url ? (
                <img
                  src={student.gpa_proof_url}
                  className="w-full max-h-96 object-contain rounded border"
                  alt="GPA proof"
                />
              ) : (
                <p className="text-red-500">
                  No image uploaded
                </p>
              )}

              <div className="flex gap-2">
                <Button
                 onClick={() =>
                  updateStatus(student, "approved")
                }
                >
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() =>
                    updateStatus(student, "rejected")
                  }
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}