import { describe, expect, it } from "vitest"
import {
  workoutCalendarQuerySchema,
  workoutLogIdSchema,
  workoutProgressQuerySchema,
} from "./workout-log.schema"

describe("workoutCalendarQuerySchema", () => {
  it("accepts an ordered YYYY-MM-DD range", () => {
    expect(
      workoutCalendarQuerySchema.parse({
        from: "2026-08-01",
        to: "2026-08-31",
      }),
    ).toEqual({ from: "2026-08-01", to: "2026-08-31" })
  })

  it("rejects a range where from is after to", () => {
    const result = workoutCalendarQuerySchema.safeParse({
      from: "2026-09-01",
      to: "2026-08-31",
    })
    expect(result.success).toBe(false)
  })

  it("rejects malformed dates and missing params", () => {
    expect(
      workoutCalendarQuerySchema.safeParse({ from: "2026/08/01", to: "x" })
        .success,
    ).toBe(false)
    expect(workoutCalendarQuerySchema.safeParse({}).success).toBe(false)
  })
})

describe("workoutProgressQuerySchema", () => {
  it("trims and requires exercisePageId", () => {
    expect(
      workoutProgressQuerySchema.parse({ exercisePageId: " ex-1 " }),
    ).toEqual({ exercisePageId: "ex-1" })
    expect(
      workoutProgressQuerySchema.safeParse({ exercisePageId: "  " }).success,
    ).toBe(false)
  })
})

describe("workoutLogIdSchema", () => {
  it("rejects blank IDs", () => {
    expect(workoutLogIdSchema.safeParse("").success).toBe(false)
    expect(workoutLogIdSchema.parse(" log-1 ")).toBe("log-1")
  })
})
