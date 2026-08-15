import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { studentUserId, studentName, recommenderName, recommenderEmail, relationship } = await req.json()

    if (!studentUserId || !studentName || !recommenderName || !recommenderEmail || !relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate student exists
    const { data: student } = await supabase
      .from("Students")
      .select("user_id")
      .eq("user_id", studentUserId)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from("recommendations")
      .select("id, submitted, token")
      .eq("student_user_id", studentUserId)
      .maybeSingle()

    if (existing?.submitted) {
      return NextResponse.json({ error: "Recommendation already submitted" }, { status: 400 })
    }

    let token: string

    if (existing) {
      const { data, error } = await supabase
        .from("recommendations")
        .update({
          recommender_name: recommenderName,
          recommender_email: recommenderEmail,
          recommender_relationship: relationship,
          submitted: false,
        })
        .eq("student_user_id", studentUserId)
        .select("token")
        .single()
      if (error) throw error
      token = data.token
    } else {
      const { data, error } = await supabase
        .from("recommendations")
        .insert({
          student_user_id: studentUserId,
          recommender_name: recommenderName,
          recommender_email: recommenderEmail,
          recommender_relationship: relationship,
        })
        .select("token")
        .single()
      if (error) throw error
      token = data.token
    }


    const recommendUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/recommend/${token}`

    const { error: emailError } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: recommenderEmail,
      subject: `${studentName} is asking for your recommendation`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111;">You've been asked to write a recommendation</h2>
          <p style="color: #444; font-size: 16px;">
            <strong>${studentName}</strong> listed you as a reference on SimplyApply — 
            a job matching platform for students ages 14–21.
          </p>
          <p style="color: #444; font-size: 16px;">
            They listed you as their <strong>${relationship}</strong>. 
            If you know ${studentName} and are happy to recommend them, 
            click the button below to fill out a short form. It takes about 2 minutes.
          </p>
          <a href="${recommendUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #2563eb; color: white; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Write Recommendation
          </a>
          <p style="color: #888; font-size: 13px;">
            If you don't know ${studentName} or weren't expecting this email, you can safely ignore it. 
            No account is required.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">
            SimplyApply — connecting students with local employers.<br />
            Questions? Contact us at simplyapplyapp@gmail.com
          </p>
        </div>
      `,
    })

    if (emailError) throw emailError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}