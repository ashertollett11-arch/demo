"use client"

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
  "Up to 10 hires per month",
  "Email support",
]

const additionalFeatures = [
  "Additional hires: $10 per hire after 10",
  "No long-term contracts",
  "Cancel anytime",
]

const benefits = [
  {
    icon: Users,
    title: "No Resumes to Review",
    description: "Students create simple profiles with verified GPA and availability. You see what matters.",
  },
  {
    icon: Clock,
    title: "Hire Faster",
    description: "Average time to hire is just 2.5 days. Get students working when you need them.",
  },
  {
    icon: Shield,
    title: "Access Verified Students",
    description: "All students have verified GPAs and are ready to work. No more guessing.",
  },
]

const faqs = [
  {
    question: "What does the $99/month include?",
    answer: "Your monthly subscription includes unlimited access to all verified student profiles, our smart matching algorithm, instant messaging, and up to 10 hires per month. If you need more than 10 hires, additional hires are just $10 each.",
  },
  {
    question: "How does the verification process work?",
    answer: "Students submit their school information and GPA, which we verify directly with their educational institution. This ensures you&apos;re seeing accurate, trustworthy information about each candidate.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes! There are no long-term contracts. You can cancel your subscription at any time, and you&apos;ll continue to have access until the end of your billing period.",
  },
  {
    question: "What types of jobs can I post?",
    answer: "SimplyApply is designed for part-time and entry-level positions suitable for students ages 14-18. This includes retail, food service, summer jobs, and other similar opportunities.",
  },
  {
    question: "How quickly can I start hiring?",
    answer: "You can start browsing candidates immediately after signing up. Most employers find suitable candidates within 24-48 hours and complete their first hire within 3 days.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How it Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-foreground">
              Pricing
            </Link>
            <Link href="/matching" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Find Candidates
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/employer">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/employer">Start Hiring</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              Simple, transparent pricing
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              One plan. Everything you need.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              No complicated tiers. No hidden fees. Just simple pricing that helps you hire great students.
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <Card className="relative overflow-hidden border-2 border-primary bg-card shadow-xl">
              <div className="absolute right-4 top-4">
                <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>
              </div>
              <CardHeader className="pb-4 pt-8 text-center">
                <CardTitle className="text-2xl font-bold">Employer Plan</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Includes up to 10 hires per month
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl bg-secondary/50 p-4">
                  <p className="text-sm font-medium text-foreground">Additional hires</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Need more than 10 hires? Additional hires are just <span className="font-semibold text-foreground">$10 each</span>.
                  </p>
                </div>

                <Button size="lg" className="w-full gap-2" asChild>
                  <Link href="/employer">
                    Start Hiring Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <ul className="space-y-2 pt-2 text-center text-sm text-muted-foreground">
                  {additionalFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Why employers choose SimplyApply
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                We&apos;ve made hiring students simple so you can focus on running your business.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-2 text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              {[
                { stat: "500+", label: "Partner Employers" },
                { stat: "2.5 Days", label: "Avg. Time to Hire" },
                { stat: "94%", label: "Employer Satisfaction" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-3xl font-bold text-primary-foreground sm:text-4xl">{item.stat}</p>
                  <p className="mt-2 text-primary-foreground/80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-muted-foreground">
                Everything you need to know about SimplyApply pricing.
              </p>
            </div>

            <Accordion type="single" collapsible className="mt-10">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Zap className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to start hiring?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Join 500+ employers who have already discovered a better way to hire young talent.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full gap-2 px-8 sm:w-auto" asChild>
                <Link href="/employer">
                  Get Started for $99/mo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full px-8 sm:w-auto" asChild>
                <Link href="/matching">View Candidates First</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SimplyApply</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 SimplyApply. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
