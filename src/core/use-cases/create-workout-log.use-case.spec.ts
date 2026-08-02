import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  CreateWorkoutLogUseCase,
  type WorkoutLogRecord,
} from "./create-workout-log.use-case"
import type { INotionRecordWriter } from "../ports/notion-record-writer.port"
import type { IWeekResolver } from "../ports/week-resolver.port"
import {
  InvalidWorkoutLogError,
  assertValidWorkoutLog,
  type WorkoutLogInput,
} from "../domain/workout-log.entity"

describe("assertValidWorkoutLog", () => {
  const valid: WorkoutLogInput = {
    exercisePageId: "exercise-1",
    weightKg: 60,
    reps: 8,
    performedAt: "2026-01-01",
  }

  it("accepts a valid record", () => {
    expect(() => assertValidWorkoutLog(valid)).not.toThrow()
  })

  it("accepts zero weight for bodyweight exercises", () => {
    expect(() => assertValidWorkoutLog({ ...valid, weightKg: 0 })).not.toThrow()
  })

  it("rejects a missing exercise", () => {
    expect(() =>
      assertValidWorkoutLog({ ...valid, exercisePageId: "" }),
    ).toThrow(InvalidWorkoutLogError)
  })

  it("rejects negative weight", () => {
    expect(() => assertValidWorkoutLog({ ...valid, weightKg: -1 })).toThrow(
      InvalidWorkoutLogError,
    )
  })

  it("rejects zero or negative reps", () => {
    expect(() => assertValidWorkoutLog({ ...valid, reps: 0 })).toThrow(
      InvalidWorkoutLogError,
    )
  })

  it("rejects a missing performed date", () => {
    expect(() => assertValidWorkoutLog({ ...valid, performedAt: "" })).toThrow(
      InvalidWorkoutLogError,
    )
  })
})

describe("CreateWorkoutLogUseCase", () => {
  const pageRef = { id: "page-1", url: "https://notion.so/page-1" }
  let mockWriter: INotionRecordWriter<WorkoutLogRecord>
  let mockWeekResolver: IWeekResolver

  const input: WorkoutLogInput = {
    exercisePageId: "exercise-1",
    weightKg: 60,
    reps: 8,
    performedAt: "2026-01-01",
    notes: "felt strong",
  }

  beforeEach(() => {
    mockWriter = { create: vi.fn().mockResolvedValue(pageRef) }
    mockWeekResolver = {
      findWeekIdForDate: vi.fn().mockResolvedValue("week-1"),
    }
  })

  it("resolves the week and writes the enriched record via the port", async () => {
    const useCase = new CreateWorkoutLogUseCase(mockWriter, mockWeekResolver)

    const result = await useCase.execute(input)

    expect(mockWeekResolver.findWeekIdForDate).toHaveBeenCalledWith(
      "2026-01-01",
    )
    expect(mockWriter.create).toHaveBeenCalledWith({
      ...input,
      weekPageId: "week-1",
    })
    expect(result).toEqual(pageRef)
  })

  it("writes without a weekPageId when no matching week is found", async () => {
    mockWeekResolver.findWeekIdForDate = vi.fn().mockResolvedValue(undefined)
    const useCase = new CreateWorkoutLogUseCase(mockWriter, mockWeekResolver)

    await useCase.execute(input)

    expect(mockWriter.create).toHaveBeenCalledWith({
      ...input,
      weekPageId: undefined,
    })
  })

  it("does not write when domain validation fails", async () => {
    const useCase = new CreateWorkoutLogUseCase(mockWriter, mockWeekResolver)

    await expect(useCase.execute({ ...input, reps: 0 })).rejects.toThrow(
      InvalidWorkoutLogError,
    )

    expect(mockWriter.create).not.toHaveBeenCalled()
    expect(mockWeekResolver.findWeekIdForDate).not.toHaveBeenCalled()
  })
})
