import {
  aggregateWorkoutProgress,
  type WorkoutProgressPoint,
} from "../domain/workout-progress"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"

export class GetWorkoutProgressUseCase {
  constructor(private readonly reader: IWorkoutLogReader) {}

  async execute(exercisePageId: string): Promise<WorkoutProgressPoint[]> {
    if (!exercisePageId.trim()) {
      return []
    }

    const entries = await this.reader.listByExercise(exercisePageId)
    return aggregateWorkoutProgress(entries)
  }
}
