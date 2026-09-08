import { NextRequest, NextResponse } from "next/server"
import {
  createWeekResolver,
  createWorkoutLogWriter,
} from "@/infrastructure/notion"
import { CreateWorkoutLogUseCase } from "@/core/use-cases/create-workout-log.use-case"
import { workoutLogInputSchema } from "@/lib/validators/workout-log.schema"
import { handleRouteError } from "@/lib/route-error"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedInput = workoutLogInputSchema.parse(body)

    const useCase = new CreateWorkoutLogUseCase(
      createWorkoutLogWriter(),
      createWeekResolver(),
    )
    const result = await useCase.execute(validatedInput)

    return NextResponse.json({ success: true, page: result })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log Route Handler")
  }
}
