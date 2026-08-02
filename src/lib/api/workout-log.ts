import { apiClient } from "./apiClient"
import type { NotionPageRef } from "@/core/domain/notion-page-ref"
import type { WorkoutCalendarDay } from "@/core/domain/workout-calendar"
import type { WorkoutProgressPoint } from "@/core/domain/workout-progress"
import type { WorkoutLogRequest } from "@/lib/validators/workout-log.schema"

export interface WorkoutLogWriteResponse {
  success: boolean
  page: NotionPageRef
}

export interface WorkoutProgressResponse {
  points: WorkoutProgressPoint[]
}

export interface WorkoutCalendarResponse {
  days: WorkoutCalendarDay[]
}

export const workoutLogApi = {
  create: async (data: WorkoutLogRequest): Promise<WorkoutLogWriteResponse> => {
    return apiClient.post("/api/workout-log", data)
  },

  getProgress: async (
    exercisePageId: string,
  ): Promise<WorkoutProgressResponse> => {
    return apiClient.get("/api/workout-log/progress", {
      params: { exercisePageId },
    })
  },

  getCalendar: async (
    from: string,
    to: string,
  ): Promise<WorkoutCalendarResponse> => {
    return apiClient.get("/api/workout-log/calendar", {
      params: { from, to },
    })
  },
}
