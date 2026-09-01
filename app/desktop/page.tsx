"use client"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  CheckCircle2,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Menu,
  X,
  Star,
  Clock,
  MapPin,
  Briefcase
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])
  
  useEffect(() => {
    const loadFeaturedJobs = async () => {
     // Replace the query with:
const { data, error } = await supabase
.from("locations")
.select(`
  id,
  address,
  hourly_pay,
  shift_preference,
  has_tips,
  job:employer_id (
    company
  )
`)
.limit(2)
.order("created_at", { ascending: false })


      if (error) {
        return
      }
  
      setFeaturedJobs(data || [])
    }
  
    loadFeaturedJobs()
  }, [])
  
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192x192.png" alt="SimplyApply logo" width={42} height={42} className="object-contain rounded-lg" />
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How it Works
            </Link>
            <Link href="/signup" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Create an account
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
            </Link>
          
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground">
                How it Works
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground">
                Pricing
              </Link>
              <Link href="/login" className="text-sm font-medium text-muted-foreground">
                For Students
              </Link>
              <Link href="/login" className="text-sm font-medium text-muted-foreground">
                For Employers
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
          Trusted by growing students and local employers
                    </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The easiest way to land your{" "}
            <span className="text-primary">first job</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            No resumes. No stress. Just opportunity. Connect with local employers looking for motivated students like you.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full gap-2 px-8 sm:w-auto" asChild>
              <Link href="/signup">
                Get Started as a Student
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full px-8 sm:w-auto" asChild>
              <Link href="/signup">Hire Students</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>Free for students</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>Verified profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>Local opportunities</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="border-t border-border bg-secondary/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How SimplyApply Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Three simple steps to your first job. No complicated applications or confusing processes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                description: "No resume needed. Just share your availability, interests, and have a trusted adult send in a recommendation.",
                icon: Users,
              },
              {
                step: "2",
                title: "Get Matched",
                description: "Our smart matching connects you with local employers looking for someone just like you.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Start Working",
                description: "Accept matches, schedule interviews, and land your first job in days, not months.",
                icon: Briefcase,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 text-5xl font-bold text-muted/20">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Students vs Employers Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Students */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent transition-shadow hover:shadow-lg">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-primary text-primary-foreground">For Students</Badge>
                <h3 className="text-2xl font-bold text-foreground">Land your first job with confidence</h3>
                <p className="mt-3 text-muted-foreground">
                  We know getting your first job feels scary. That&apos;s why we made it simple.
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "No resume or cover letter required",
                    "Verified recommendation badge builds trust",
                    "Match with jobs that fit your schedule",
                    "Local opportunities near you",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 gap-2" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* For Employers */}
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent transition-shadow hover:shadow-lg">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-accent text-accent-foreground">For Employers</Badge>
                <h3 className="text-2xl font-bold text-foreground">Hire motivated students faster</h3>
                <p className="mt-3 text-muted-foreground">
                  Stop sorting through stacks of resumes. Find the perfect candidate in minutes.
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "Access verified student profiles",
                    "Filter by availability and GPA",
                    "Hire faster with instant matching",
                    "Free to start",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-8 gap-2 border-accent text-accent-foreground hover:bg-accent/10" asChild>
                  <Link href="/login">
                    Start Hiring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Jobs Preview */}
      <section className="border-t border-border bg-secondary/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Jobs Available Now
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Real opportunities from local businesses looking for students like you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {featuredJobs.slice(0, 2).map((loc, index) => (
  <Card key={index} className="border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {Array.isArray(loc.job) ? loc.job[0]?.company : loc.job?.company}
          </h3>
          <p className="text-sm text-muted-foreground">{loc.address}</p>
        </div>
        <Badge variant="secondary" className="text-xs">Now Hiring</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {loc.address}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {loc.shift_preference || "Flexible"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-semibold text-primary">
          {loc.hourly_pay ? `$${loc.hourly_pay}/hr${loc.has_tips ? " + tips" : ""}` : "Competitive pay"}
        </span>
        <Button size="sm" variant="ghost" className="text-xs" asChild>
          <Link href="/signup">View Details</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/signup">View All Opportunities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
   
      {/* Stats Section */}
      <section className="border-t border-border bg-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-12 text-center sm:flex-row sm:gap-24">
            {[
              { stat: "Local Students", label: "Looking to work for you" },
              { stat: "Local Employers", label: "Looking to hire you" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-4xl font-bold text-primary-foreground">{item.stat}</p>
                <p className="mt-2 text-primary-foreground/80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join many of students and employers already using SimplyApply.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full gap-2 px-8 sm:w-auto" asChild>
              <Link href="/signup">
                Get Started as a Student
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full px-8 sm:w-auto" asChild>
              <Link href="/signup">Hire Students</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Briefcase className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">SimplyApply</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The easiest way for teenagers to land their first job.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">For Students</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/student" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Browse Jobs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">For Employers</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/employer" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Billing</Link></li>
              </ul>
            </div>

            <div>
  <h4 className="font-semibold text-foreground">Company</h4>

  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
    <li>
      <Link href="/about" className="hover:text-foreground">
        About
      </Link>
    </li>

    <li>
      <Link href="/contact" className="hover:text-foreground">
        Contact
      </Link>
    </li>

    <li>
      <Link href="/privacy" className="hover:text-foreground">
        Privacy Policy
      </Link>
    </li>
  </ul>
</div>
</div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 SimplyApply. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">COPPA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
