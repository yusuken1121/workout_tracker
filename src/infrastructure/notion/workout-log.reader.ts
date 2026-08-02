import type { Client, PageObjectResponse } from "@notionhq/client"
import type { WorkoutLogEntry } from "../../core/domain/workout-progress"
import type { IWorkoutLogReader } from "../../core/ports/workout-log-reader.port"
import { NotionClientFactory } from "./notion-client.factory"
import {
  extractDateStartIso,
  extractNumber,
  extractPlainText,
  extractRelationIds,
} from "./notion-page-property.util"

const MAX_PAGE_SIZE = 100

type WorkoutLogPropertyNames = {
  exercise: string
  weightKg: string
  reps: string
  performedAt: string
  notes: string
}

const DEFAULT_PROPERTY_NAMES: WorkoutLogPropertyNames = {
  exercise: "種目",
  weightKg: "kg",
  reps: "reps",
  performedAt: "実施日",
  notes: "感想",
}

type QueryFilter = NonNullable<
  Parameters<Client["dataSources"]["query"]>[0]["filter"]
>

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
    this.properties = { ...DEFAULT_PROPERTY_NAMES, ...properties }
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
    const entries: WorkoutLogEntry[] = []
    let startCursor: string | undefined

    do {
      const response = await this.client.dataSources.query({
        data_source_id: this.dataSourceId,
        page_size: MAX_PAGE_SIZE,
        start_cursor: startCursor,
        filter,
        sorts: [
          {
            property: this.properties.performedAt,
            direction: "ascending",
          },
        ],
      })

      for (const result of response.results) {
        if (result.object !== "page") continue
        const entry = this.toEntry(result as PageObjectResponse)
        if (entry) entries.push(entry)
      }

      startCursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined
    } while (startCursor)

    return entries
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
