import { NextRequest, NextResponse } from "next/server"
import {
  createExerciseOptionsReader,
  createWorkoutLogReader,
} from "@/infrastructure/notion"
import { GetWorkoutCalendarUseCase } from "@/core/use-cases/get-workout-calendar.use-case"
import { workoutCalendarQuerySchema } from "@/lib/validators/workout-log.schema"
import { handleRouteError } from "@/lib/route-error"

export async function GET(req: NextRequest) {
  try {
    const query = workoutCalendarQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    )

    const useCase = new GetWorkoutCalendarUseCase(
      createWorkoutLogReader(),
      createExerciseOptionsReader(),
    )
    const days = await useCase.execute(query)

    return NextResponse.json({ days })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log/calendar Route Handler")
  }
}
