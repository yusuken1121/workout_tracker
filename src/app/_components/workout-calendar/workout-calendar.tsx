"use client"

import * as React from "react"
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { CalendarDays, Loader2 } from "lucide-react"

import { useWorkoutCalendar } from "@/lib/api/queries/useWorkoutLog"
import {
  dayTotalVolumeKg,
  totalVolumeKgInRange,
  type WorkoutCalendarDay,
} from "@/core/domain/workout-calendar"
import { WEEK_STARTS_ON } from "@/constants/workout"
import { toIsoDate } from "@/lib/workout-format"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkoutDayButton } from "./workout-day-button"
import { WorkoutDayDetail, type WeekSummary } from "./workout-day-detail"

const weekOptions = { weekStartsOn: WEEK_STARTS_ON }

/** Visible range padded to full weeks so weekly totals stay accurate at month edges. */
function visibleRange(month: Date): { from: string; to: string } {
  return {
    from: toIsoDate(startOfWeek(startOfMonth(month), weekOptions)),
    to: toIsoDate(endOfWeek(endOfMonth(month), weekOptions)),
  }
}

function summarizeWeek(
  days: WorkoutCalendarDay[],
  selectedDate: Date,
): WeekSummary {
  const weekStart = startOfWeek(selectedDate, weekOptions)
  const weekEnd = endOfWeek(selectedDate, weekOptions)
  return {
    label: `${format(weekStart, "M/d")} – ${format(weekEnd, "M/d")}`,
    totalKg: totalVolumeKgInRange(
      days,
      toIsoDate(weekStart),
      toIsoDate(weekEnd),
    ),
  }
}

export function WorkoutCalendar() {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    () => new Date(),
  )

  const { from, to } = visibleRange(month)
  const {
    data: days = [],
    isLoading,
    isFetching,
    error,
  } = useWorkoutCalendar(from, to)

  const dayByIso = React.useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  )
  const workoutDates = React.useMemo(
    () => days.map((day) => parseISO(day.date)),
    [days],
  )
  const monthGymDayCount = React.useMemo(
    () => workoutDates.filter((date) => isSameMonth(date, month)).length,
    [workoutDates, month],
  )

  const selectedDay = selectedDate
    ? dayByIso.get(toIsoDate(selectedDate))
    : undefined
  const week = selectedDate ? summarizeWeek(days, selectedDate) : null

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
              weekStartsOn={WEEK_STARTS_ON}
              modifiers={{ workout: workoutDates }}
              components={{ DayButton: WorkoutDayButton }}
              className="rounded-lg border"
            />
          )}
        </CardContent>
      </Card>

      <WorkoutDayDetail
        selectedDate={selectedDate}
        day={selectedDay}
        dayVolumeKg={selectedDay ? dayTotalVolumeKg(selectedDay) : 0}
        week={week}
        monthGymDayCount={isLoading ? 0 : monthGymDayCount}
      />
    </div>
  )
}
