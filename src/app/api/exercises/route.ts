import { NextResponse } from "next/server"
import { subDays } from "date-fns"
import {
  createExerciseOptionsReader,
  createWorkoutLogReader,
} from "@/infrastructure/notion"
import { ListExerciseOptionsUseCase } from "@/core/use-cases/list-exercise-options.use-case"
import { handleRouteError } from "@/lib/route-error"
import { toIsoDate } from "@/lib/workout-format"

/** How far back to look when ranking "recently used" exercises. */
const USAGE_LOOKBACK_DAYS = 60

export async function GET() {
  try {
    const today = new Date()
    const useCase = new ListExerciseOptionsUseCase(
      createExerciseOptionsReader(),
      createWorkoutLogReader(),
    )
    const options = await useCase.execute({
      usageFrom: toIsoDate(subDays(today, USAGE_LOOKBACK_DAYS)),
      // +1 day absorbs server/client time-zone differences.
      usageTo: toIsoDate(subDays(today, -1)),
    })

    return NextResponse.json({ options })
  } catch (error) {
    return handleRouteError(error, "/api/exercises Route Handler")
  }
}
