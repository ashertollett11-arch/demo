"use client"

import Link from "next/link"
import { Briefcase } from "lucide-react"

export default function PrivacyPolicyPage() {
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

      {/* CONTENT */}
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

        <div className="mt-10 space-y-10 text-foreground">

          <section>
            <h2 className="text-xl font-semibold">1. Who We Are</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              SimplyApply is a job matching platform that connects students ages 14–21 with local employers. We are committed to protecting the privacy of everyone who uses our platform, especially minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">We collect the following information when you use SimplyApply:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
              <li><span className="font-medium text-foreground">Account info:</span> email address and password (stored securely via Supabase Auth)</li>
              <li><span className="font-medium text-foreground">Student profile:</span> name, age, school, GPA, availability, preferred job types, and interests</li>
              <li><span className="font-medium text-foreground">Employer profile:</span> company name, contact info, job details, and billing information</li>
              <li><span className="font-medium text-foreground">Recommendations:</span> Recommendations are secured with a simple email link to a trusted adult, this is displayed to employers along with the students profile</li>
              <li><span className="font-medium text-foreground">Usage data:</span> pages visited and actions taken within the app, used to improve the platform</li>
              <li><span className="font-medium text-foreground">Payment info:</span> processed securely by Stripe — we never store your card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">We use your information to:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
              <li>Match students with relevant job opportunities</li>
              <li>Allow employers to find and contact qualified student candidates</li>
              <li>Use recommendations to boost a students chance of finding a job</li>
              <li>Process employer subscription payments</li>
              <li>Send account-related notifications and updates</li>
              <li>Improve and maintain the platform</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We do not sell your personal information to third parties. We do not use your data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Children's Privacy (COPPA)</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              SimplyApply is designed for students as young as 14. We take the privacy of minors seriously and comply with the Children's Online Privacy Protection Act (COPPA).
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
              <li>We do not knowingly collect information from children under 13</li>
              <li>Student profiles are only visible to subscribed employers on our platform</li>
              <li>Parents or guardians may contact us to request deletion of their child's data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Who Can See Your Information</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Students:</span> Your profile (name, school, address, GPA, age, preferred positions, availability, shift preference and contact information) is visible to employers who have an active SimplyApply subscription.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Employers:</span> Your company name, location, pay per hour and tips, your description, your available shifts, and shift preference are shown to students browsing available jobs, as well as a preview of your job on the homepage of the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data Storage and Security</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Your data is stored securely using Supabase, a SOC 2 compliant database platform. Passwords are hashed and never stored in plain text. Payment processing is handled by Stripe, which is PCI-DSS compliant. We use row-level security to ensure users can only access their own data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account, your personal information will be permanently removed from our systems immediately upon deletion. Recommendations are deleted along with the account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent at any time by deleting your account</li>
            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Third-Party Services</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">We use the following third-party services:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-6">
              <li><span className="font-medium text-foreground">Supabase</span> — database and authentication</li>
              <li><span className="font-medium text-foreground">Stripe</span> — payment processing</li>
              <li><span className="font-medium text-foreground">Vercel</span> — hosting and deployment</li>
              <li><span className="font-medium text-foreground">Resend</span> — transactional email delivery (recommendation requests)</li>

            </ul>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Each of these services has their own privacy policy and security practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of significant changes by email or by displaying a notice on the platform. Continued use of SimplyApply after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact Us</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or how we handle your data, please contact us at:
            </p>
            <p className="mt-3 font-medium text-foreground">
            simplyapplyapp@gmail.com            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              We aim to respond to all privacy inquiries within 5 business days.
            </p>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}