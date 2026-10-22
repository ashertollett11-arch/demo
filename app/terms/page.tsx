"use client"
import Image from "next/image"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192x192.png" alt="SimplyApply logo" width={42} height={42} className="object-contain rounded-xl" />
            <span className="text-xl font-bold text-foreground">SimplyApply</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

        <div className="mt-10 space-y-10 text-foreground">

          <section>
            <h2 className="text-xl font-semibold">1. Agreement to These Terms</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              These terms govern your use of SimplyApply. By creating an account or using the
              service, you agree to them. If you do not agree, please do not use SimplyApply.
              They work alongside our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,
              which explains what we do with your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Who Can Use SimplyApply</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Student accounts are for people aged 14 to 21. If you are under 18, you confirm
              that a parent or legal guardian knows you are using SimplyApply and agrees to
              these terms on your behalf. Employer accounts are for businesses that are legally
              able to hire in the area they are hiring for.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You are responsible for the accuracy of what you put on your profile, and for
              keeping your login details to yourself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. What SimplyApply Does — and Doesn&apos;t Do</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              SimplyApply introduces students to local employers. That is the whole of what we do.
              We are not an employer, a recruiter, or a staffing agency, and we are not a party to
              any hiring decision, interview, offer, or job.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We do not run background checks on employers or students, and we do not verify that
              a job listing is genuine, that pay is accurate, or that an employer will respond.
              Treat anyone you meet through SimplyApply the way you would treat someone you found
              anywhere else: check who they are before you share personal details or turn up
              somewhere.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Responsibilities of Employers</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              If you hire through SimplyApply, you are solely responsible for complying with every
              law that applies to you. That includes youth employment and child labour rules, work
              permit and age certificate requirements, permitted hours for minors, minimum wage,
              and anti-discrimination law.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Many of the students on SimplyApply are under 18, and the rules for employing them
              differ by state and by role. Confirming which rules apply to you is your
              responsibility, not ours.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Student contact details and profile information are provided so you can contact
              candidates about work. Using them for anything else — marketing, resale, or passing
              them to a third party — is not permitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Recommendations</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Students may invite a teacher, coach, or former manager to write a recommendation.
              By requesting one you confirm the person knows you and is happy to be contacted. We
              pass their words on as written and do not verify, endorse, or edit them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Free and Paid Accounts</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              SimplyApply is free for students, always. Employers can use SimplyApply free with one
              hiring location. Employer Pro costs $20 per month and adds unlimited locations, match
              scores, full student profiles, and priority placement in student search results.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Pro renews automatically each month until cancelled. You can cancel at any time from
              Billing; your subscription then runs to the end of the period you have already paid
              for, after which the account returns to the free plan. Locations beyond the first are
              paused rather than deleted, and become active again if you resubscribe.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Payments are processed by Stripe. We do not see or store your card details. Charges
              already made are non-refundable except where required by law, though if something has
              gone wrong, contact us and we will look at it properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Acceptable Use</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">Do not use SimplyApply to:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>• Post a listing for a job that does not exist, or misrepresent pay, hours, or duties</li>
              <li>• Impersonate another person or business, or create an account for someone else</li>
              <li>• Contact students for anything other than legitimate employment</li>
              <li>• Harass, threaten, or discriminate against anyone</li>
              <li>• Scrape, copy, or resell profile data</li>
              <li>• Attempt to access accounts or data that are not yours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Suspending or Closing Accounts</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You can delete your account at any time from your profile, which removes your data as
              described in our Privacy Policy. We may suspend or remove an account that breaks
              these terms, or that we reasonably believe puts students at risk. Where a paid
              account is removed for a breach, we are not obliged to refund the remaining period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Disclaimer</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              SimplyApply is provided as-is. We do not promise that you will find a job, find a
              candidate, or that the service will be uninterrupted or error-free. Match scores,
              distances, and availability matching are estimates intended to help you decide who to
              contact — they are not guarantees of suitability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              To the fullest extent the law allows, SimplyApply is not liable for anything that
              happens between a student and an employer, including anything arising from a job,
              interview, workplace, or payment. Our total liability to you for any claim relating
              to the service is limited to the amount you have paid us in the twelve months before
              the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to These Terms</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We may update these terms as SimplyApply changes. If a change materially affects you,
              we will give notice by email or in the app before it takes effect. Continuing to use
              SimplyApply after that means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Questions about these terms, or anything that has gone wrong, can be sent to:
            </p>
            <p className="mt-3 font-medium text-foreground">simplyapplyapp@gmail.com</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We aim to respond within 5 business days.
            </p>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">&copy; 2026 SimplyApply. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
