import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query"
import {
  workoutLogApi,
  type UpdateWorkoutLogVariables,
  type WorkoutLogMutationResponse,
  type WorkoutLogWriteResponse,
} from "../workout-log"
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

const STALE_TIME_MS = {
  exerciseOptions: 5 * 60 * 1000,
  workoutLog: 60 * 1000,
} as const

type UseCreateWorkoutLogOptions = UseMutationOptions<
  WorkoutLogWriteResponse,
  Error,
  WorkoutLogRequest
>

type UseDeleteWorkoutLogOptions = UseMutationOptions<
  WorkoutLogMutationResponse,
  Error,
  string
>

type UseUpdateWorkoutLogOptions = UseMutationOptions<
  WorkoutLogMutationResponse,
  Error,
  UpdateWorkoutLogVariables
>

/**
 * Creates a new workout log entry in Notion and refreshes every cached
 * progress/calendar view so the new set shows up without a reload.
 */
export const useCreateWorkoutLog = (options?: UseCreateWorkoutLogOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workoutLogApi.create,
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: workoutLogKeys.all })
      return options?.onSuccess?.(...args)
    },
  })
}

/** Deletes (archives) one logged set and refreshes cached workout views. */
export const useDeleteWorkoutLog = (options?: UseDeleteWorkoutLogOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workoutLogApi.remove,
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: workoutLogKeys.all })
      return options?.onSuccess?.(...args)
    },
  })
}

/** Edits kg / reps / notes of one logged set and refreshes cached workout views. */
export const useUpdateWorkoutLog = (options?: UseUpdateWorkoutLogOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workoutLogApi.update,
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: workoutLogKeys.all })
      return options?.onSuccess?.(...args)
    },
  })
}

/** Lists selectable exercises (種目) for the workout log form. */
export const useExerciseOptions = () => {
  return useQuery({
    queryKey: exerciseKeys.options(),
    queryFn: async () => (await exercisesApi.list()).options,
    staleTime: STALE_TIME_MS.exerciseOptions,
  })
}

/** Fetches aggregated progress points for one exercise. */
export const useWorkoutProgress = (exercisePageId: string) => {
  return useQuery({
    queryKey: workoutLogKeys.progress(exercisePageId),
    queryFn: async () =>
      (await workoutLogApi.getProgress(exercisePageId)).points,
    enabled: exercisePageId.length > 0,
    staleTime: STALE_TIME_MS.workoutLog,
  })
}

/** Fetches gym days (with exercises) for a date range. */
export const useWorkoutCalendar = (from: string, to: string) => {
  return useQuery({
    queryKey: workoutLogKeys.calendar(from, to),
    queryFn: async () => (await workoutLogApi.getCalendar({ from, to })).days,
    enabled: from.length > 0 && to.length > 0,
    staleTime: STALE_TIME_MS.workoutLog,
  })
}
