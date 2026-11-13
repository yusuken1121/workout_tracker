import {
  annotateExerciseUsage,
  type ExerciseOption,
} from "../domain/exercise-option"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"

export type ListExerciseOptionsInput = {
  /** Start of the usage lookback window (YYYY-MM-DD, inclusive). */
  usageFrom: string
  /** End of the usage lookback window (YYYY-MM-DD, inclusive). */
  usageTo: string
}

/**
 * Lists exercises (種目) annotated with recent usage so the picker can offer
 * "最近の種目" shortcuts. Usage is a nice-to-have: if reading the log fails,
 * the plain option list is still returned.
 */
export class ListExerciseOptionsUseCase {
  constructor(
    private readonly optionsReader: INotionOptionsReader,
    private readonly logReader: IWorkoutLogReader,
  ) {}

  async execute(input: ListExerciseOptionsInput): Promise<ExerciseOption[]> {
    const [options, entries] = await Promise.all([
      this.optionsReader.listOptions(),
      this.logReader
        .listByDateRange(input.usageFrom, input.usageTo)
        .catch((error: unknown) => {
          console.warn("Could not read recent workout logs for usage:", error)
          return []
        }),
    ])

    return annotateExerciseUsage(options, entries)
  }
}
