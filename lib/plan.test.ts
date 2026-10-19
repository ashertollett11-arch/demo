import { test } from "node:test"
import assert from "node:assert/strict"
import { isPro, hasEmployerAccess, activeLocations, FREE_LOCATION_LIMIT } from "./plan.ts"

const locs = [
  { id: "c", created_at: "2026-03-01T00:00:00Z" },
  { id: "a", created_at: "2026-01-01T00:00:00Z" },
  { id: "b", created_at: "2026-02-01T00:00:00Z" },
]

test("free keeps only the oldest location", () => {
  const active = activeLocations(locs, "freeactive")
  assert.equal(active.length, FREE_LOCATION_LIMIT)
  assert.equal(active[0].id, "a", "oldest location stays live")
})

test("pro keeps every location", () => {
  assert.equal(activeLocations(locs, "active").length, 3)
})

test("a lapsed subscription falls back to free, not locked out", () => {
  assert.equal(isPro("freeactive"), false)
  assert.equal(hasEmployerAccess("freeactive"), true, "free employers keep employer access")
  assert.equal(hasEmployerAccess("canceled"), false)
})

test("a single-location free employer loses nothing", () => {
  const one = [{ id: "only", created_at: "2026-01-01T00:00:00Z" }]
  assert.deepEqual(activeLocations(one, "freeactive"), one)
})

test("locations with no created_at still resolve to one for free", () => {
  const undated = [{ id: "x" }, { id: "y" }]
  assert.equal(activeLocations(undated, "freeactive").length, 1)
})
