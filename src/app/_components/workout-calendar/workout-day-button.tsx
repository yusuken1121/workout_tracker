"use client"

import * as React from "react"
import { type DayButton } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Calendar day cell that highlights days with at least one logged set. */
export function WorkoutDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const hasWorkout = Boolean(modifiers.workout)

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      className={cn(
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        hasWorkout &&
          !modifiers.selected &&
          "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900",
        className,
      )}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {hasWorkout && (
        <span
          className={cn(
            "h-1 w-1 rounded-full",
            modifiers.selected
              ? "bg-primary-foreground"
              : "bg-blue-600 dark:bg-blue-300",
          )}
        />
      )}
    </Button>
  )
}
