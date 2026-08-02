import type { NotionDatabaseConfig } from "./notion-field-mapping.types"
import type { WorkoutLogRecord } from "@/core/use-cases/create-workout-log.use-case"

export const workoutLogNotionConfig: NotionDatabaseConfig<WorkoutLogRecord> = {
  databaseId: process.env.NOTION_WORKOUT_LOG_DATABASE_ID ?? "",
  fields: [
    { recordKey: "exercisePageId", propertyName: "種目", type: "relation" },
    { recordKey: "weightKg", propertyName: "kg", type: "number" },
    { recordKey: "reps", propertyName: "reps", type: "number" },
    { recordKey: "performedAt", propertyName: "実施日", type: "date" },
    {
      recordKey: "weekPageId",
      propertyName: "週",
      type: "relation",
      optional: true,
    },
    {
      recordKey: "notes",
      propertyName: "感想",
      type: "title",
      transform: (value) => (typeof value === "string" ? value : ""),
    },
  ],
}
