/** The minimal shape shared by every logged set. */
export interface WorkoutSetMetrics {
  weightKg: number
  reps: number
}

/** Total moved weight for one set: kg × reps. */
export function setVolumeKg(set: WorkoutSetMetrics): number {
  return set.weightKg * set.reps
}

/**
 * Estimated one-rep max (推定1RM) using the Epley formula: w × (1 + reps / 30).
 * A single rep is the weight itself; bodyweight (0 kg) sets have no meaningful 1RM.
 * Rounded to one decimal so chart/stat values stay readable.
 */
export function estimateOneRepMaxKg(set: WorkoutSetMetrics): number {
  if (set.weightKg <= 0 || set.reps <= 0) return 0
  if (set.reps <= 1) return set.weightKg
  return roundToOneDecimal(set.weightKg * (1 + set.reps / 30))
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}
