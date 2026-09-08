import { estimateOneRepMaxKg, setVolumeKg } from "./workout-metrics"

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
  /** Best estimated one-rep max across all sets that day (kg). */
  estimatedOneRepMaxKg: number
  setCount: number
}

/**
 * Aggregates raw sets into one progress point per calendar day.
 * Prefer the heaviest set for weight/reps so the chart tracks strength progress.
 */
export function aggregateWorkoutProgress(
  entries: WorkoutLogEntry[],
): WorkoutProgressPoint[] {
  const byDate = new Map<string, Omit<WorkoutProgressPoint, "date">>()

  for (const entry of entries) {
    const existing = byDate.get(entry.performedAt)
    const volume = setVolumeKg(entry)
    const estimatedOneRepMaxKg = estimateOneRepMaxKg(entry)

    if (!existing) {
      byDate.set(entry.performedAt, {
        weightKg: entry.weightKg,
        reps: entry.reps,
        volume,
        estimatedOneRepMaxKg,
        setCount: 1,
      })
      continue
    }

    existing.volume += volume
    existing.setCount += 1
    existing.estimatedOneRepMaxKg = Math.max(
      existing.estimatedOneRepMaxKg,
      estimatedOneRepMaxKg,
    )

    if (isHeavierSet(entry, existing)) {
      existing.weightKg = entry.weightKg
      existing.reps = entry.reps
    }
  }

  return Array.from(byDate.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Returns the most recent progress point, or null when there is no history. */
export function latestProgressPoint(
  points: WorkoutProgressPoint[],
): WorkoutProgressPoint | null {
  return points.length > 0 ? points[points.length - 1] : null
}

function isHeavierSet(
  candidate: { weightKg: number; reps: number },
  current: { weightKg: number; reps: number },
): boolean {
  return (
    candidate.weightKg > current.weightKg ||
    (candidate.weightKg === current.weightKg && candidate.reps > current.reps)
  )
}

/** Headline numbers for one exercise's history, shown above the chart. */
export interface WorkoutProgressSummary {
  first: WorkoutProgressPoint
  latest: WorkoutProgressPoint
  maxWeightKg: number
  maxEstimatedOneRepMaxKg: number
  /** latest heaviest weight − first heaviest weight. */
  weightDeltaKg: number
}

export function summarizeWorkoutProgress(
  points: WorkoutProgressPoint[],
): WorkoutProgressSummary | null {
  const latest = latestProgressPoint(points)
  if (!latest) return null

  const first = points[0]
  let maxWeightKg = 0
  let maxEstimatedOneRepMaxKg = 0
  for (const point of points) {
    maxWeightKg = Math.max(maxWeightKg, point.weightKg)
    maxEstimatedOneRepMaxKg = Math.max(
      maxEstimatedOneRepMaxKg,
      point.estimatedOneRepMaxKg,
    )
  }

  return {
    first,
    latest,
    maxWeightKg,
    maxEstimatedOneRepMaxKg,
    weightDeltaKg: latest.weightKg - first.weightKg,
  }
}
