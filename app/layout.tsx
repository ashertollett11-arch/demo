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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SimplyApply — Local Jobs for Students',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SimplyApply — Local Jobs for Students',
    description: 'Find local part-time jobs matched to your schedule, availability, and interests. Built for students ages 14–21.',
    images: ['/og-image.png'],
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
      { url: '/icon.svg', type: 'image/svg+xml' },
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
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
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
            },
            classNames: {
              success: "border-green-200 bg-green-50 text-green-900",
              error: "border-red-200 bg-red-50 text-red-900",
            },
          }}
          closeButton
        />      </body>
    </html>
  )
}