import { z } from "zod"

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** HTTP boundary validation for POST /api/workout-log */
export const workoutLogInputSchema = z.object({
  exercisePageId: z.string().min(1),
  weightKg: z.number().min(0, "0以上の数値を入力してください"),
  reps: z
    .number()
    .int("回数は整数で入力してください")
    .min(1, "1以上の回数を入力してください"),
  performedAt: z
    .string()
    .regex(DATE_ONLY_REGEX, "実施日を YYYY-MM-DD 形式で入力してください"),
  notes: z.string().optional(),
})

export type WorkoutLogRequest = z.infer<typeof workoutLogInputSchema>

/** Client form validation (same rules, used directly with react-hook-form). */
export const workoutLogFormSchema = workoutLogInputSchema
export type WorkoutLogFormValues = z.infer<typeof workoutLogFormSchema>
