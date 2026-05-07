"use client"

import { useToast } from "@/hooks/use-toast" // ONLY import here
import * as React from "react"

export function Toaster() {
  const { toasts } = useToast() // Use the hook from hooks/use-toast

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
     {toasts.map((toast) => (
  <div
    key={toast.id}
    className="bg-gray-800 text-white p-3 rounded shadow flex justify-between items-start"
  >
    <div>
      <div className="font-bold">{toast.title}</div>
      <div className="text-sm">{toast.description}</div>
    </div>

    <button
      onClick={() => toast.onOpenChange?.(false)}
      className="ml-4 text-sm opacity-70 hover:opacity-100"
    >
      ✕
    </button>
  </div>
))}
    </div>
  )
}