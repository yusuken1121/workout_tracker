import { NextRequest, NextResponse } from "next/server"
import {
  createNotionOptionsReader,
  createWorkoutLogReader,
} from "@/infrastructure/notion"
import { GetWorkoutCalendarUseCase } from "@/core/use-cases/get-workout-calendar.use-case"
import { handleRouteError } from "@/lib/route-error"

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  try {
    const from = req.nextUrl.searchParams.get("from")?.trim() ?? ""
    const to = req.nextUrl.searchParams.get("to")?.trim() ?? ""

    if (!DATE_ONLY_REGEX.test(from) || !DATE_ONLY_REGEX.test(to)) {
      return NextResponse.json(
        { error: "from and to are required in YYYY-MM-DD format" },
        { status: 400 },
      )
    }

    if (from > to) {
      return NextResponse.json(
        { error: "from must be on or before to" },
        { status: 400 },
      )
    }

    const logReader = createWorkoutLogReader(
      process.env.NOTION_WORKOUT_LOG_DATA_SOURCE_ID ?? "",
    )
    const exerciseOptions = createNotionOptionsReader(
      process.env.NOTION_EXERCISE_DATA_SOURCE_ID ?? "",
      "種目名",
    )
    const useCase = new GetWorkoutCalendarUseCase(logReader, exerciseOptions)
    const days = await useCase.execute({ from, to })

    return NextResponse.json({ days })
  } catch (error) {
    return handleRouteError(error, "/api/workout-log/calendar Route Handler")
  }
}
