import {
  useMutation,
  useQuery,
  UseMutationOptions,
} from "@tanstack/react-query"
import { workoutLogApi, WorkoutLogWriteResponse } from "../workout-log"
import { exercisesApi } from "../exercises"
import type { WorkoutLogRequest } from "@/lib/validators/workout-log.schema"

export const workoutLogKeys = {
  all: ["workout-log"] as const,
  progress: (exercisePageId: string) =>
    [...workoutLogKeys.all, "progress", exercisePageId] as const,
  calendar: (from: string, to: string) =>
    [...workoutLogKeys.all, "calendar", from, to] as const,
}

export const exerciseKeys = {
  all: ["exercises"] as const,
  options: () => [...exerciseKeys.all, "options"] as const,
}

type UseCreateWorkoutLogOptions = UseMutationOptions<
  WorkoutLogWriteResponse,
  Error,
  WorkoutLogRequest
>

/** Creates a new workout log entry in Notion. */
export const useCreateWorkoutLog = (options?: UseCreateWorkoutLogOptions) => {
  return useMutation({
    mutationFn: workoutLogApi.create,
    ...options,
  })
}

/** Lists selectable exercises (種目) for the workout log form. */
export const useExerciseOptions = () => {
  return useQuery({
    queryKey: exerciseKeys.options(),
    queryFn: async () => (await exercisesApi.list()).options,
    staleTime: 5 * 60 * 1000,
  })
}

/** Fetches aggregated progress points for one exercise. */
export const useWorkoutProgress = (exercisePageId: string) => {
  return useQuery({
    queryKey: workoutLogKeys.progress(exercisePageId),
    queryFn: async () =>
      (await workoutLogApi.getProgress(exercisePageId)).points,
    enabled: exercisePageId.length > 0,
    staleTime: 60 * 1000,
  })
}

/** Fetches gym days (with exercises) for a date range. */
export const useWorkoutCalendar = (from: string, to: string) => {
  return useQuery({
    queryKey: workoutLogKeys.calendar(from, to),
    queryFn: async () => (await workoutLogApi.getCalendar(from, to)).days,
    enabled: from.length > 0 && to.length > 0,
    staleTime: 60 * 1000,
  })
}
