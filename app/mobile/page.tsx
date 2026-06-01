"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import {
  CheckCircle2,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Menu,
  X,
  Clock,
  MapPin,
  Briefcase
} from "lucide-react"

export default function MobileLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])

  useEffect(() => {
    const loadFeaturedJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("id, title, company, location, pay, has_tips, shift_preference")
        .limit(6)
        .order("created_at", { ascending: false })

      if (error) {
        console.log(error)
        return
      }

      setFeaturedJobs(data || [])
    }

    loadFeaturedJobs()
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0614] text-white">

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-[#0b0614]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-192x192.png"
              alt="SimplyApply"
              width={28}
              height={28}
            />
            <span className="text-xl font-bold text-white">SimplyApply</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-purple-300 hover:text-white">
              How it Works
            </Link>
            <Link href="/" className="text-sm text-purple-300 hover:text-white">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login/mobile"
              className="text-sm text-purple-300 hover:text-white"
            >
              Log in
            </Link>

            <Link
              href="/login/mobile"
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg shadow-[0_0_25px_rgba(168,85,247,0.25)]"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-purple-900/40 bg-[#140a25] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-purple-300">
              <Link href="#how-it-works">How it Works</Link>
              <Link href="/">Pricing</Link>
              <Link href="/login/mobile">Log in</Link>
              <Link href="/login/mobile">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative px-4 py-20 text-center overflow-hidden">

        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto">

          <div className="mb-6 inline-flex border border-purple-800 bg-purple-900/30 text-purple-200 px-4 py-1 rounded-full text-sm">
            Trusted by students & employers
          </div>

          <h1 className="text-4xl font-bold">
            The easiest way to land your{" "}
            <span className="text-purple-400">first job</span>
          </h1>

          <p className="mt-6 text-purple-300">
            No resumes. No stress. Just opportunity.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login/mobile"
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg shadow-[0_0_25px_rgba(168,85,247,0.25)]"
            >
              Get Started as Student
            </Link>

            <Link
              href="/login/mobile"
              className="border border-purple-800 text-purple-300 px-6 py-3 rounded-lg hover:bg-[#1b1033]"
            >
              Hire Students
            </Link>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-4 py-20 bg-[#10081d] border-t border-purple-900/40">

        <h2 className="text-3xl font-bold text-center">How it Works</h2>
        <p className="text-purple-300 text-center mt-3">
          Three simple steps to get hired
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {[
            { icon: Users, title: "Create Profile", desc: "No resume needed" },
            { icon: Zap, title: "Get Matched", desc: "Smart matching system" },
            { icon: Briefcase, title: "Start Working", desc: "Get hired fast" }
          ].map((item, i) => {
            const Icon = item.icon

            return (
              <div
                key={i}
                className="bg-[#140a25] border border-purple-900/40 rounded-2xl p-6 hover:bg-[#1b1033] hover:shadow-[0_0_25px_rgba(168,85,247,0.20)] transition"
              >
                <Icon className="text-purple-300 mb-4" />
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-purple-300 mt-2">{item.desc}</p>
              </div>
            )
          })}

        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="px-4 py-20 bg-[#0b0614] border-t border-purple-900/40">

        <h2 className="text-3xl font-bold text-center">Jobs Available Now</h2>

        <div className="mt-10 grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">

          {featuredJobs.slice(0, 2).map((job, i) => (
            <div
              key={i}
              className="bg-[#140a25] border border-purple-900/40 rounded-2xl p-5 hover:bg-[#1b1033] hover:shadow-[0_0_25px_rgba(168,85,247,0.20)]"
            >
              <h3 className="text-white font-semibold">{job.title}</h3>
              <p className="text-purple-300 text-sm">{job.company}</p>

              <div className="flex items-center gap-2 text-purple-300 text-sm mt-3">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>

              <div className="flex justify-between mt-4">
                <span className="text-purple-300 font-medium">{job.pay}</span>
                <span className="text-xs border border-purple-800 bg-purple-900/30 text-purple-200 px-2 py-1 rounded-full">
                  New
                </span>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center border-t border-purple-900/40 bg-[#10081d]">

        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <p className="text-purple-300 mt-3">Join students already using SimplyApply</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login/mobile"
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg shadow-[0_0_25px_rgba(168,85,247,0.25)]"
          >
            Get Started
          </Link>

          <Link
            href="/login/mobile"
            className="border border-purple-800 text-purple-300 px-6 py-3 rounded-lg hover:bg-[#1b1033]"
          >
            Hire Students
          </Link>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 border-t border-purple-900/40 bg-[#0b0614] text-purple-300 text-sm text-center">
        © 2026 SimplyApply
      </footer>

    </div>
  )
}