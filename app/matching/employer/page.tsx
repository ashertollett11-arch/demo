export const dynamic = "force-dynamic"

import { Suspense } from "react"
import MatchingClient from "./MatchingClient"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MatchingClient />
    </Suspense>
  )
}