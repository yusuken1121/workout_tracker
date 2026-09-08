import type { Client } from "@notionhq/client"
import type { WorkoutLogPatch } from "../../core/domain/workout-log.entity"
import type { IWorkoutLogUpdater } from "../../core/ports/workout-log-updater.port"
import { NotionClientFactory } from "./notion-client.factory"
import type { NotionFieldMapping } from "./notion-field-mapping.types"
import { NotionPropertyBuilder } from "./notion-property.builder"
import { NotionWriteError } from "./notion-write.error"
import { WORKOUT_LOG_PROPERTIES } from "./workout-notion.properties"

const PATCH_FIELDS: Array<NotionFieldMapping<WorkoutLogPatch>> = [
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
    recordKey: "notes",
    propertyName: WORKOUT_LOG_PROPERTIES.notes,
    type: "title",
    optional: true,
  },
]

/** Writes edited kg / reps / notes back to an existing 記録 page. */
export class NotionWorkoutLogUpdater implements IWorkoutLogUpdater {
  private readonly client: Client

  constructor(client?: Client) {
    this.client = client ?? NotionClientFactory.create()
  }

  async update(logId: string, patch: WorkoutLogPatch): Promise<void> {
    const properties = NotionPropertyBuilder.build(patch, PATCH_FIELDS)

    try {
      await this.client.pages.update({
        page_id: logId,
        properties: properties as Parameters<
          Client["pages"]["update"]
        >[0]["properties"],
      })
    } catch (error) {
      throw new NotionWriteError("Failed to update Notion page", error)
    }
  }
}
