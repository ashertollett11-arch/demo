import { Providers } from "@/components/providers"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "sonner"
import NextTopLoader from "nextjs-toploader"
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'SimplyApply — Local Jobs for Students',
    template: '%s | SimplyApply',
  },
  description: 'SimplyApply connects students ages 14–21 with local part-time jobs matched to their schedule, availability, and interests. No resume needed.',
  keywords: [
    'SimplyApply', 'Simply Apply', 'student jobs', 'teen jobs', 'part time jobs for teens',
    'jobs for 14 year olds', 'jobs for 15 year olds', 'jobs for 16 year olds',
    'local jobs for students', 'first job', 'entry level jobs near me',
    'hiring teenagers', 'part time work', 'youth employment',
  ],
  authors: [{ name: 'SimplyApply', url: 'https://simplyapply.app' }],
  creator: 'SimplyApply',
  publisher: 'SimplyApply',
  metadataBase: new URL('https://simplyapply.app'),
  alternates: {
    canonical: 'https://simplyapply.app',
  },
  openGraph: {
    title: 'SimplyApply — Local Jobs for Students',
    description: 'Find local part-time jobs matched to your schedule, availability, and interests. Built for students ages 14–21.',
    url: 'https://simplyapply.app',
    siteName: 'SimplyApply',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SimplyApply — Local Jobs for Students',
    description: 'Find local part-time jobs matched to your schedule, availability, and interests. Built for students ages 14–21.',
    creator: '@simplyapply',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'Next.js',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SimplyApply',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SimplyApply" />
        <meta name="theme-color" content="#ffffff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SimplyApply",
              "alternateName": "Simply Apply",
              "url": "https://simplyapply.app",
              "description": "SimplyApply connects students ages 14–21 with local part-time jobs matched to their schedule and interests.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://simplyapply.app/matching/student?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
      <Providers>
          <NextTopLoader color="#000000" showSpinner={false} height={2} />
          {children}
        </Providers>
        <Analytics />
        <Toaster
          position="top-right"
          offset={16}
          toastOptions={{
            style: {
              // The theme tokens are complete oklch() colors, so they are used
              // directly — wrapping them in hsl() produces invalid CSS and the
              // toast renders with no background at all.
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 12px 32px -12px rgb(0 0 0 / 0.28)",
            },
            classNames: {
              success: "[&_[data-icon]]:text-green-600",
              error: "[&_[data-icon]]:text-red-600",
              info: "[&_[data-icon]]:text-primary",
              warning: "[&_[data-icon]]:text-amber-600",
              description: "text-muted-foreground font-normal",
              closeButton:
                "!bg-card !border-border !text-muted-foreground hover:!text-foreground",
            },
          }}
          closeButton
        />
      </body>
    </html>
  )
}