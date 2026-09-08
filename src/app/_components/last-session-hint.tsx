"use client"

import { History, Loader2 } from "lucide-react"
import type { WorkoutProgressPoint } from "@/core/domain/workout-progress"
import { formatKg, formatShortDate } from "@/lib/workout-format"
import { Button } from "@/components/ui/button"

type LastSessionHintProps = {
  lastSession: WorkoutProgressPoint | null
  isLoading: boolean
  onApply: (session: WorkoutProgressPoint) => void
}

/** Shows the previous session's best set for the selected exercise, with a one-tap prefill. */
export function LastSessionHint({
  lastSession,
  isLoading,
  onApply,
}: LastSessionHintProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        前回の記録を読み込み中...
      </div>
    )
  }

  if (!lastSession) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
        この種目の記録はまだありません。今日が初回です。
      </p>
    )
  }

  return (
    <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <History className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="leading-tight">
          <p className="text-muted-foreground text-xs">
            前回 ({formatShortDate(lastSession.date)}) のベストセット
          </p>
          <p className="font-mono font-medium tabular-nums">
            {lastSession.weightKg} kg × {lastSession.reps} 回
            <span className="text-muted-foreground ml-2 text-xs font-sans">
              {lastSession.setCount}セット · 推定1RM{" "}
              {formatKg(lastSession.estimatedOneRepMaxKg)}
            </span>
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onApply(lastSession)}
      >
        前回の値を入力
      </Button>
    </div>
  )
}
