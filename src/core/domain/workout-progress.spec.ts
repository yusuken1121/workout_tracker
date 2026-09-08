import { describe, expect, it } from "vitest"
import {
  aggregateWorkoutProgress,
  latestProgressPoint,
  summarizeWorkoutProgress,
  type WorkoutLogEntry,
} from "./workout-progress"

describe("aggregateWorkoutProgress", () => {
  const entries: WorkoutLogEntry[] = [
    {
      id: "1",
      exercisePageId: "ex-1",
      weightKg: 60,
      reps: 8,
      performedAt: "2026-01-02",
    },
    {
      id: "2",
      exercisePageId: "ex-1",
      weightKg: 60,
      reps: 10,
      performedAt: "2026-01-02",
    },
    {
      id: "3",
      exercisePageId: "ex-1",
      weightKg: 65,
      reps: 5,
      performedAt: "2026-01-02",
    },
    {
      id: "4",
      exercisePageId: "ex-1",
      weightKg: 70,
      reps: 3,
      performedAt: "2026-01-10",
    },
  ]

  it("aggregates multiple sets on the same day into one point", () => {
    const points = aggregateWorkoutProgress(entries)

    expect(points).toHaveLength(2)
    expect(points[0]).toEqual({
      date: "2026-01-02",
      weightKg: 65,
      reps: 5,
      volume: 60 * 8 + 60 * 10 + 65 * 5,
      // best Epley 1RM of the day: 60×(1+10/30) = 80 beats 65×(1+5/30) = 75.8
      estimatedOneRepMaxKg: 80,
      setCount: 3,
    })
    expect(points[1]).toEqual({
      date: "2026-01-10",
      weightKg: 70,
      reps: 3,
      volume: 210,
      estimatedOneRepMaxKg: 77,
      setCount: 1,
    })
  })

  it("sorts points by date ascending", () => {
    const shuffled = [entries[3], entries[0]]
    const points = aggregateWorkoutProgress(shuffled)
    expect(points.map((p) => p.date)).toEqual(["2026-01-02", "2026-01-10"])
  })

  it("returns an empty array for no entries", () => {
    expect(aggregateWorkoutProgress([])).toEqual([])
  })
})

describe("latestProgressPoint", () => {
  it("returns the last point in chronological order", () => {
    const points = aggregateWorkoutProgress([
      {
        id: "1",
        exercisePageId: "ex-1",
        weightKg: 50,
        reps: 5,
        performedAt: "2026-02-01",
      },
      {
        id: "2",
        exercisePageId: "ex-1",
        weightKg: 55,
        reps: 5,
        performedAt: "2026-02-08",
      },
    ])

    expect(latestProgressPoint(points)?.date).toBe("2026-02-08")
  })

  it("returns null when there is no history", () => {
    expect(latestProgressPoint([])).toBeNull()
  })
})

describe("summarizeWorkoutProgress", () => {
  it("returns null with no points", () => {
    expect(summarizeWorkoutProgress([])).toBeNull()
  })

  it("derives max weight, max 1RM and weight delta", () => {
    const points = aggregateWorkoutProgress([
      {
        id: "1",
        exercisePageId: "ex-1",
        weightKg: 60,
        reps: 10,
        performedAt: "2026-01-01",
      },
      {
        id: "2",
        exercisePageId: "ex-1",
        weightKg: 70,
        reps: 3,
        performedAt: "2026-01-08",
      },
      {
        id: "3",
        exercisePageId: "ex-1",
        weightKg: 65,
        reps: 5,
        performedAt: "2026-01-15",
      },
    ])

    const summary = summarizeWorkoutProgress(points)

    expect(summary?.first.date).toBe("2026-01-01")
    expect(summary?.latest.date).toBe("2026-01-15")
    expect(summary?.maxWeightKg).toBe(70)
    expect(summary?.maxEstimatedOneRepMaxKg).toBe(80)
    expect(summary?.weightDeltaKg).toBe(5)
  })
})
