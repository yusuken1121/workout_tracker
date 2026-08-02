import { describe, expect, it, vi } from "vitest"
import { GetWorkoutProgressUseCase } from "./get-workout-progress.use-case"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"
import type { WorkoutLogEntry } from "../domain/workout-progress"

describe("GetWorkoutProgressUseCase", () => {
  it("returns [] when exercisePageId is blank without calling the reader", async () => {
    const reader: IWorkoutLogReader = {
      listByExercise: vi.fn(),
      listByDateRange: vi.fn(),
    }
    const useCase = new GetWorkoutProgressUseCase(reader)

    await expect(useCase.execute("  ")).resolves.toEqual([])
    expect(reader.listByExercise).not.toHaveBeenCalled()
  })

  it("aggregates entries from the reader", async () => {
    const entries: WorkoutLogEntry[] = [
      {
        id: "1",
        exercisePageId: "ex-1",
        weightKg: 50,
        reps: 5,
        performedAt: "2026-03-01",
      },
      {
        id: "2",
        exercisePageId: "ex-1",
        weightKg: 55,
        reps: 3,
        performedAt: "2026-03-08",
      },
    ]
    const reader: IWorkoutLogReader = {
      listByExercise: vi.fn().mockResolvedValue(entries),
      listByDateRange: vi.fn(),
    }
    const useCase = new GetWorkoutProgressUseCase(reader)

    const points = await useCase.execute("ex-1")

    expect(reader.listByExercise).toHaveBeenCalledWith("ex-1")
    expect(points).toHaveLength(2)
    expect(points[1].weightKg).toBe(55)
  })
})
