import { describe, expect, it } from "vitest"
import {
  createNotionRecordWriter,
  createNotionOptionsReader,
  createWeekResolver,
  createWorkoutLogReader,
} from "./index"

describe("createNotionRecordWriter", () => {
  it("throws when databaseId is empty", () => {
    expect(() =>
      createNotionRecordWriter({
        databaseId: "",
        fields: [],
      }),
    ).toThrow("NOTION_*_DATABASE_ID")
  })
})

describe("createNotionOptionsReader", () => {
  it("throws when dataSourceId is empty", () => {
    expect(() => createNotionOptionsReader("", "Name")).toThrow(
      "NOTION_*_DATA_SOURCE_ID",
    )
  })
})

describe("createWeekResolver", () => {
  it("throws when dataSourceId is empty", () => {
    expect(() => createWeekResolver("", "期間")).toThrow(
      "NOTION_*_DATA_SOURCE_ID",
    )
  })
})

describe("createWorkoutLogReader", () => {
  it("throws when dataSourceId is empty", () => {
    expect(() => createWorkoutLogReader("")).toThrow(
      "NOTION_WORKOUT_LOG_DATA_SOURCE_ID",
    )
  })
})
