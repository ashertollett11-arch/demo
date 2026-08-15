"use client"

import Link from "next/link"
import { Briefcase, Heart, Zap, Shield, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
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

      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Built for the student who just needs a chance
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SimplyApply was founded on a simple observation: getting your first job is harder than it should be. Too many young people are turned away not because they lack drive — but because they lack experience. And you can't get experience without someone giving you a shot.
          </p>
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="border-t border-border bg-secondary/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground">The Problem We Saw</h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The traditional job application process wasn't designed for first-time workers. Resumes, cover letters, professional references — these are tools built for people who already have careers. For a 15-year-old applying for their first job, they're just barriers.
            </p>
            <p>
              At the same time, local employers — restaurants, retail stores, small businesses — are constantly looking for reliable, motivated young people to join their teams. The mismatch wasn't a lack of opportunity or a lack of willing workers. It was a broken system connecting the two.
            </p>
            <p>
              SimplyApply was built to fix that. No resumes. No cover letters. Just a simple profile that shows who you are, when you're available, and what you're interested in — matched directly with employers who need exactly that.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground">What We Stand For</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Heart,
                title: "Students First",
                description: "Everything we build starts with the question: does this make it easier for a student to find work?",
              },
              {
                icon: Shield,
                title: "Safety & Trust",
                description: "We take the safety of young people seriously. Verified profiles, secure data, and COPPA compliance aren't optional.",
              },
              {
                icon: Zap,
                title: "Simplicity",
                description: "If it's complicated, we cut it. The best product is the one that gets out of the way.",
              },
              {
                icon: Users,
                title: "Local Focus",
                description: "We believe in strengthening local communities by connecting the people in them.",
              },
            ].map((value) => (
              <Card key={value.title} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="border-t border-border bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">Our Mission</h2>
          <p className="mt-6 text-lg text-primary-foreground/80 leading-relaxed">
            To make the first step into the workforce as easy as possible for every student — regardless of their background, experience, or connections.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Get in Touch</h2>
          <p className="mt-4 text-muted-foreground">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you.
          </p>
          <a
            href="mailto:simplyapplyapp@gmail.com"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            SimplyApplyApp@gmail.com
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Join students and employers already using SimplyApply.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started as a Student</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">Hire Students</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}