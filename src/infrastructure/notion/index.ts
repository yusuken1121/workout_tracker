import type { INotionRecordWriter } from "../../core/ports/notion-record-writer.port"
import { ConfigurableNotionGateway } from "./configurable-notion.gateway"
import type { NotionDatabaseConfig } from "./notion-field-mapping.types"

export { ConfigurableNotionGateway } from "./configurable-notion.gateway"
export { NotionClientFactory } from "./notion-client.factory"
export { NotionPropertyBuilder } from "./notion-property.builder"
export { NotionWriteError } from "./notion-write.error"
export { NotionOptionsReader } from "./notion-options.reader"
export { NotionPageArchiver } from "./notion-page.archiver"
export { NotionWeekResolver } from "./week.resolver"
export { NotionWorkoutLogReader } from "./workout-log.reader"
export { NotionWorkoutLogUpdater } from "./workout-log.updater"
export {
  createExerciseOptionsReader,
  createWeekResolver,
  createWorkoutLogArchiver,
  createWorkoutLogReader,
  createWorkoutLogUpdater,
  createWorkoutLogWriter,
} from "./workout.factories"
export type {
  NotionDatabaseConfig,
  NotionFieldMapping,
  NotionFieldType,
} from "./notion-field-mapping.types"

/**
 * Generic factory for Dependency Injection (used by non-workout features
 * such as the contact form). Composition Root (Route Handler) should call
 * this — not Use Cases.
 */
export function createNotionRecordWriter<TRecord>(
  config: NotionDatabaseConfig<TRecord>,
): INotionRecordWriter<TRecord> {
  if (!config.databaseId) {
    throw new Error(
      "Notion database ID is not configured. Set the corresponding NOTION_*_DATABASE_ID environment variable.",
    )
  }

  return new ConfigurableNotionGateway(config)
}
