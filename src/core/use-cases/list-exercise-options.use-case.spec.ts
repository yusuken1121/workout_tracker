import { describe, expect, it, vi } from "vitest"
import { ListExerciseOptionsUseCase } from "./list-exercise-options.use-case"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"

const input = { usageFrom: "2026-09-14", usageTo: "2026-11-14" }

function makeReaders(listByDateRange: IWorkoutLogReader["listByDateRange"]) {
  const optionsReader: INotionOptionsReader = {
    listOptions: vi
      .fn()
      .mockResolvedValue([{ id: "bench", label: "ベンチプレス" }]),
  }
  const logReader: IWorkoutLogReader = {
    listByExercise: vi.fn(),
    listByDateRange: vi.fn(listByDateRange),
  }
  return { optionsReader, logReader }
}

describe("ListExerciseOptionsUseCase", () => {
  it("annotates options with recent usage from the given window", async () => {
    const { optionsReader, logReader } = makeReaders(async () => [
      {
        id: "l1",
        exercisePageId: "bench",
        weightKg: 60,
        reps: 8,
        performedAt: "2026-11-10",
      },
    ])

    const result = await new ListExerciseOptionsUseCase(
      optionsReader,
      logReader,
    ).execute(input)

    expect(logReader.listByDateRange).toHaveBeenCalledWith(
      "2026-09-14",
      "2026-11-14",
    )
    expect(result).toEqual([
      {
        id: "bench",
        label: "ベンチプレス",
        lastPerformedAt: "2026-11-10",
        recentDayCount: 1,
      },
    ])
  })

  it("still returns options when reading the log fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const { optionsReader, logReader } = makeReaders(async () => {
      throw new Error("Notion down")
    })

    const result = await new ListExerciseOptionsUseCase(
      optionsReader,
      logReader,
    ).execute(input)

    expect(result).toEqual([{ id: "bench", label: "ベンチプレス" }])
  })
})
