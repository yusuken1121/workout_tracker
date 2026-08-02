import type { WorkoutLogEntry } from "./workout-progress"

/** One set shown under a day's training menu. */
export interface WorkoutCalendarSet {
  id: string
  weightKg: number
  reps: number
  notes?: string
}

/** An exercise performed on a calendar day, with its sets. */
export interface WorkoutCalendarExercise {
  exercisePageId: string
  exerciseName: string
  sets: WorkoutCalendarSet[]
}

/** A gym day: date + exercises performed that day. */
export interface WorkoutCalendarDay {
  date: string
  exercises: WorkoutCalendarExercise[]
}

/**
 * Groups raw log entries into calendar days with named exercises.
 * Days and exercises are sorted for stable UI rendering.
 */
export function groupLogsIntoCalendarDays(
  entries: WorkoutLogEntry[],
  exerciseNameById: Map<string, string>,
): WorkoutCalendarDay[] {
  const byDate = new Map<
    string,
    Map<string, { exerciseName: string; sets: WorkoutCalendarSet[] }>
  >()

  for (const entry of entries) {
    let exercises = byDate.get(entry.performedAt)
    if (!exercises) {
      exercises = new Map()
      byDate.set(entry.performedAt, exercises)
    }

    const exerciseId = entry.exercisePageId || "unknown"
    let exercise = exercises.get(exerciseId)
    if (!exercise) {
      exercise = {
        exerciseName: exerciseNameById.get(exerciseId) ?? "不明な種目",
        sets: [],
      }
      exercises.set(exerciseId, exercise)
    }

    exercise.sets.push({
      id: entry.id,
      weightKg: entry.weightKg,
      reps: entry.reps,
      notes: entry.notes,
    })
  }

  return Array.from(byDate.entries())
    .map(([date, exercises]) => ({
      date,
      exercises: Array.from(exercises.entries())
        .map(([exercisePageId, data]) => ({
          exercisePageId,
          exerciseName: data.exerciseName,
          sets: data.sets,
        }))
        .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
