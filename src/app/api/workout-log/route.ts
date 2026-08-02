import { NextRequest, NextResponse } from "next/server"
import {
  createNotionRecordWriter,
  createWeekResolver,
} from "@/infrastructure/notion"
import { workoutLogNotionConfig } from "@/infrastructure/notion/workout-log.config"
import {
  CreateWorkoutLogUseCase,
  type WorkoutLogRecord,
} from "@/core/use-cases/create-workout-log.use-case"
import { workoutLogInputSchema } from "@/lib/validators/workout-log.schema"
import { handleRouteError } from "@/lib/route-error"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedInput = workoutLogInputSchema.parse(body)

    const writer = createNotionRecordWriter<WorkoutLogRecord>(
      workoutLogNotionConfig,
    )
    const weekResolver = createWeekResolver(
      process.env.NOTION_WEEK_DATA_SOURCE_ID ?? "",
      "期間",
    )
    const useCase = new CreateWorkoutLogUseCase(writer, weekResolver)
    const result = await useCase.execute(validatedInput)

    return NextResponse.json({ success: true, page: result })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log Route Handler")
  }
}
