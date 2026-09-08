import { describe, expect, it, vi } from "vitest"
import { DeleteWorkoutLogUseCase } from "./delete-workout-log.use-case"
import { InvalidWorkoutLogError } from "../domain/workout-log.entity"
import type { INotionPageArchiver } from "../ports/notion-page-archiver.port"

describe("DeleteWorkoutLogUseCase", () => {
  it("archives the page through the port", async () => {
    const archiver: INotionPageArchiver = {
      archive: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new DeleteWorkoutLogUseCase(archiver)

    await useCase.execute("log-1")

    expect(archiver.archive).toHaveBeenCalledWith("log-1")
  })

  it("rejects a blank ID without calling the port", async () => {
    const archiver: INotionPageArchiver = { archive: vi.fn() }
    const useCase = new DeleteWorkoutLogUseCase(archiver)

    await expect(useCase.execute("  ")).rejects.toThrow(InvalidWorkoutLogError)
    expect(archiver.archive).not.toHaveBeenCalled()
  })
})
