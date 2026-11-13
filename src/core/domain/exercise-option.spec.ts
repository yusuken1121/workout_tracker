import { describe, expect, it } from "vitest"
import {
  annotateExerciseUsage,
  collectExerciseTags,
  filterExerciseOptions,
  normalizeSearchText,
  pickRecentExercises,
  type ExerciseOption,
} from "./exercise-option"
import type { WorkoutLogEntry } from "./workout-progress"

function entry(exercisePageId: string, performedAt: string): WorkoutLogEntry {
  return {
    id: `${exercisePageId}-${performedAt}`,
    exercisePageId,
    weightKg: 50,
    reps: 10,
    performedAt,
  }
}

const bench: ExerciseOption = {
  id: "bench",
  label: "ベンチプレス",
  tags: ["胸", "バーベル"],
}
const incline: ExerciseOption = {
  id: "incline",
  label: "インクライン・ダンベルプレス",
  tags: ["胸", "ダンベル"],
}
const squat: ExerciseOption = { id: "squat", label: "スクワット", tags: ["脚"] }
const latPull: ExerciseOption = { id: "lat", label: "Lat Pulldown" }

describe("annotateExerciseUsage", () => {
  it("adds last performed date and distinct day count", () => {
    const result = annotateExerciseUsage(
      [bench, squat],
      [
        entry("bench", "2026-11-01"),
        entry("bench", "2026-11-01"),
        entry("bench", "2026-11-08"),
        entry("", "2026-11-09"),
      ],
    )

    expect(result).toEqual([
      { ...bench, lastPerformedAt: "2026-11-08", recentDayCount: 2 },
      squat,
    ])
  })
})

describe("pickRecentExercises", () => {
  it("orders by most recent, then frequency, and limits", () => {
    const options: ExerciseOption[] = [
      { ...bench, lastPerformedAt: "2026-11-08", recentDayCount: 1 },
      { ...squat, lastPerformedAt: "2026-11-10", recentDayCount: 1 },
      { ...incline, lastPerformedAt: "2026-11-08", recentDayCount: 3 },
      latPull,
    ]

    expect(pickRecentExercises(options, 2).map((o) => o.id)).toEqual([
      "squat",
      "incline",
    ])
    expect(pickRecentExercises(options, 10)).toHaveLength(3)
  })
})

describe("collectExerciseTags", () => {
  it("returns distinct tags", () => {
    expect(
      collectExerciseTags([bench, incline, squat, latPull]).sort(),
    ).toEqual(["ダンベル", "バーベル", "胸", "脚"].sort())
  })
})

describe("normalizeSearchText", () => {
  it("folds katakana, width, case and separators", () => {
    expect(normalizeSearchText("ベンチ・プレス")).toBe("べんちぷれす")
    expect(normalizeSearchText("ＬＡＴ Pull-down")).toBe("latpulldown")
  })
})

describe("filterExerciseOptions", () => {
  const options = [bench, incline, squat, latPull]

  it("returns everything without a query or tag", () => {
    expect(filterExerciseOptions(options, {})).toEqual(options)
  })

  it("matches hiragana input against katakana names", () => {
    expect(
      filterExerciseOptions(options, { query: "ぷれす" }).map((o) => o.id),
    ).toEqual(["bench", "incline"])
  })

  it("ranks names starting with the query first", () => {
    const options2 = [incline, { id: "d", label: "ダンベルカール" }]
    expect(
      filterExerciseOptions(options2, { query: "だんべる" }).map((o) => o.id),
    ).toEqual(["d", "incline"])
  })

  it("requires every word to match, including tags", () => {
    expect(
      filterExerciseOptions(options, { query: "胸 だんべる" }).map((o) => o.id),
    ).toEqual(["incline"])
  })

  it("filters by tag", () => {
    expect(
      filterExerciseOptions(options, { tag: "胸" }).map((o) => o.id),
    ).toEqual(["bench", "incline"])
  })

  it("is case-insensitive for latin names", () => {
    expect(
      filterExerciseOptions(options, { query: "lat" }).map((o) => o.id),
    ).toEqual(["lat"])
  })
})
