import type { WorkoutLogPatch } from "../domain/workout-log.entity"

/** Updates the editable fields of an existing workout log page. */
export interface IWorkoutLogUpdater {
  update(logId: string, patch: WorkoutLogPatch): Promise<void>
}
