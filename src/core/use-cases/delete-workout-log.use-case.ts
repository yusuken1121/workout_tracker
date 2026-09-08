import { InvalidWorkoutLogError } from "../domain/workout-log.entity"
import type { INotionPageArchiver } from "../ports/notion-page-archiver.port"

/**
 * Removes a single logged set. Notion has no hard delete via API, so the page
 * is archived — the user can still restore it from Notion's trash.
 */
export class DeleteWorkoutLogUseCase {
  constructor(private readonly archiver: INotionPageArchiver) {}

  async execute(logId: string): Promise<void> {
    if (!logId.trim()) {
      throw new InvalidWorkoutLogError("Log ID must be provided")
    }

    await this.archiver.archive(logId)
  }
}
