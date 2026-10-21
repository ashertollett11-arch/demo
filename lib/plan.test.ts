import { test } from "node:test"
import assert from "node:assert/strict"
import { isPro, hasEmployerAccess, activeLocations, FREE_LOCATION_LIMIT, compareByMatchThenPro, PRO_TIEBREAK_BAND } from "./plan.ts"

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

test("pro wins an exact tie, score still decides across bands", () => {
  const free = (matchScore: number) => ({ id: `f${matchScore}`, matchScore, isPro: false })
  const pro  = (matchScore: number) => ({ id: `p${matchScore}`, matchScore, isPro: true })

  // identical fit -> the paying employer is listed first
  assert.ok(compareByMatchThenPro(pro(85), free(85)) < 0)
  // a clearly better match still beats a pro listing
  assert.ok(compareByMatchThenPro(free(95), pro(85)) < 0)

  const order = [free(95), pro(85), free(85), pro(60)]
    .sort(compareByMatchThenPro).map(j => j.id)
  assert.deepEqual(order, ["f95", "p85", "f85", "p60"])
})

test("the comparator is a valid total order (transitive)", () => {
  // a naive "within N points" rule is non-transitive and makes Array.sort
  // unpredictable; this guards against regressing to one
  const items = []
  for (let s = 0; s <= 100; s += 1) for (const isPro of [true, false]) items.push({ matchScore: s, isPro })
  for (const a of items) for (const b of items) {
    const ab = Math.sign(compareByMatchThenPro(a, b))
    const ba = Math.sign(compareByMatchThenPro(b, a))
    // summed rather than negated: Math.sign(0) is 0 and -0, which strict
    // equality treats as different values
    assert.equal(ab + ba, 0, `antisymmetry failed for ${a.matchScore}/${a.isPro} vs ${b.matchScore}/${b.isPro}`)
  }
})

test("a pro listing never outranks a materially better match", () => {
  const gap = PRO_TIEBREAK_BAND * 2
  for (let s = gap; s <= 100; s++) {
    assert.ok(
      compareByMatchThenPro({ matchScore: s, isPro: false }, { matchScore: s - gap, isPro: true }) < 0,
      `a free ${s}% should beat a pro ${s - gap}%`
    )
  }
})
