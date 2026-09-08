import type { NotionDatabaseConfig } from "./notion-field-mapping.types"
import { WORKOUT_LOG_PROPERTIES } from "./workout-notion.properties"
import type { WorkoutLogRecord } from "@/core/use-cases/create-workout-log.use-case"

export const workoutLogNotionConfig: NotionDatabaseConfig<WorkoutLogRecord> = {
  databaseId: process.env.NOTION_WORKOUT_LOG_DATABASE_ID ?? "",
  fields: [
    {
      recordKey: "exercisePageId",
      propertyName: WORKOUT_LOG_PROPERTIES.exercise,
      type: "relation",
    },
    {
      recordKey: "weightKg",
      propertyName: WORKOUT_LOG_PROPERTIES.weightKg,
      type: "number",
    },
    {
      recordKey: "reps",
      propertyName: WORKOUT_LOG_PROPERTIES.reps,
      type: "number",
    },
    {
      recordKey: "performedAt",
      propertyName: WORKOUT_LOG_PROPERTIES.performedAt,
      type: "date",
    },
    {
      recordKey: "weekPageId",
      propertyName: WORKOUT_LOG_PROPERTIES.week,
      type: "relation",
      optional: true,
    },
    {
      recordKey: "notes",
      propertyName: WORKOUT_LOG_PROPERTIES.notes,
      type: "title",
      transform: (value) => (typeof value === "string" ? value : ""),
    },
  ],
}
