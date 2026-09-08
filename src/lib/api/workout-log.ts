import { apiClient } from "./apiClient"
import type { NotionPageRef } from "@/core/domain/notion-page-ref"
import type { WorkoutCalendarDay } from "@/core/domain/workout-calendar"
import type { WorkoutProgressPoint } from "@/core/domain/workout-progress"
import type {
  WorkoutCalendarQuery,
  WorkoutLogPatchRequest,
  WorkoutLogRequest,
} from "@/lib/validators/workout-log.schema"

export interface WorkoutLogWriteResponse {
  success: boolean
  page: NotionPageRef
}

export interface WorkoutLogMutationResponse {
  success: boolean
}

/** @deprecated use WorkoutLogMutationResponse */
export type WorkoutLogDeleteResponse = WorkoutLogMutationResponse

export interface UpdateWorkoutLogVariables {
  logId: string
  patch: WorkoutLogPatchRequest
}

export interface WorkoutProgressResponse {
  points: WorkoutProgressPoint[]
}

export interface WorkoutCalendarResponse {
  days: WorkoutCalendarDay[]
}

const BASE_PATH = "/api/workout-log"

export const workoutLogApi = {
  create: async (data: WorkoutLogRequest): Promise<WorkoutLogWriteResponse> => {
    return apiClient.post(BASE_PATH, data)
  },

  remove: async (logId: string): Promise<WorkoutLogMutationResponse> => {
    return apiClient.delete(`${BASE_PATH}/${encodeURIComponent(logId)}`)
  },

  update: async ({
    logId,
    patch,
  }: UpdateWorkoutLogVariables): Promise<WorkoutLogMutationResponse> => {
    return apiClient.patch(`${BASE_PATH}/${encodeURIComponent(logId)}`, patch)
  },

  getProgress: async (
    exercisePageId: string,
  ): Promise<WorkoutProgressResponse> => {
    return apiClient.get(`${BASE_PATH}/progress`, {
      params: { exercisePageId },
    })
  },

  getCalendar: async (
    range: WorkoutCalendarQuery,
  ): Promise<WorkoutCalendarResponse> => {
    return apiClient.get(`${BASE_PATH}/calendar`, { params: range })
  },
}
