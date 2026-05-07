"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"

// This renders all active toasts in a corner
export function Toaster() {
  const { toasts = [] } = useToast()

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border p-3 rounded shadow-lg w-64"
        >
          {toast.title && <div className="font-bold">{toast.title}</div>}
          {toast.description && <div className="text-sm">{toast.description}</div>}
        </div>
      ))}
    </div>
  )
}