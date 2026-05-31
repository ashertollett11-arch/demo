"use client"

import { useEffect, useState } from "react"

export default function IosInstallBanner() {
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()

    const ios = /iphone|ipad|ipod/.test(ua)
    const standalone = (window.navigator as any).standalone

    if (ios && !standalone) {
      setIsIos(true)
    }
  }, [])

  if (!isIos) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black text-white text-sm p-3 text-center">
      📲 Install SimplyApply on your iPhone: Tap the three dots (•••), then tap Share, scroll down if needed, then tap “Add to Home Screen”.
    </div>
  )
}