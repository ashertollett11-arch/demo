"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-4 max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-3xl">⚠️</div>
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred. This has been logged and we'll look into it.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => window.location.href = "/"}>Go Home</Button>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </div>
    </div>
  )
}