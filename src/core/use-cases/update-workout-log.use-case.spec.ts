import { describe, expect, it, vi } from "vitest"
import { UpdateWorkoutLogUseCase } from "./update-workout-log.use-case"
import { InvalidWorkoutLogError } from "../domain/workout-log.entity"
import type { IWorkoutLogUpdater } from "../ports/workout-log-updater.port"

describe("UpdateWorkoutLogUseCase", () => {
  const patch = { weightKg: 62.5, reps: 6, notes: "楽だった" }

  it("validates then forwards the patch to the port", async () => {
    const updater: IWorkoutLogUpdater = {
      update: vi.fn().mockResolvedValue(undefined),
    }

    await new UpdateWorkoutLogUseCase(updater).execute("log-1", patch)

    expect(updater.update).toHaveBeenCalledWith("log-1", patch)
  })

  it("rejects a blank ID or invalid values without calling the port", async () => {
    const updater: IWorkoutLogUpdater = { update: vi.fn() }
    const useCase = new UpdateWorkoutLogUseCase(updater)

    await expect(useCase.execute("", patch)).rejects.toThrow(
      InvalidWorkoutLogError,
    )
    await expect(
      useCase.execute("log-1", { ...patch, reps: 0 }),
    ).rejects.toThrow(InvalidWorkoutLogError)
    await expect(
      useCase.execute("log-1", { ...patch, weightKg: -1 }),
    ).rejects.toThrow(InvalidWorkoutLogError)
    expect(updater.update).not.toHaveBeenCalled()
  })
})
