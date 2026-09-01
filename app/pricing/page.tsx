"use client"

import Link from "next/link"
import { Briefcase, CheckCircle2, ArrowRight, Zap, Users, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192x192.png" alt="SimplyApply logo" width={42} height={42} className="object-contain rounded-lg" />
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
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
            Early Access — Free to Start
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We're in early access and want to grow alongside our users. Get full access today — free while we build together.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pricing may increase in the future as we add more features. Early users lock in the best deal.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">

          {/* STUDENTS — FREE */}
          <Card className="border-border bg-card relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-chart-2" />
            <CardContent className="p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-2/10 mb-4">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
              <h2 className="text-xl font-bold text-foreground">For Students</h2>
              <p className="text-muted-foreground text-sm mt-1">Ages 14–21 looking for their first job</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-foreground">Free</span>
                <span className="text-muted-foreground ml-2 text-sm">always</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Create a full student profile",
                  "Browse jobs near you",
                  "Get matched to local employers",
                  "Recommendation badge",
                  "Apply with one tap",
                  "No resume needed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-chart-2 hover:bg-chart-2/90 text-white" asChild>
                <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* EMPLOYERS — FREE EARLY ACCESS */}
          <Card className="border-primary/30 bg-card relative overflow-hidden shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground text-xs">Early Access</Badge>
            </div>
            <CardContent className="p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">For Employers</h2>
              <p className="text-muted-foreground text-sm mt-1">Local businesses hiring motivated students</p>
              <div className="mt-6 mb-1">
                <span className="text-4xl font-bold text-foreground">Free</span>
                <span className="text-muted-foreground ml-2 text-sm">during early access</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Pricing will increase as we grow. Early users get the best deal.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Full access to student profiles",
                  "Smart availability matching",
                  "Hiring pipeline tools",
                  "Candidates with recommendations",
                  "Location-based filtering",
                  "Unlimited candidate browsing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" asChild>
                <Link href="/signup">Start Hiring Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* EARLY ACCESS NOTE */}
        <div className="mt-12 rounded-2xl bg-secondary/40 border border-border p-6 text-center max-w-3xl mx-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Why free?</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            We're early and focused on building something great. Right now the most important thing is getting real students and employers on the platform so we can make it better. We'd rather grow with you than charge you before we've earned it.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Pricing may be introduced in the future. We'll give existing users plenty of notice before anything changes.
          </p>
        </div>

        {/* FEATURE COMPARISON */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Everything included</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: "No Resume Needed",
                description: "Students create a simple profile with availability, GPA, and job interests. No cover letters or resumes required.",
              },
              {
                icon: Zap,
                title: "Smart Matching",
                description: "Our algorithm connects students and employers based on schedule fit, location, and job preferences.",
              },
              {
                icon: Star,
                title: "Student recommendations",
                description: "Students can get recommended using a simple email link, building trust with employers instantly.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes — completely free during early access for both students and employers. No credit card required.",
              },
              {
                q: "Will it always be free?",
                a: "Probably not forever. As we grow and add more features, we'll introduce pricing. We'll give everyone plenty of notice and early users will always be treated fairly.",
              },
              {
                q: "What happens if pricing changes?",
                a: "We'll notify all users well in advance. Early adopters who helped us grow will always be appreciated — we'll make sure any pricing changes are fair.",
              },
              {
                q: "Is it free for students?",
                a: "Yes, SimplyApply is always free for students. We want to remove every barrier between a student and their first job.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                <p className="font-semibold text-foreground text-sm">{faq.q}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Join for free today. No credit card, no commitment.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started as a Student</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">Start Hiring Students</Link>
            </Button>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}