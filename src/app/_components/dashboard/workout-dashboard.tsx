"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from "date-fns"
import { Flame, LayoutDashboard, Loader2 } from "lucide-react"

import { useWorkoutCalendar } from "@/lib/api/queries/useWorkoutLog"
import {
  countActiveWeekStreak,
  percentChange,
  summarizeWeeks,
  topSetsByExercise,
  type WeekRange,
} from "@/core/domain/workout-weekly"
import { WEEK_STARTS_ON } from "@/constants/workout"
import { formatKg, toIsoDate } from "@/lib/workout-format"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const WEEKS_SHOWN = 8
const weekOptions = { weekStartsOn: WEEK_STARTS_ON }

const chartConfig = {
  totalVolumeKg: { label: "総負荷量 (kg)", color: "hsl(221, 83%, 53%)" },
} satisfies ChartConfig

/** The last `count` weeks (oldest first), ending with the week containing `today`. */
function recentWeekRanges(today: Date, count: number): WeekRange[] {
  const currentStart = startOfWeek(today, weekOptions)
  const firstStart = subWeeks(currentStart, count - 1)

  return Array.from({ length: count }, (_, index) => {
    const start = addWeeks(firstStart, index)
    const end = endOfWeek(start, weekOptions)
    return {
      fromIso: toIsoDate(start),
      toIso: toIsoDate(end),
      label: `${format(start, "M/d")} – ${format(end, "M/d")}`,
    }
  })
}

export function WorkoutDashboard() {
  const ranges = React.useMemo(
    () => recentWeekRanges(new Date(), WEEKS_SHOWN),
    [],
  )
  const from = ranges[0].fromIso
  const to = ranges[ranges.length - 1].toIso

  const {
    data: days = [],
    isLoading,
    isFetching,
    error,
  } = useWorkoutCalendar(from, to)

  const weeks = React.useMemo(
    () => summarizeWeeks(days, ranges),
    [days, ranges],
  )
  const thisWeek = weeks[weeks.length - 1]
  const lastWeek = weeks[weeks.length - 2]
  const volumeChange = percentChange(
    thisWeek.totalVolumeKg,
    lastWeek?.totalVolumeKg ?? 0,
  )
  const streak = countActiveWeekStreak(weeks)

  const thisWeekTopSets = React.useMemo(
    () =>
      topSetsByExercise(
        days.filter(
          (day) => day.date >= thisWeek.fromIso && day.date <= thisWeek.toIso,
        ),
      ),
    [days, thisWeek],
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            ダッシュボード
          </CardTitle>
          <CardDescription>
            今週 ({thisWeek.label}) の状況と、直近 {WEEKS_SHOWN}{" "}
            週間の総負荷量の推移です。週は月曜始まりです。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p className="text-destructive py-8 text-center text-sm">
              {error.message || "データの取得に失敗しました"}
            </p>
          )}

          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
              <Skeleton className="h-[240px] w-full" />
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="今週の総負荷量"
                  value={formatKg(thisWeek.totalVolumeKg)}
                  hint={
                    volumeChange === null
                      ? "前週の記録なし"
                      : `前週比 ${volumeChange > 0 ? "+" : ""}${volumeChange}%`
                  }
                  hintTone={
                    volumeChange === null
                      ? "muted"
                      : volumeChange >= 0
                        ? "positive"
                        : "negative"
                  }
                />
                <Stat
                  label="今週のジム日数"
                  value={`${thisWeek.gymDays} 日`}
                  hint={`先週 ${lastWeek?.gymDays ?? 0} 日`}
                />
                <Stat
                  label="今週のセット数"
                  value={`${thisWeek.setCount} セット`}
                  hint={`先週 ${lastWeek?.setCount ?? 0} セット`}
                />
                <Stat
                  label="連続トレーニング週"
                  value={
                    <span className="flex items-center gap-1">
                      <Flame
                        className={cn(
                          "h-4 w-4",
                          streak > 0
                            ? "text-orange-500"
                            : "text-muted-foreground",
                        )}
                      />
                      {streak} 週
                    </span>
                  }
                  hint="1回以上ジムに行った週の連続数"
                />
              </div>

              <div className="relative">
                {isFetching && (
                  <div className="text-muted-foreground absolute top-0 right-0 z-10 flex items-center gap-1 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    更新中
                  </div>
                )}
                <p className="mb-2 text-sm font-medium">週ごとの総負荷量</p>
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[240px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={weeks}
                    margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(label: string) => label.split(" ")[0]}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={48}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            String(payload?.[0]?.payload?.label ?? "")
                          }
                          formatter={(value, _name, item) => {
                            const week = item.payload as (typeof weeks)[number]
                            return (
                              <div className="flex w-full flex-col gap-1">
                                <Row
                                  label="総負荷量"
                                  value={formatKg(Number(value))}
                                />
                                <Row
                                  label="ジム日数"
                                  value={`${week.gymDays} 日`}
                                />
                                <Row
                                  label="セット数"
                                  value={`${week.setCount}`}
                                />
                              </div>
                            )
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="totalVolumeKg"
                      fill="var(--color-totalVolumeKg)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">今週の種目</p>
                {thisWeekTopSets.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
                    今週はまだ記録がありません。
                  </p>
                ) : (
                  <ul className="divide-border/60 divide-y rounded-lg border">
                    {thisWeekTopSets.map((top) => (
                      <li
                        key={top.exercisePageId}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{top.exerciseName}</p>
                          <p className="text-muted-foreground text-xs">
                            {top.setCount} セット ·{" "}
                            {formatKg(top.totalVolumeKg)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-[10px]">
                            ベスト
                          </p>
                          <p className="font-mono tabular-nums">
                            {top.bestWeightKg} kg × {top.bestReps} 回
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  hintTone = "muted",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  hintTone?: "muted" | "positive" | "negative"
}) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      {hint && (
        <p
          className={cn(
            "text-[10px]",
            hintTone === "muted" && "text-muted-foreground",
            hintTone === "positive" && "text-emerald-600 dark:text-emerald-400",
            hintTone === "negative" && "text-rose-600 dark:text-rose-400",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
