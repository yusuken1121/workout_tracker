import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createExerciseOptionsReader,
  createWeekResolver,
  createWorkoutLogReader,
  createWorkoutLogWriter,
} from "./workout.factories"

describe("workout factories", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("createWorkoutLogWriter requires NOTION_WORKOUT_LOG_DATABASE_ID", () => {
    vi.stubEnv("NOTION_WORKOUT_LOG_DATABASE_ID", "")
    expect(() => createWorkoutLogWriter()).toThrow(
      "NOTION_WORKOUT_LOG_DATABASE_ID",
    )
  })

  it("createWorkoutLogReader requires NOTION_WORKOUT_LOG_DATA_SOURCE_ID", () => {
    vi.stubEnv("NOTION_WORKOUT_LOG_DATA_SOURCE_ID", "")
    expect(() => createWorkoutLogReader()).toThrow(
      "NOTION_WORKOUT_LOG_DATA_SOURCE_ID",
    )
  })

  it("createExerciseOptionsReader requires NOTION_EXERCISE_DATA_SOURCE_ID", () => {
    vi.stubEnv("NOTION_EXERCISE_DATA_SOURCE_ID", "")
    expect(() => createExerciseOptionsReader()).toThrow(
      "NOTION_EXERCISE_DATA_SOURCE_ID",
    )
  })

  it("createWeekResolver requires NOTION_WEEK_DATA_SOURCE_ID", () => {
    vi.stubEnv("NOTION_WEEK_DATA_SOURCE_ID", "")
    expect(() => createWeekResolver()).toThrow("NOTION_WEEK_DATA_SOURCE_ID")
  })

  it("builds adapters when the env and API key are present", () => {
    vi.stubEnv("NOTION_API_KEY", "secret")
    vi.stubEnv("NOTION_WORKOUT_LOG_DATA_SOURCE_ID", "ds-log")
    vi.stubEnv("NOTION_EXERCISE_DATA_SOURCE_ID", "ds-ex")
    vi.stubEnv("NOTION_WEEK_DATA_SOURCE_ID", "ds-week")

    expect(createWorkoutLogReader()).toBeDefined()
    expect(createExerciseOptionsReader()).toBeDefined()
    expect(createWeekResolver()).toBeDefined()
  })
})
