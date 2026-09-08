import type { WorkoutCalendarDay } from "./workout-calendar"
import { dayTotalVolumeKg } from "./workout-calendar"

/** A week window, inclusive on both ends (YYYY-MM-DD). */
export interface WeekRange {
  fromIso: string
  toIso: string
  /** Display label such as "9/7 – 9/13". */
  label: string
}

export interface WeeklySummary extends WeekRange {
  totalVolumeKg: number
  gymDays: number
  setCount: number
}

/** Best set per exercise inside a set of days (used for the "this week" list). */
export interface ExerciseTopSet {
  exercisePageId: string
  exerciseName: string
  bestWeightKg: number
  bestReps: number
  setCount: number
  totalVolumeKg: number
}

/** Aggregates calendar days into one summary per week range, in the given order. */
export function summarizeWeeks(
  days: WorkoutCalendarDay[],
  ranges: WeekRange[],
): WeeklySummary[] {
  return ranges.map((range) => {
    let totalVolumeKg = 0
    let gymDays = 0
    let setCount = 0

    for (const day of days) {
      if (day.date < range.fromIso || day.date > range.toIso) continue
      gymDays += 1
      totalVolumeKg += dayTotalVolumeKg(day)
      for (const exercise of day.exercises) {
        setCount += exercise.sets.length
      }
    }

    return { ...range, totalVolumeKg, gymDays, setCount }
  })
}

/**
 * Number of consecutive weeks (ending with the most recent) that had at least
 * one gym day. A current week with no training yet does not break the streak;
 * it is simply skipped so a Monday-morning check-in still shows last week's run.
 */
export function countActiveWeekStreak(weeks: WeeklySummary[]): number {
  if (weeks.length === 0) return 0

  let index = weeks.length - 1
  if (weeks[index].gymDays === 0) index -= 1

  let streak = 0
  for (; index >= 0; index -= 1) {
    if (weeks[index].gymDays === 0) break
    streak += 1
  }
  return streak
}

/**
 * Relative change from `previous` to `current` in percent, rounded to a whole
 * number. Returns null when there is no previous value to compare against.
 */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/** Best (heaviest, then most reps) set for every exercise found in `days`. */
export function topSetsByExercise(
  days: WorkoutCalendarDay[],
): ExerciseTopSet[] {
  const byExercise = new Map<string, ExerciseTopSet>()

  for (const day of days) {
    for (const exercise of day.exercises) {
      let top = byExercise.get(exercise.exercisePageId)
      if (!top) {
        top = {
          exercisePageId: exercise.exercisePageId,
          exerciseName: exercise.exerciseName,
          bestWeightKg: 0,
          bestReps: 0,
          setCount: 0,
          totalVolumeKg: 0,
        }
        byExercise.set(exercise.exercisePageId, top)
      }

      for (const set of exercise.sets) {
        top.setCount += 1
        top.totalVolumeKg += set.weightKg * set.reps
        if (
          set.weightKg > top.bestWeightKg ||
          (set.weightKg === top.bestWeightKg && set.reps > top.bestReps)
        ) {
          top.bestWeightKg = set.weightKg
          top.bestReps = set.reps
        }
      }
    }
  }

  return Array.from(byExercise.values()).sort(
    (a, b) => b.totalVolumeKg - a.totalVolumeKg,
  )
}
