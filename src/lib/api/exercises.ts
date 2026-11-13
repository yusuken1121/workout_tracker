import { apiClient } from "./apiClient"
import type { ExerciseOption } from "@/core/domain/exercise-option"

export interface ListExerciseOptionsResponse {
  options: ExerciseOption[]
}

export const exercisesApi = {
  list: async (): Promise<ListExerciseOptionsResponse> => {
    return apiClient.get("/api/exercises")
  },
}
