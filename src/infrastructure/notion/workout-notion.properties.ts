/**
 * Single source of truth for the Notion property names used by the workout
 * databases. Change here when a column is renamed in Notion.
 */
export const WORKOUT_LOG_PROPERTIES = {
  exercise: "種目",
  weightKg: "kg",
  reps: "reps",
  performedAt: "実施日",
  week: "週",
  notes: "感想",
} as const

export const EXERCISE_PROPERTIES = {
  /** Title property of the 種目 (Exercises) data source. */
  name: "種目名",
} as const

export const WEEK_PROPERTIES = {
  /** Date-range property of the 週次記録 (Weekly Progress) data source. */
  period: "期間",
} as const

export type WorkoutLogPropertyNames = {
  -readonly [K in keyof typeof WORKOUT_LOG_PROPERTIES]: string
}
