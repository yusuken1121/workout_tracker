import { describe, expect, it, vi } from "vitest"
import { GetWorkoutCalendarUseCase } from "./get-workout-calendar.use-case"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"

describe("GetWorkoutCalendarUseCase", () => {
  it("returns [] when from/to are missing", async () => {
    const logReader: IWorkoutLogReader = {
      listByExercise: vi.fn(),
      listByDateRange: vi.fn(),
    }
    const exerciseOptions: INotionOptionsReader = {
      listOptions: vi.fn(),
    }
    const useCase = new GetWorkoutCalendarUseCase(logReader, exerciseOptions)

    await expect(
      useCase.execute({ from: "", to: "2026-08-31" }),
    ).resolves.toEqual([])
    expect(logReader.listByDateRange).not.toHaveBeenCalled()
  })

  it("loads logs and exercise names, then groups by day", async () => {
    const logReader: IWorkoutLogReader = {
      listByExercise: vi.fn(),
      listByDateRange: vi.fn().mockResolvedValue([
        {
          id: "1",
          exercisePageId: "ex-1",
          weightKg: 50,
          reps: 5,
          performedAt: "2026-08-02",
        },
      ]),
    }
    const exerciseOptions: INotionOptionsReader = {
      listOptions: vi
        .fn()
        .mockResolvedValue([{ id: "ex-1", label: "ベンチプレス" }]),
    }
    const useCase = new GetWorkoutCalendarUseCase(logReader, exerciseOptions)

    const days = await useCase.execute({
      from: "2026-08-01",
      to: "2026-08-31",
    })

    expect(logReader.listByDateRange).toHaveBeenCalledWith(
      "2026-08-01",
      "2026-08-31",
    )
    expect(days).toEqual([
      {
        date: "2026-08-02",
        exercises: [
          {
            exercisePageId: "ex-1",
            exerciseName: "ベンチプレス",
            sets: [{ id: "1", weightKg: 50, reps: 5, notes: undefined }],
          },
        ],
      },
    ])
  })
})
