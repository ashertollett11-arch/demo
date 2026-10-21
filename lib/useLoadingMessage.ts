"use client"
import { useEffect, useState } from "react"

/**
 * Cycles through loading messages so a slow connection shows progress rather
 * than one frozen line.
 *
 * The first message is shown immediately, so a fast load looks exactly as it
 * did before. It holds on the last message instead of looping — restarting
 * the list on a long wait reads as though something reset.
 */
export function useLoadingMessage(messages: string[], intervalMs = 2200) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length <= 1) return
    const id = setInterval(
      () => setIndex((i) => (i < messages.length - 1 ? i + 1 : i)),
      intervalMs
    )
    return () => clearInterval(id)
  }, [messages.length, intervalMs])

  return messages[Math.min(index, messages.length - 1)]
}
