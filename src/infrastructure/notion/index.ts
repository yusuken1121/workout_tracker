import type { INotionRecordWriter } from "../../core/ports/notion-record-writer.port"
import type { INotionOptionsReader } from "../../core/ports/notion-options-reader.port"
import type { IWeekResolver } from "../../core/ports/week-resolver.port"
import type { IWorkoutLogReader } from "../../core/ports/workout-log-reader.port"
import { ConfigurableNotionGateway } from "./configurable-notion.gateway"
import { NotionOptionsReader } from "./notion-options.reader"
import { NotionWeekResolver } from "./week.resolver"
import { NotionWorkoutLogReader } from "./workout-log.reader"
import type { NotionDatabaseConfig } from "./notion-field-mapping.types"

export { ConfigurableNotionGateway } from "./configurable-notion.gateway"
export { NotionClientFactory } from "./notion-client.factory"
export { NotionPropertyBuilder } from "./notion-property.builder"
export { NotionWriteError } from "./notion-write.error"
export { NotionOptionsReader } from "./notion-options.reader"
export { NotionWeekResolver } from "./week.resolver"
export { NotionWorkoutLogReader } from "./workout-log.reader"
export type {
  NotionDatabaseConfig,
  NotionFieldMapping,
  NotionFieldType,
} from "./notion-field-mapping.types"

/**
 * Factory for Dependency Injection.
 * Composition Root (Route Handler) should call this — not Use Cases.
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

/** Factory for Dependency Injection. Composition Root should call this. */
export function createNotionOptionsReader(
  dataSourceId: string,
  titlePropertyName: string,
): INotionOptionsReader {
  if (!dataSourceId) {
    throw new Error(
      "Notion data source ID is not configured. Set the corresponding NOTION_*_DATA_SOURCE_ID environment variable.",
    )
  }

  return new NotionOptionsReader(dataSourceId, titlePropertyName)
}

/** Factory for Dependency Injection. Composition Root should call this. */
export function createWeekResolver(
  dataSourceId: string,
  datePropertyName: string,
): IWeekResolver {
  if (!dataSourceId) {
    throw new Error(
      "Notion data source ID is not configured. Set the corresponding NOTION_*_DATA_SOURCE_ID environment variable.",
    )
  }

  return new NotionWeekResolver(dataSourceId, datePropertyName)
}

/** Factory for Dependency Injection. Composition Root should call this. */
export function createWorkoutLogReader(
  dataSourceId: string,
): IWorkoutLogReader {
  if (!dataSourceId) {
    throw new Error(
      "Notion data source ID is not configured. Set NOTION_WORKOUT_LOG_DATA_SOURCE_ID.",
    )
  }

  return new NotionWorkoutLogReader(dataSourceId)
}
