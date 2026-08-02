import { apiClient } from "./apiClient"
import type { NotionOption } from "@/core/domain/notion-option"

export interface ListExerciseOptionsResponse {
  options: NotionOption[]
}

export const exercisesApi = {
  list: async (): Promise<ListExerciseOptionsResponse> => {
    return apiClient.get("/api/exercises")
  },
}
