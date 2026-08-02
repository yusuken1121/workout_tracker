import { describe, expect, it } from "vitest"
import { groupLogsIntoCalendarDays } from "./workout-calendar"
import type { WorkoutLogEntry } from "./workout-progress"

describe("groupLogsIntoCalendarDays", () => {
  const entries: WorkoutLogEntry[] = [
    {
      id: "1",
      exercisePageId: "ex-bench",
      weightKg: 60,
      reps: 8,
      performedAt: "2026-08-01",
    },
    {
      id: "2",
      exercisePageId: "ex-bench",
      weightKg: 65,
      reps: 5,
      performedAt: "2026-08-01",
    },
    {
      id: "3",
      exercisePageId: "ex-squat",
      weightKg: 100,
      reps: 5,
      performedAt: "2026-08-01",
    },
    {
      id: "4",
      exercisePageId: "ex-deadlift",
      weightKg: 120,
      reps: 3,
      performedAt: "2026-08-03",
    },
  ]

  const names = new Map([
    ["ex-bench", "ベンチプレス"],
    ["ex-squat", "スクワット"],
    ["ex-deadlift", "デッドリフト"],
  ])

  it("groups entries by date and exercise with resolved names", () => {
    const days = groupLogsIntoCalendarDays(entries, names)

    expect(days).toHaveLength(2)
    expect(days[0].date).toBe("2026-08-01")
    expect(days[0].exercises.map((e) => e.exerciseName)).toEqual([
      "スクワット",
      "ベンチプレス",
    ])
    expect(
      days[0].exercises.find((e) => e.exercisePageId === "ex-bench")?.sets,
    ).toHaveLength(2)
    expect(days[1]).toEqual({
      date: "2026-08-03",
      exercises: [
        {
          exercisePageId: "ex-deadlift",
          exerciseName: "デッドリフト",
          sets: [{ id: "4", weightKg: 120, reps: 3, notes: undefined }],
        },
      ],
    })
  })

  it("falls back to 不明な種目 when the name is unknown", () => {
    const days = groupLogsIntoCalendarDays(
      [
        {
          id: "1",
          exercisePageId: "missing",
          weightKg: 10,
          reps: 10,
          performedAt: "2026-08-02",
        },
      ],
      new Map(),
    )

    expect(days[0].exercises[0].exerciseName).toBe("不明な種目")
  })
})
