import type { WorkoutLogRecord } from "../../core/use-cases/create-workout-log.use-case"
import type { INotionOptionsReader } from "../../core/ports/notion-options-reader.port"
import type { INotionPageArchiver } from "../../core/ports/notion-page-archiver.port"
import type { INotionRecordWriter } from "../../core/ports/notion-record-writer.port"
import type { IWeekResolver } from "../../core/ports/week-resolver.port"
import type { IWorkoutLogReader } from "../../core/ports/workout-log-reader.port"
import type { IWorkoutLogUpdater } from "../../core/ports/workout-log-updater.port"
import { ConfigurableNotionGateway } from "./configurable-notion.gateway"
import { NotionOptionsReader } from "./notion-options.reader"
import { NotionPageArchiver } from "./notion-page.archiver"
import { NotionWeekResolver } from "./week.resolver"
import { workoutLogNotionConfig } from "./workout-log.config"
import { NotionWorkoutLogReader } from "./workout-log.reader"
import { NotionWorkoutLogUpdater } from "./workout-log.updater"
import {
  EXERCISE_PROPERTIES,
  WEEK_PROPERTIES,
} from "./workout-notion.properties"

/**
 * Environment-backed factories for the workout feature. Route Handlers
 * (the Composition Root) call these so env-var names and Notion property
 * names live in one place instead of being repeated per endpoint.
 */

const ENV = {
  workoutLogDatabaseId: "NOTION_WORKOUT_LOG_DATABASE_ID",
  workoutLogDataSourceId: "NOTION_WORKOUT_LOG_DATA_SOURCE_ID",
  exerciseDataSourceId: "NOTION_EXERCISE_DATA_SOURCE_ID",
  weekDataSourceId: "NOTION_WEEK_DATA_SOURCE_ID",
} as const

function requireEnv(name: (typeof ENV)[keyof typeof ENV]): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured. Set it in .env.local.`)
  }
  return value
}

export function createWorkoutLogWriter(): INotionRecordWriter<WorkoutLogRecord> {
  requireEnv(ENV.workoutLogDatabaseId)
  return new ConfigurableNotionGateway(workoutLogNotionConfig)
}

export function createWorkoutLogReader(): IWorkoutLogReader {
  return new NotionWorkoutLogReader(requireEnv(ENV.workoutLogDataSourceId))
}

export function createWorkoutLogArchiver(): INotionPageArchiver {
  return new NotionPageArchiver()
}

export function createWorkoutLogUpdater(): IWorkoutLogUpdater {
  return new NotionWorkoutLogUpdater()
}

export function createExerciseOptionsReader(): INotionOptionsReader {
  return new NotionOptionsReader(
    requireEnv(ENV.exerciseDataSourceId),
    EXERCISE_PROPERTIES.name,
  )
}

export function createWeekResolver(): IWeekResolver {
  return new NotionWeekResolver(
    requireEnv(ENV.weekDataSourceId),
    WEEK_PROPERTIES.period,
  )
}
