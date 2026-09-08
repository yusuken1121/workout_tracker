import { z } from "zod"

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD date string shared by every workout endpoint. */
export const isoDateSchema = z
  .string()
  .regex(DATE_ONLY_REGEX, "日付は YYYY-MM-DD 形式で入力してください")

/** HTTP boundary validation for POST /api/workout-log */
export const workoutLogInputSchema = z.object({
  exercisePageId: z.string().min(1, "種目を選択してください"),
  weightKg: z.number().min(0, "0以上の数値を入力してください"),
  reps: z.number().positive("0より大きい回数を入力してください"),
  performedAt: isoDateSchema,
  notes: z.string().optional(),
})

export type WorkoutLogRequest = z.infer<typeof workoutLogInputSchema>

/** Client form validation (same rules, used directly with react-hook-form). */
export const workoutLogFormSchema = workoutLogInputSchema
export type WorkoutLogFormValues = z.infer<typeof workoutLogFormSchema>

/** Body for PATCH /api/workout-log/[id] — only the editable fields of a set. */
export const workoutLogPatchSchema = workoutLogInputSchema.pick({
  weightKg: true,
  reps: true,
  notes: true,
})

export type WorkoutLogPatchRequest = z.infer<typeof workoutLogPatchSchema>

/** Path parameter for DELETE / PATCH /api/workout-log/[id] */
export const workoutLogIdSchema = z
  .string()
  .trim()
  .min(1, "記録 ID が指定されていません")

/** Query string for GET /api/workout-log/progress */
export const workoutProgressQuerySchema = z.object({
  exercisePageId: z.string().trim().min(1, "exercisePageId is required"),
})

export type WorkoutProgressQuery = z.infer<typeof workoutProgressQuerySchema>

/** Query string for GET /api/workout-log/calendar */
export const workoutCalendarQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine((range) => range.from <= range.to, {
    message: "from must be on or before to",
    path: ["from"],
  })

export type WorkoutCalendarQuery = z.infer<typeof workoutCalendarQuerySchema>
