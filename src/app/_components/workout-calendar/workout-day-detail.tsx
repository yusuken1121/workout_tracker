"use client"

import type { WorkoutCalendarDay } from "@/core/domain/workout-calendar"
import { formatJapaneseDate, formatKg } from "@/lib/workout-format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteSetButton } from "./delete-set-button"
import { EditSetDialog } from "./edit-set-dialog"

export type WeekSummary = {
  label: string
  totalKg: number
}

type WorkoutDayDetailProps = {
  selectedDate: Date | undefined
  day: WorkoutCalendarDay | undefined
  dayVolumeKg: number
  week: WeekSummary | null
  monthGymDayCount: number
}

/** Right-hand panel: the selected day's exercises, sets and volume totals. */
export function WorkoutDayDetail({
  selectedDate,
  day,
  dayVolumeKg,
  week,
  monthGymDayCount,
}: WorkoutDayDetailProps) {
  const setCount = day
    ? day.exercises.reduce((n, exercise) => n + exercise.sets.length, 0)
    : 0

  return (
    <Card className="min-h-[320px] w-full flex-1">
      <CardHeader>
        <CardTitle className="text-base">
          {selectedDate ? formatJapaneseDate(selectedDate) : "日付を選択"}
        </CardTitle>
        <CardDescription>
          {day
            ? `${day.exercises.length}種目 · ${setCount}セット`
            : selectedDate
              ? "この日のトレーニング記録はありません"
              : "カレンダーの日付をタップしてください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedDate && week && (
          <div className="bg-muted/50 mb-4 grid grid-cols-2 gap-3 rounded-lg px-3 py-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">この日の総合</p>
              <p className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                {formatKg(dayVolumeKg)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                この週の合計重量
                <span className="ml-1 opacity-70">({week.label})</span>
              </p>
              <p className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                {formatKg(week.totalKg)}
              </p>
            </div>
            <p className="text-muted-foreground col-span-2 text-[11px] leading-snug">
              合計は各セットの kg × 回数
              を足した総負荷量です。週は月曜始まりです。
            </p>
          </div>
        )}

        {!selectedDate && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            左側のカレンダーから日付を選んでください。
          </p>
        )}

        {selectedDate && !day && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            ジムに行った記録がありません。
          </p>
        )}

        {day && (
          <ul className="space-y-4">
            {day.exercises.map((exercise) => (
              <li
                key={`${day.date}-${exercise.exercisePageId}`}
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
                      <span className="flex items-center gap-0.5">
                        <span className="text-foreground font-mono tabular-nums">
                          {set.weightKg} kg × {set.reps} 回
                        </span>
                        <EditSetDialog
                          set={set}
                          exerciseName={exercise.exerciseName}
                        />
                        <DeleteSetButton
                          setId={set.id}
                          label={`${exercise.exerciseName} ${set.weightKg} kg × ${set.reps} 回`}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                {exercise.sets.some((set) => set.notes) && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {exercise.sets
                      .map((set) => set.notes)
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {monthGymDayCount > 0 && (
          <p className="text-muted-foreground mt-6 text-xs">
            この月のジム実施日: {monthGymDayCount} 日
            {day && " · 選択日に記録あり"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
