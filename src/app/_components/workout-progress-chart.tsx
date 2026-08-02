"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { format, parseISO } from "date-fns"
import { ChartLine, Loader2 } from "lucide-react"

import {
  useExerciseOptions,
  useWorkoutProgress,
} from "@/lib/api/queries/useWorkoutLog"
import type { WorkoutProgressPoint } from "@/core/domain/workout-progress"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

type MetricKey = "weightKg" | "reps" | "volume"

const METRIC_LABELS: Record<MetricKey, string> = {
  weightKg: "重量 (kg)",
  reps: "回数",
  volume: "総負荷量",
}

const chartConfig = {
  weightKg: { label: "重量 (kg)", color: "hsl(221, 83%, 53%)" },
  reps: { label: "回数", color: "hsl(142, 71%, 45%)" },
  volume: { label: "総負荷量", color: "hsl(32, 95%, 44%)" },
} satisfies ChartConfig

function formatDateLabel(dateIso: string): string {
  try {
    return format(parseISO(dateIso), "M/d")
  } catch {
    return dateIso
  }
}

function formatFullDate(dateIso: string): string {
  try {
    return format(parseISO(dateIso), "yyyy/MM/dd")
  } catch {
    return dateIso
  }
}

function summarize(points: WorkoutProgressPoint[]) {
  if (points.length === 0) return null

  const first = points[0]
  const latest = points[points.length - 1]
  const maxWeight = Math.max(...points.map((p) => p.weightKg))
  const maxReps = Math.max(...points.map((p) => p.reps))
  const weightDelta = latest.weightKg - first.weightKg

  return { first, latest, maxWeight, maxReps, weightDelta }
}

export function WorkoutProgressChart() {
  const [exercisePageId, setExercisePageId] = React.useState("")
  const [metric, setMetric] = React.useState<MetricKey>("weightKg")

  const { data: exerciseOptions, isLoading: isLoadingExercises } =
    useExerciseOptions()
  const {
    data: points = [],
    isLoading: isLoadingProgress,
    isFetching,
    error,
  } = useWorkoutProgress(exercisePageId)

  const selectedLabel =
    exerciseOptions?.find((o) => o.id === exercisePageId)?.label ?? ""
  const summary = summarize(points)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ChartLine className="h-5 w-5" />
              進捗グラフ
            </CardTitle>
            <CardDescription>
              種目ごとの重量・回数・実施日の推移を確認できます。
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <Select
              value={exercisePageId || undefined}
              onValueChange={setExercisePageId}
              disabled={isLoadingExercises}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue
                  placeholder={
                    isLoadingExercises
                      ? "読み込み中..."
                      : "種目を選択してください"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {exerciseOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs
              value={metric}
              onValueChange={(value) => setMetric(value as MetricKey)}
            >
              <TabsList>
                <TabsTrigger value="weightKg">重量</TabsTrigger>
                <TabsTrigger value="reps">回数</TabsTrigger>
                <TabsTrigger value="volume">総負荷</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!exercisePageId && (
            <p className="text-muted-foreground py-16 text-center text-sm">
              種目を選ぶと、そのメニューの推移グラフが表示されます。
            </p>
          )}

          {exercisePageId && isLoadingProgress && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="aspect-video w-full" />
            </div>
          )}

          {exercisePageId && error && (
            <p className="text-destructive py-16 text-center text-sm">
              {error.message || "データの取得に失敗しました"}
            </p>
          )}

          {exercisePageId &&
            !isLoadingProgress &&
            !error &&
            points.length === 0 && (
              <p className="text-muted-foreground py-16 text-center text-sm">
                「{selectedLabel}」の記録がまだありません。
              </p>
            )}

          {exercisePageId &&
            !isLoadingProgress &&
            !error &&
            points.length > 0 && (
              <>
                {summary && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat
                      label="最新重量"
                      value={`${summary.latest.weightKg} kg`}
                      hint={formatFullDate(summary.latest.date)}
                    />
                    <Stat
                      label="最新回数"
                      value={`${summary.latest.reps} 回`}
                      hint={formatFullDate(summary.latest.date)}
                    />
                    <Stat label="最高重量" value={`${summary.maxWeight} kg`} />
                    <Stat
                      label="重量の変化"
                      value={`${summary.weightDelta >= 0 ? "+" : ""}${summary.weightDelta} kg`}
                      hint={`${formatFullDate(summary.first.date)} → ${formatFullDate(summary.latest.date)}`}
                    />
                  </div>
                )}

                <div className="relative">
                  {isFetching && !isLoadingProgress && (
                    <div className="text-muted-foreground absolute top-0 right-0 z-10 flex items-center gap-1 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      更新中
                    </div>
                  )}

                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[320px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={points}
                      margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={24}
                        tickFormatter={formatDateLabel}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={40}
                        domain={["auto", "auto"]}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                              const date = payload?.[0]?.payload?.date
                              return typeof date === "string"
                                ? formatFullDate(date)
                                : ""
                            }}
                            formatter={(value, name, item) => {
                              const point = item.payload as WorkoutProgressPoint
                              if (name === metric) {
                                return (
                                  <div className="flex w-full flex-col gap-1">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-muted-foreground">
                                        {METRIC_LABELS[metric]}
                                      </span>
                                      <span className="font-mono font-medium tabular-nums">
                                        {String(value)}
                                      </span>
                                    </div>
                                    {metric !== "weightKg" && (
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">
                                          重量
                                        </span>
                                        <span className="font-mono tabular-nums">
                                          {point.weightKg} kg
                                        </span>
                                      </div>
                                    )}
                                    {metric !== "reps" && (
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">
                                          回数
                                        </span>
                                        <span className="font-mono tabular-nums">
                                          {point.reps} 回
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-muted-foreground">
                                        セット数
                                      </span>
                                      <span className="font-mono tabular-nums">
                                        {point.setCount}
                                      </span>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        }
                      />
                      <Line
                        dataKey={metric}
                        type="monotone"
                        stroke={`var(--color-${metric})`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                <p className="text-muted-foreground text-xs">
                  同一日に複数セットがある場合は、その日の最重量セットを表示しています（総負荷量は全セット合計）。
                </p>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-muted-foreground text-[10px]">{hint}</p>}
    </div>
  )
}
