import type { NotionPageRef } from "../domain/notion-page-ref"
import {
  assertValidWorkoutLog,
  type WorkoutLogInput,
} from "../domain/workout-log.entity"
import type { INotionRecordWriter } from "../ports/notion-record-writer.port"
import type { IWeekResolver } from "../ports/week-resolver.port"

/** The shape written to Notion, after resolving the derived Week relation. */
export type WorkoutLogRecord = WorkoutLogInput & { weekPageId?: string }

export class CreateWorkoutLogUseCase {
  constructor(
    private readonly writer: INotionRecordWriter<WorkoutLogRecord>,
    private readonly weekResolver: IWeekResolver,
  ) {}

  async execute(input: WorkoutLogInput): Promise<NotionPageRef> {
    assertValidWorkoutLog(input)

    const weekPageId = await this.weekResolver.findWeekIdForDate(
      input.performedAt,
    )

    return this.writer.create({ ...input, weekPageId })
  }
}
