import { NextResponse } from "next/server"
import { createExerciseOptionsReader } from "@/infrastructure/notion"
import { ListNotionOptionsUseCase } from "@/core/use-cases/list-notion-options.use-case"
import { handleRouteError } from "@/lib/route-error"

export async function GET() {
  try {
    const useCase = new ListNotionOptionsUseCase(createExerciseOptionsReader())
    const options = await useCase.execute()

    return NextResponse.json({ options })
  } catch (error) {
    return handleRouteError(error, "/api/exercises Route Handler")
  }
}
