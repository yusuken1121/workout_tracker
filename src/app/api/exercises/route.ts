import { NextResponse } from "next/server"
import { createNotionOptionsReader } from "@/infrastructure/notion"
import { ListNotionOptionsUseCase } from "@/core/use-cases/list-notion-options.use-case"
import { handleRouteError } from "@/lib/route-error"

export async function GET() {
  try {
    const reader = createNotionOptionsReader(
      process.env.NOTION_EXERCISE_DATA_SOURCE_ID ?? "",
      "種目名",
    )
    const useCase = new ListNotionOptionsUseCase(reader)
    const options = await useCase.execute()

    return NextResponse.json({ options })
  } catch (error) {
    return handleRouteError(error, "/api/exercises Route Handler")
  }
}
