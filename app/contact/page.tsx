"use client"
import Link from "next/link"
import { Briefcase, Mail, CreditCard, Users, HelpCircle, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

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
      "Your profile needs to be fully complete before it's visible to employers. Make sure all required fields are filled in — including your zip code, availability, preferred positions, and interests. Getting a recommendation also helps you stand out.",
  },
  {
    icon: HelpCircle,
    question: "How do recommendations work?",
    answer:
      "You can request a recommendation from a teacher, coach, or previous employer directly from your profile page. They'll receive an email with a link to fill out a short form — no account needed. Once submitted, your recommendation appears on your profile.",
  },
  {
    icon: HelpCircle,
    question: "How do I delete my account?",
    answer:
      "You can delete your account at any time from your profile page. Scroll to the bottom and tap 'Delete Account'. This permanently removes all your data. You can also switch roles if you want to use SimplyApply as an employer instead.",
  },
]

function FaqItem({ icon: Icon, question, answer }: { icon: any; question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border border-border bg-card px-4 py-4 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{question}</p>
            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
          {open && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{answer}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill out all required fields.")
      return
    }
    setSending(true)
    const mailto = `mailto:simplyapplyapp@gmail.com?subject=${encodeURIComponent(
      subject || "SimplyApply Contact"
    )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`
    window.location.href = mailto
    setSending(false)
    toast.success("Opening your email client...")
  }

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16 sm:px-6">

        {/* HERO */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto sm:text-base">
            Have a question or need help? Check the common questions below or send us a message directly.
          </p>
        </div>

        {/* CONTACT FORM — full width on mobile, grid on desktop */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">

          {/* FORM */}
          <div className="order-1 lg:order-2">
            <h2 className="text-lg font-bold text-foreground mb-4">Send Us a Message</h2>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
                    <option value="">Select a topic...</option>
                    <option value="Billing or subscription issue">Billing or subscription issue</option>
                    <option value="Can't access my account">Can't access my account</option>
                    <option value="Recommendation question">Recommendation question</option>
                    <option value="Student profile question">Student profile question</option>
                    <option value="Employer account question">Employer account question</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={5} className={inputClass + " resize-none"} />
                </div>
                <button type="submit" disabled={sending}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${sending ? "bg-foreground/50 text-background cursor-not-allowed" : "bg-foreground text-background"}`}>
                  {sending ? "Opening..." : "Send Message"}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Or email us at{" "}
                  <a href="mailto:simplyapplyapp@gmail.com" className="text-primary hover:underline">
                    simplyapplyapp@gmail.com
                  </a>
                </p>
              </form>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Response time: </span>
              We aim to respond within 1–2 business days.
            </div>
          </div>

          {/* FAQS — accordion on mobile */}
          <div className="order-2 lg:order-1">
            <h2 className="text-lg font-bold text-foreground mb-4">Common Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <FaqItem key={index} {...faq} />
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border mt-12 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
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