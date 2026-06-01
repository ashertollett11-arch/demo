"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isMobile) {
      window.location.replace("/mobile")
    } else {
      window.location.replace("/desktop")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0614]">
      <div className="flex flex-col items-center gap-4">
        {/* spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />

        {/* text */}
        <p className="text-purple-300 text-sm">
          Loading SimplyApply...
        </p>
      </div>
    </div>
  )
}