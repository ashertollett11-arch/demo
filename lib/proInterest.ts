"use client"
import { authedFetch } from "@/lib/authedFetch"

/**
 * Records a Pro paywall view, at most once per surface per browser session.
 *
 * Without the guard a single page would log a hit on every render and every
 * revisit, which would make the count meaningless as an interest signal.
 */
export function recordProInterest(surface: string) {
  if (typeof window === "undefined") return
  const key = `pro-interest:${surface}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
  } catch {
    // private mode or blocked storage — recording twice is better than not at all
  }
  authedFetch("/api/pro-interest", { method: "POST" }).catch(() => {})
}
