import { Providers } from "@/components/providers"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "sonner"
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SimplyApply - The easiest way to land your first job',
  description: 'No resumes. No stress. Just opportunity. The employment platform designed for first-time workers ages 14-18 and entry-level employers.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
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
  

<body className="font-sans antialiased">
  <Providers>
    {children}
  </Providers>
  <Analytics />

  <Toaster
  position="top-right"
  richColors
  closeButton
/>      </body>
    </html>
  )
}
