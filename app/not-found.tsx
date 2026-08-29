import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-4 max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-3xl">🔍</div>
        <h1 className="text-xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}