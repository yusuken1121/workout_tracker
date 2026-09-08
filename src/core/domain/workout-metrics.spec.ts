import { describe, expect, it } from "vitest"
import {
  estimateOneRepMaxKg,
  roundToOneDecimal,
  setVolumeKg,
} from "./workout-metrics"

describe("setVolumeKg", () => {
  it("multiplies weight by reps", () => {
    expect(setVolumeKg({ weightKg: 60, reps: 8 })).toBe(480)
  })

  it("is zero for bodyweight sets", () => {
    expect(setVolumeKg({ weightKg: 0, reps: 15 })).toBe(0)
  })
})

describe("estimateOneRepMaxKg", () => {
  it("uses the Epley formula for multi-rep sets", () => {
    // 100 × (1 + 5/30) = 116.666... → 116.7
    expect(estimateOneRepMaxKg({ weightKg: 100, reps: 5 })).toBe(116.7)
    // 60 × (1 + 10/30) = 80
    expect(estimateOneRepMaxKg({ weightKg: 60, reps: 10 })).toBe(80)
  })

  it("returns the weight itself for a single rep", () => {
    expect(estimateOneRepMaxKg({ weightKg: 120, reps: 1 })).toBe(120)
  })

  it("returns zero for bodyweight or invalid sets", () => {
    expect(estimateOneRepMaxKg({ weightKg: 0, reps: 12 })).toBe(0)
    expect(estimateOneRepMaxKg({ weightKg: 50, reps: 0 })).toBe(0)
  })
})

describe("roundToOneDecimal", () => {
  it("rounds half up to one decimal place", () => {
    expect(roundToOneDecimal(1.25)).toBe(1.3)
    expect(roundToOneDecimal(1.24)).toBe(1.2)
  })
})
