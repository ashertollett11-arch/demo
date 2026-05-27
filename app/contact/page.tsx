"use client"

import Link from "next/link"
import { Briefcase, Mail, CreditCard, Users, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill out all required fields.")
      return
    }

    setSending(true)

    // Opens default mail client with prefilled email
    const mailto = `mailto:simplyapplyapp@gmail.com?subject=${encodeURIComponent(
      subject || "SimplyApply Contact"
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    )}`

    window.location.href = mailto
    setSending(false)
    toast.success("Opening your email client...")
  }

  const faqs = [
    {
      icon: CreditCard,
      question: "I'm having trouble with my subscription or billing.",
      answer:
        "For billing issues, you can manage your subscription directly through the billing portal in your account dashboard. If you're still having trouble, email us and include your account email so we can look into it quickly.",
    },
    {
      icon: Users,
      question: "I'm an employer and can't access the dashboard.",
      answer:
        "Make sure your profile is complete and your subscription is active. After subscribing, you'll be redirected to your dashboard automatically. If you're still locked out, email us with your account email.",
    },
    {
      icon: HelpCircle,
      question: "I'm a student and my profile isn't showing up for employers.",
      answer:
        "Your profile needs to be fully complete before it becomes visible to employers. Make sure all required fields are filled in and your profile is saved. GPA verification is optional but increases your visibility.",
    },
    {
      icon: CreditCard,
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel anytime directly from your billing page — no need to contact us. Your access continues until the end of your current billing period.",
    },
    {
      icon: HelpCircle,
      question: "I submitted my GPA for verification. When will it be reviewed?",
      answer:
        "GPA verifications are typically reviewed within 1–2 business days. You'll see your verified badge appear on your profile once approved.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="text-center mb-14">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Contact Us</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Have a question or need help? We're here for you. Check the common questions below or send us a message directly.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">

          {/* LEFT — FAQS */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Common Questions</h2>
            {faqs.map((faq, index) => (
              <Card key={index} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <faq.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* RIGHT — CONTACT FORM */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Send Us a Message</h2>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Select a topic...</option>
                      <option value="Billing or subscription issue">Billing or subscription issue</option>
                      <option value="Can't access my account">Can't access my account</option>
                      <option value="GPA verification question">GPA verification question</option>
                      <option value="Student profile question">Student profile question</option>
                      <option value="Employer account question">Employer account question</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? "Opening..." : "Send Message"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Or email us directly at{" "}
                    <a href="mailto:simplyapplyapp@gmail.com" className="text-primary hover:underline">
                      simplyapplyapp@gmail.com
                    </a>
                  </p>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Response time</p>
              <p>We aim to respond to all messages within 1–2 business days.</p>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}