"use client"
import Image from "next/image"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Check,
  Zap,
  Users,
  Clock,
  Shield,
  ArrowRight,
  HelpCircle
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const features = [
  "Access to all verified student profiles",
  "Smart matching algorithm",
  "Instant messaging with candidates",
  "GPA verification included",
  "Email support",
]

const additionalFeatures = [
  "No long-term contracts",
  "Cancel anytime",
]

const benefits = [
  {
    icon: Users,
    title: "No Resumes to Review",
    description:
      "Students create simple profiles with verified GPA and availability. You see what matters.",
  },
  {
    icon: Clock,
    title: "Hire Faster",
    description:
      "Average time to hire is just 2.5 days. Get students working when you need them.",
  },
  {
    icon: Shield,
    title: "Access Verified Students",
    description:
      "All students have verified GPAs and are ready to work. No more guessing.",
  },
]

const faqs = [
  {
    question: "What does the $9.99/month include?",
    answer:
      "Your monthly subscription includes unlimited access to all verified student profiles, our smart matching algorithm, all contact information.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "Students submit their school information and GPA, which is submitted through a screenshot that is verified by a human.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes! There are no long-term contracts. You can cancel at any time and keep access until the end of your billing period.",
  },
  {
    question: "What types of jobs can I post?",
    answer:
      "SimplyApply is designed for part-time and entry-level positions suitable for students ages 14–18.",
  },
  {
    question: "How quickly can I start hiring?",
    answer:
      "Most employers find suitable candidates within 24–48 hours and complete their first hire within 3 days.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0b0614] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-[#0b0614]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        <Link href="/mobile" className="flex items-center gap-2">
            <Image
              src="/icon-192x192.png"
              alt="SimplyApply"
              width={28}
              height={28}
            />
            <span className="text-xl font-bold text-white">SimplyApply</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
          
            <Link href="/pricing/mobile" className="text-sm text-white">
              Pricing
            </Link>
            <Link href="/login/mobile" className="text-sm text-purple-300 hover:text-white">
Start Now            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login/mobile">Log in</Link>
            </Button>
            <Button asChild className="bg-purple-600 hover:bg-purple-500">
              <Link href="/login/mobile">Start Hiring</Link>
            </Button>
          </div>

        </nav>
      </header>

      <main>

        {/* HERO */}
        <section className="px-6 py-20 text-center relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-3xl" />
          </div>

          <Badge className="mb-6 bg-purple-900/40 text-purple-200 border border-purple-800">
            Simple, transparent pricing
          </Badge>

          <h1 className="text-4xl font-bold">
            One plan. Everything you need.
          </h1>

          <p className="mt-4 text-purple-300 max-w-2xl mx-auto">
            No complicated tiers. No hidden fees. Just simple pricing that helps you hire great students.
          </p>
        </section>

        {/* PRICING CARD */}
        <section className="px-6 pb-20">
          <div className="max-w-lg mx-auto">

            <Card className="bg-[#140a25] border border-purple-900/40 shadow-xl relative">

              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-600 text-white">
                  Most Popular
                </Badge>
              </div>

              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">
                  Employer Plan
                </CardTitle>

                <div className="mt-4 text-5xl font-bold text-white">
                  $9.99
                  <span className="text-sm text-purple-300 font-normal">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">

                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3 text-purple-200">
                      <Check className="h-5 w-5 text-purple-400 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button className="w-full bg-purple-600 hover:bg-purple-500" asChild>
                  <Link href="/login/mobile">
                    Start Hiring Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <div className="text-center text-sm text-purple-300 space-y-1">
                  {additionalFeatures.map((f) => (
                    <p key={f}>{f}</p>
                  ))}
                </div>

              </CardContent>
            </Card>

          </div>
        </section>

        {/* BENEFITS */}
        <section className="border-t border-purple-900/40 bg-[#0b0614] px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              Why employers choose SimplyApply
            </h2>
            <p className="text-purple-300 mt-2">
              Hiring made simple for busy business owners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((b) => (
              <Card key={b.title} className="bg-[#140a25] border border-purple-900/40">
                <CardContent className="p-6">
                  <b.icon className="h-6 w-6 text-purple-400" />
                  <h3 className="mt-4 text-white font-semibold">{b.title}</h3>
                  <p className="text-purple-300 text-sm mt-2">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="bg-purple-600 px-6 py-16 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { stat: "Local Employers", label: "Trust SimplyApply" },
              { stat: "2.5 Days", label: "Avg Time to Hire" },
              { stat: "Students", label: "Ready to Work" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white">{s.stat}</p>
                <p className="text-purple-200">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <HelpCircle className="mx-auto text-purple-400" />
            <h2 className="text-3xl font-bold mt-2">FAQs</h2>
          </div>

          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-purple-900/40">
                <AccordionTrigger className="text-white">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-purple-300">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="border-t border-purple-900/40 px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            Ready to start hiring?
          </h2>
          <p className="text-purple-300 mt-2">
            Join employers already using SimplyApply
          </p>

          <Button className="mt-6 bg-purple-600 hover:bg-purple-500" asChild>
            <Link href="/login/mobile">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-purple-900/40 px-6 py-10 text-center text-purple-300">
        <p>© 2026 SimplyApply</p>
      </footer>

    </div>
  )
}