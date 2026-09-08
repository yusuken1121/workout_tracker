import type { Client, PageObjectResponse } from "@notionhq/client"
import type { WorkoutLogEntry } from "../../core/domain/workout-progress"
import type { IWorkoutLogReader } from "../../core/ports/workout-log-reader.port"
import { NotionClientFactory } from "./notion-client.factory"
import {
  queryDataSourcePages,
  type DataSourceQueryOptions,
} from "./notion-data-source.util"
import {
  extractDateStartIso,
  extractNumber,
  extractPlainText,
  extractRelationIds,
} from "./notion-page-property.util"
import {
  WORKOUT_LOG_PROPERTIES,
  type WorkoutLogPropertyNames,
} from "./workout-notion.properties"

type QueryFilter = NonNullable<DataSourceQueryOptions["filter"]>

/** Reads workout log rows from Notion, filtered by exercise or date range. */
export class NotionWorkoutLogReader implements IWorkoutLogReader {
  private readonly client: Client
  private readonly properties: WorkoutLogPropertyNames

  constructor(
    private readonly dataSourceId: string,
    client?: Client,
    properties?: Partial<WorkoutLogPropertyNames>,
  ) {
    this.client = client ?? NotionClientFactory.create()
    this.properties = { ...WORKOUT_LOG_PROPERTIES, ...properties }
  }

  async listByExercise(exercisePageId: string): Promise<WorkoutLogEntry[]> {
    return this.queryEntries({
      property: this.properties.exercise,
      relation: { contains: exercisePageId },
    })
  }

  async listByDateRange(
    fromIso: string,
    toIso: string,
  ): Promise<WorkoutLogEntry[]> {
    return this.queryEntries({
      and: [
        {
          property: this.properties.performedAt,
          date: { on_or_after: fromIso },
        },
        {
          property: this.properties.performedAt,
          date: { on_or_before: toIso },
        },
      ],
    })
  }

  private async queryEntries(filter: QueryFilter): Promise<WorkoutLogEntry[]> {
    const pages = await queryDataSourcePages(this.client, this.dataSourceId, {
      filter,
      sorts: [
        { property: this.properties.performedAt, direction: "ascending" },
      ],
    })

    return pages
      .map((page) => this.toEntry(page))
      .filter((entry): entry is WorkoutLogEntry => entry !== null)
  }

  private toEntry(page: PageObjectResponse): WorkoutLogEntry | null {
    const performedAt = extractDateStartIso(page, this.properties.performedAt)
    const weightKg = extractNumber(page, this.properties.weightKg)
    const reps = extractNumber(page, this.properties.reps)
    const relationIds = extractRelationIds(page, this.properties.exercise)

    if (!performedAt || weightKg === null || reps === null) {
      return null
    }

    const notes = extractPlainText(page, this.properties.notes)

    return {
      id: page.id,
      exercisePageId: relationIds[0] ?? "",
      weightKg,
      reps,
      performedAt,
      notes: notes || undefined,
    }
  }
}
