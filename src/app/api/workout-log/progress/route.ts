import { NextRequest, NextResponse } from "next/server"
import { createWorkoutLogReader } from "@/infrastructure/notion"
import { GetWorkoutProgressUseCase } from "@/core/use-cases/get-workout-progress.use-case"
import { workoutProgressQuerySchema } from "@/lib/validators/workout-log.schema"
import { handleRouteError } from "@/lib/route-error"

export async function GET(req: NextRequest) {
  try {
    const { exercisePageId } = workoutProgressQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    )

    const useCase = new GetWorkoutProgressUseCase(createWorkoutLogReader())
    const points = await useCase.execute(exercisePageId)

    return NextResponse.json({ points })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log/progress Route Handler")
  }
}
