"use client"

import * as React from "react"
import { endOfMonth, format, isSameDay, parseISO, startOfMonth } from "date-fns"
import { CalendarDays, Loader2 } from "lucide-react"
import { type DayButton } from "react-day-picker"

import { useWorkoutCalendar } from "@/lib/api/queries/useWorkoutLog"
import type { WorkoutCalendarDay } from "@/core/domain/workout-calendar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function WorkoutDayButton({
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

export function WorkoutCalendar() {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    () => new Date(),
  )

  const from = toIsoDate(startOfMonth(month))
  const to = toIsoDate(endOfMonth(month))

  const {
    data: days = [],
    isLoading,
    isFetching,
    error,
  } = useWorkoutCalendar(from, to)

  const dayByIso = React.useMemo(() => {
    const map = new Map<string, WorkoutCalendarDay>()
    for (const day of days) {
      map.set(day.date, day)
    }
    return map
  }, [days])

  const workoutDates = React.useMemo(
    () => days.map((day) => parseISO(day.date)),
    [days],
  )

  const selectedIso = selectedDate ? toIsoDate(selectedDate) : ""
  const selectedDay = selectedIso ? dayByIso.get(selectedIso) : undefined

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 lg:flex-row lg:items-start">
      <Card className="w-full lg:w-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            ジムカレンダー
          </CardTitle>
          <CardDescription>
            実施日がある日がハイライトされます。日付をタップすると種目一覧を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex justify-center">
          {isFetching && !isLoading && (
            <div className="text-muted-foreground absolute top-0 right-4 z-10 flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              更新中
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-[320px] w-[280px]" />
          ) : error ? (
            <p className="text-destructive py-16 text-center text-sm">
              {error.message || "カレンダーの取得に失敗しました"}
            </p>
          ) : (
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ workout: workoutDates }}
              components={{ DayButton: WorkoutDayButton }}
              className="rounded-lg border"
            />
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[320px] w-full flex-1">
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(selectedDate, "yyyy年M月d日") : "日付を選択"}
          </CardTitle>
          <CardDescription>
            {selectedDay
              ? `${selectedDay.exercises.length}種目 · ${selectedDay.exercises.reduce((n, e) => n + e.sets.length, 0)}セット`
              : selectedDate
                ? "この日のトレーニング記録はありません"
                : "カレンダーの日付をタップしてください"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedDate && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              左側のカレンダーから日付を選んでください。
            </p>
          )}

          {selectedDate && !selectedDay && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              ジムに行った記録がありません。
            </p>
          )}

          {selectedDay && (
            <ul className="space-y-4">
              {selectedDay.exercises.map((exercise) => (
                <li
                  key={`${selectedDay.date}-${exercise.exercisePageId}`}
                  className="border-border/60 rounded-lg border px-3 py-2"
                >
                  <p className="font-medium">{exercise.exerciseName}</p>
                  <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {exercise.sets.map((set, index) => (
                      <li
                        key={set.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>セット {index + 1}</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {set.weightKg} kg × {set.reps} 回
                        </span>
                      </li>
                    ))}
                  </ul>
                  {exercise.sets.some((s) => s.notes) && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {exercise.sets
                        .map((s) => s.notes)
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!isLoading && days.length > 0 && (
            <p className="text-muted-foreground mt-6 text-xs">
              この月のジム実施日:{" "}
              {
                days.filter((d) => {
                  const date = parseISO(d.date)
                  return (
                    date.getMonth() === month.getMonth() &&
                    date.getFullYear() === month.getFullYear()
                  )
                }).length
              }{" "}
              日
              {selectedDate &&
                days.some((d) => isSameDay(parseISO(d.date), selectedDate)) &&
                " · 選択日に記録あり"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
