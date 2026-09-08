"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartLine, Loader2 } from "lucide-react"

import {
  useExerciseOptions,
  useWorkoutProgress,
} from "@/lib/api/queries/useWorkoutLog"
import {
  summarizeWorkoutProgress,
  type WorkoutProgressPoint,
} from "@/core/domain/workout-progress"
import {
  formatFullDate,
  formatKg,
  formatShortDate,
  formatSignedKg,
} from "@/lib/workout-format"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ExerciseSelect } from "./exercise-select"

type MetricKey = keyof Pick<
  WorkoutProgressPoint,
  "weightKg" | "reps" | "volume" | "estimatedOneRepMaxKg"
>

type MetricDefinition = {
  key: MetricKey
  tab: string
  label: string
  color: string
  unit: string
}

const METRICS: MetricDefinition[] = [
  {
    key: "weightKg",
    tab: "重量",
    label: "重量 (kg)",
    color: "hsl(221, 83%, 53%)",
    unit: "kg",
  },
  {
    key: "reps",
    tab: "回数",
    label: "回数",
    color: "hsl(142, 71%, 45%)",
    unit: "回",
  },
  {
    key: "volume",
    tab: "総負荷",
    label: "総負荷量 (kg)",
    color: "hsl(32, 95%, 44%)",
    unit: "kg",
  },
  {
    key: "estimatedOneRepMaxKg",
    tab: "推定1RM",
    label: "推定1RM (kg)",
    color: "hsl(280, 65%, 55%)",
    unit: "kg",
  },
]

const chartConfig: ChartConfig = Object.fromEntries(
  METRICS.map((m) => [m.key, { label: m.label, color: m.color }]),
)

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
  const summary = summarizeWorkoutProgress(points)
  const hasData = Boolean(exercisePageId) && !isLoadingProgress && !error

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
              種目ごとの重量・回数・総負荷・推定1RMの推移を確認できます。
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <ExerciseSelect
              className="w-full sm:w-64"
              value={exercisePageId}
              onValueChange={setExercisePageId}
              options={exerciseOptions}
              isLoading={isLoadingExercises}
            />

            <Tabs
              value={metric}
              onValueChange={(value) => setMetric(value as MetricKey)}
            >
              <TabsList>
                {METRICS.map((m) => (
                  <TabsTrigger key={m.key} value={m.key}>
                    {m.tab}
                  </TabsTrigger>
                ))}
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

          {hasData && points.length === 0 && (
            <p className="text-muted-foreground py-16 text-center text-sm">
              「{selectedLabel}」の記録がまだありません。
            </p>
          )}

          {hasData && summary && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Stat
                  label="最新重量"
                  value={formatKg(summary.latest.weightKg)}
                  hint={formatFullDate(summary.latest.date)}
                />
                <Stat
                  label="最新回数"
                  value={`${summary.latest.reps} 回`}
                  hint={formatFullDate(summary.latest.date)}
                />
                <Stat label="最高重量" value={formatKg(summary.maxWeightKg)} />
                <Stat
                  label="推定1RM (最高)"
                  value={formatKg(summary.maxEstimatedOneRepMaxKg)}
                  hint="Epley式: kg × (1 + 回数/30)"
                />
                <Stat
                  label="重量の変化"
                  value={formatSignedKg(summary.weightDeltaKg)}
                  hint={`${formatFullDate(summary.first.date)} → ${formatFullDate(summary.latest.date)}`}
                />
              </div>

              <div className="relative">
                {isFetching && (
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
                      tickFormatter={formatShortDate}
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
                          formatter={(_, name, item) =>
                            name === metric ? (
                              <PointTooltip
                                point={item.payload as WorkoutProgressPoint}
                                metric={metric}
                              />
                            ) : null
                          }
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
                同一日に複数セットがある場合は、その日の最重量セットを表示しています（総負荷量は全セット合計、推定1RMは全セット中の最高値）。
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Tooltip body: the active metric first, then the remaining context for that day. */
function PointTooltip({
  point,
  metric,
}: {
  point: WorkoutProgressPoint
  metric: MetricKey
}) {
  const ordered = [
    ...METRICS.filter((m) => m.key === metric),
    ...METRICS.filter((m) => m.key !== metric),
  ]
  const rows = [
    ...ordered.map((m) => ({
      label: m.label,
      value: `${point[m.key]} ${m.unit}`,
    })),
    { label: "セット数", value: String(point.setCount) },
  ]

  return (
    <div className="flex w-full flex-col gap-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-mono tabular-nums">{row.value}</span>
        </div>
      ))}
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
