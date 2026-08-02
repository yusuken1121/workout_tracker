import {
  groupLogsIntoCalendarDays,
  type WorkoutCalendarDay,
} from "../domain/workout-calendar"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"
import type { IWorkoutLogReader } from "../ports/workout-log-reader.port"

export type GetWorkoutCalendarInput = {
  from: string
  to: string
}

export class GetWorkoutCalendarUseCase {
  constructor(
    private readonly logReader: IWorkoutLogReader,
    private readonly exerciseOptions: INotionOptionsReader,
  ) {}

  async execute(input: GetWorkoutCalendarInput): Promise<WorkoutCalendarDay[]> {
    if (!input.from || !input.to) {
      return []
    }

    const [entries, options] = await Promise.all([
      this.logReader.listByDateRange(input.from, input.to),
      this.exerciseOptions.listOptions(),
    ])

    const exerciseNameById = new Map(
      options.map((option) => [option.id, option.label]),
    )

    return groupLogsIntoCalendarDays(entries, exerciseNameById)
  }
}
