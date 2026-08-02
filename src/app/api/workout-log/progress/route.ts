import { NextRequest, NextResponse } from "next/server"
import { createWorkoutLogReader } from "@/infrastructure/notion"
import { GetWorkoutProgressUseCase } from "@/core/use-cases/get-workout-progress.use-case"
import { handleRouteError } from "@/lib/route-error"

export async function GET(req: NextRequest) {
  try {
    const exercisePageId = req.nextUrl.searchParams
      .get("exercisePageId")
      ?.trim()

    if (!exercisePageId) {
      return NextResponse.json(
        { error: "exercisePageId is required" },
        { status: 400 },
      )
    }

    const reader = createWorkoutLogReader(
      process.env.NOTION_WORKOUT_LOG_DATA_SOURCE_ID ?? "",
    )
    const useCase = new GetWorkoutProgressUseCase(reader)
    const points = await useCase.execute(exercisePageId)

    return NextResponse.json({ points })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log/progress Route Handler")
  }
}
