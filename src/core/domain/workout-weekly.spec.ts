import { describe, expect, it } from "vitest"
import type { WorkoutCalendarDay } from "./workout-calendar"
import {
  countActiveWeekStreak,
  percentChange,
  summarizeWeeks,
  topSetsByExercise,
  type WeeklySummary,
} from "./workout-weekly"

const days: WorkoutCalendarDay[] = [
  {
    date: "2026-08-25",
    exercises: [
      {
        exercisePageId: "bench",
        exerciseName: "ベンチプレス",
        sets: [
          { id: "1", weightKg: 60, reps: 8 },
          { id: "2", weightKg: 65, reps: 5 },
        ],
      },
    ],
  },
  {
    date: "2026-09-02",
    exercises: [
      {
        exercisePageId: "bench",
        exerciseName: "ベンチプレス",
        sets: [{ id: "3", weightKg: 65, reps: 6 }],
      },
      {
        exercisePageId: "squat",
        exerciseName: "スクワット",
        sets: [{ id: "4", weightKg: 100, reps: 5 }],
      },
    ],
  },
]

const ranges = [
  { fromIso: "2026-08-24", toIso: "2026-08-30", label: "8/24 – 8/30" },
  { fromIso: "2026-08-31", toIso: "2026-09-06", label: "8/31 – 9/6" },
  { fromIso: "2026-09-07", toIso: "2026-09-13", label: "9/7 – 9/13" },
]

describe("summarizeWeeks", () => {
  it("totals volume, gym days and sets per week range", () => {
    const weeks = summarizeWeeks(days, ranges)

    expect(weeks).toEqual([
      {
        ...ranges[0],
        totalVolumeKg: 60 * 8 + 65 * 5,
        gymDays: 1,
        setCount: 2,
      },
      { ...ranges[1], totalVolumeKg: 65 * 6 + 100 * 5, gymDays: 1, setCount: 2 },
      { ...ranges[2], totalVolumeKg: 0, gymDays: 0, setCount: 0 },
    ])
  })
})

describe("countActiveWeekStreak", () => {
  const week = (gymDays: number): WeeklySummary => ({
    fromIso: "",
    toIso: "",
    label: "",
    totalVolumeKg: 0,
    gymDays,
    setCount: 0,
  })

  it("counts trailing weeks with training", () => {
    expect(countActiveWeekStreak([week(0), week(2), week(3), week(1)])).toBe(3)
  })

  it("skips an empty current week without breaking the streak", () => {
    expect(countActiveWeekStreak([week(2), week(3), week(0)])).toBe(2)
  })

  it("is zero when the last two weeks are empty or there is no data", () => {
    expect(countActiveWeekStreak([week(2), week(0), week(0)])).toBe(0)
    expect(countActiveWeekStreak([])).toBe(0)
  })
})

describe("percentChange", () => {
  it("returns a rounded percentage", () => {
    expect(percentChange(1200, 1000)).toBe(20)
    expect(percentChange(900, 1000)).toBe(-10)
  })

  it("returns null when there is nothing to compare against", () => {
    expect(percentChange(500, 0)).toBeNull()
  })
})

describe("topSetsByExercise", () => {
  it("finds the heaviest set per exercise and sorts by total volume", () => {
    const tops = topSetsByExercise(days)

    expect(tops.map((t) => t.exerciseName)).toEqual([
      "ベンチプレス",
      "スクワット",
    ])
    expect(tops[0]).toMatchObject({
      bestWeightKg: 65,
      bestReps: 6,
      setCount: 3,
      totalVolumeKg: 60 * 8 + 65 * 5 + 65 * 6,
    })
  })
})
