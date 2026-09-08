export interface WorkoutLogInput {
  /** Notion page ID of the exercise (種目) this set belongs to. */
  exercisePageId: string
  /** Weight lifted, in kilograms. 0 is valid for bodyweight exercises. */
  weightKg: number
  /** Number of repetitions performed. */
  reps: number
  /** ISO date string (YYYY-MM-DD) the set was performed on. */
  performedAt: string
  /** Optional free-text notes (感想). */
  notes?: string
}

export class InvalidWorkoutLogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidWorkoutLogError"
  }
}

/**
 * Domain rules for a workout log entry. Field presence/format is validated
 * by Zod at the Route Handler; this enforces business-meaningful ranges.
 */
export function assertValidWorkoutLog(record: WorkoutLogInput): void {
  if (!record.exercisePageId.trim()) {
    throw new InvalidWorkoutLogError("Exercise must be selected")
  }
  if (record.weightKg < 0) {
    throw new InvalidWorkoutLogError("Weight must be zero or greater")
  }
  if (record.reps <= 0) {
    throw new InvalidWorkoutLogError("Reps must be greater than zero")
  }
  if (!record.performedAt.trim()) {
    throw new InvalidWorkoutLogError("Performed date must be provided")
  }
}

/** Editable fields of an existing set. Exercise and date are fixed once logged. */
export type WorkoutLogPatch = Pick<WorkoutLogInput, "weightKg" | "reps"> & {
  notes?: string
}

export function assertValidWorkoutLogPatch(patch: WorkoutLogPatch): void {
  if (patch.weightKg < 0) {
    throw new InvalidWorkoutLogError("Weight must be zero or greater")
  }
  if (patch.reps <= 0) {
    throw new InvalidWorkoutLogError("Reps must be greater than zero")
  }
}
