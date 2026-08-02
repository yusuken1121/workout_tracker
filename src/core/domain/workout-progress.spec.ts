import { describe, expect, it } from "vitest"
import {
  aggregateWorkoutProgress,
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
      setCount: 3,
    })
    expect(points[1]).toEqual({
      date: "2026-01-10",
      weightKg: 70,
      reps: 3,
      volume: 210,
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
