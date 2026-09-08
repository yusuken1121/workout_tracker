import {
  assertValidWorkoutLogPatch,
  InvalidWorkoutLogError,
  type WorkoutLogPatch,
} from "../domain/workout-log.entity"
import type { IWorkoutLogUpdater } from "../ports/workout-log-updater.port"

export class UpdateWorkoutLogUseCase {
  constructor(private readonly updater: IWorkoutLogUpdater) {}

  async execute(logId: string, patch: WorkoutLogPatch): Promise<void> {
    if (!logId.trim()) {
      throw new InvalidWorkoutLogError("Log ID must be provided")
    }
    assertValidWorkoutLogPatch(patch)

    await this.updater.update(logId, patch)
  }
}
