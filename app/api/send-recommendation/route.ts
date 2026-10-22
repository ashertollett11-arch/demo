import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { shell, firstName } from "@/lib/emails/layout"

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

    const first = firstName(studentName)

    const { error: emailError } = await resend.emails.send({
      from: "SimplyApply <noreply@simplyapply.app>",
      to: recommenderEmail,
      subject: `${studentName} asked you for a recommendation`,
      html: shell({
        heading: first ? `Got two minutes to help ${first} out?` : "Got two minutes to help out?",
        intro: `${studentName} listed you as their ${relationship} on SimplyApply, a job-matching platform for students ages 14\u201321.`,
        body:
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">If you know ${studentName} and feel comfortable recommending them, we'd appreciate you filling out a short form. It should take about two minutes, and your recommendation could help them stand out to employers.</p>` +
          `<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Don't know ${studentName}, or weren't expecting this email? No problem. Just ignore it. There's no account to create and no further action needed.</p>`,
        ctaLabel: "Write a recommendation",
        ctaHref: recommendUrl,
        // The recommender has no SimplyApply account, so there is no
        // preferences page to send them to.
        footerReason: `You're receiving this because ${studentName} listed you as a reference on SimplyApply.<br/>Questions? Contact us at simplyapplyapp@gmail.com`,
        prefsPath: "",
      }),
    })

    if (emailError) throw emailError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}