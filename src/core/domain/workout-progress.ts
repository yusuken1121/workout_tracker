/** A single set logged in Notion (記録). */
export interface WorkoutLogEntry {
  id: string
  exercisePageId: string
  weightKg: number
  reps: number
  /** ISO date string (YYYY-MM-DD). */
  performedAt: string
  notes?: string
}

/**
 * One day of training for a single exercise, aggregated from one or more sets.
 * Used as a chart data point.
 */
export interface WorkoutProgressPoint {
  date: string
  /** Heaviest weight that day (kg). */
  weightKg: number
  /** Reps of the heaviest set (ties broken by more reps). */
  reps: number
  /** Sum of (kg × reps) across all sets that day. */
  volume: number
  setCount: number
}

/**
 * Aggregates raw sets into one progress point per calendar day.
 * Prefer the heaviest set for weight/reps so the chart tracks strength progress.
 */
export function aggregateWorkoutProgress(
  entries: WorkoutLogEntry[],
): WorkoutProgressPoint[] {
  const byDate = new Map<
    string,
    { weightKg: number; reps: number; volume: number; setCount: number }
  >()

  for (const entry of entries) {
    const existing = byDate.get(entry.performedAt)
    const setVolume = entry.weightKg * entry.reps

    if (!existing) {
      byDate.set(entry.performedAt, {
        weightKg: entry.weightKg,
        reps: entry.reps,
        volume: setVolume,
        setCount: 1,
      })
      continue
    }

    existing.volume += setVolume
    existing.setCount += 1

    if (
      entry.weightKg > existing.weightKg ||
      (entry.weightKg === existing.weightKg && entry.reps > existing.reps)
    ) {
      existing.weightKg = entry.weightKg
      existing.reps = entry.reps
    }
  }

  return Array.from(byDate.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
