import { NextRequest, NextResponse } from "next/server"
import {
  createWorkoutLogArchiver,
  createWorkoutLogUpdater,
} from "@/infrastructure/notion"
import { DeleteWorkoutLogUseCase } from "@/core/use-cases/delete-workout-log.use-case"
import { UpdateWorkoutLogUseCase } from "@/core/use-cases/update-workout-log.use-case"
import {
  workoutLogIdSchema,
  workoutLogPatchSchema,
} from "@/lib/validators/workout-log.schema"
import { handleRouteError } from "@/lib/route-error"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const logId = workoutLogIdSchema.parse(id)
    const patch = workoutLogPatchSchema.parse(await req.json())

    const useCase = new UpdateWorkoutLogUseCase(createWorkoutLogUpdater())
    await useCase.execute(logId, patch)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, "PATCH /api/workout-log/[id] Route Handler")
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const logId = workoutLogIdSchema.parse(id)

    const useCase = new DeleteWorkoutLogUseCase(createWorkoutLogArchiver())
    await useCase.execute(logId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(
      error,
      "DELETE /api/workout-log/[id] Route Handler",
    )
  }
}
