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
      question: "I'm having trouble with billing or access.",
      answer:
        "Billing is handled through your employer dashboard under the Billing section. During early access, all employer accounts are free — just activate your account from the billing page. If you're still having trouble, email us with your account email.",
    },
    {
      icon: Users,
      question: "I'm an employer and can't access the dashboard.",
      answer:
        "Make sure your company profile is complete and you've activated your free early access from the billing page. You also need at least one location added before your profile is considered complete. If you're still locked out, email us.",
    },
    {
      icon: HelpCircle,
      question: "I'm a student and my profile isn't showing up for employers.",
      answer:
        "Your profile needs to be fully complete before it's visible to employers. Make sure all required fields are filled in — including your zip code, availability, preferred positions, and interests. Getting a recommendation from a teacher or coach also helps you stand out.",
    },
    {
      icon: HelpCircle,
      question: "How do recommendations work?",
      answer:
        "You can request a recommendation from a teacher, coach, or previous employer directly from your profile page. They'll receive an email with a link to fill out a short form — no account needed. Once submitted, your recommendation appears on your profile for employers to read.",
    },
    {
      icon: HelpCircle,
      question: "How do I delete my account?",
      answer:
        "You can delete your account at any time from your profile page. Scroll to the bottom and tap 'Delete Account'. This permanently removes all your data. You can also switch roles if you want to use SimplyApply as an employer instead.",
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