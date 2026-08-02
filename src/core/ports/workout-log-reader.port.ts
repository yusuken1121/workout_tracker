import type { WorkoutLogEntry } from "../domain/workout-progress"

/** Reads workout log entries from the Notion 記録 data source. */
export interface IWorkoutLogReader {
  listByExercise(exercisePageId: string): Promise<WorkoutLogEntry[]>
  listByDateRange(fromIso: string, toIso: string): Promise<WorkoutLogEntry[]>
}
