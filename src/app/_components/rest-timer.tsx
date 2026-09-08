"use client"

import * as React from "react"
import { Pause, Play, RotateCcw, TimerReset } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const PRESETS_SECONDS = [60, 90, 120, 180] as const
const STORAGE_KEY = "workout-tracker.rest-timer"

type StoredSettings = { seconds: number; autoStart: boolean }
const DEFAULT_SETTINGS: StoredSettings = { seconds: 90, autoStart: true }

function loadSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<StoredSettings>
    return {
      seconds:
        typeof parsed.seconds === "number" && parsed.seconds > 0
          ? parsed.seconds
          : DEFAULT_SETTINGS.seconds,
      autoStart:
        typeof parsed.autoStart === "boolean"
          ? parsed.autoStart
          : DEFAULT_SETTINGS.autoStart,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: StoredSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage may be unavailable (private mode); the timer still works.
  }
}

/** Short double beep so the end of a rest is noticeable in a noisy gym. */
function beep() {
  try {
    const AudioCtx = window.AudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const play = (at: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 0.3)
    }
    play(ctx.currentTime)
    play(ctx.currentTime + 0.35)
    window.setTimeout(() => void ctx.close(), 1200)
  } catch {
    // Audio is a nicety; ignore failures (autoplay policy, no device).
  }
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

type RestTimerProps = {
  /**
   * Increment to request an automatic start (e.g. after a set is saved).
   * Ignored while the auto-start switch is off.
   */
  autoStartSignal: number
  className?: string
}

/** Interval rest timer with presets, auto-start after saving, and an end-of-rest beep. */
export function RestTimer({ autoStartSignal, className }: RestTimerProps) {
  const [settings, setSettings] =
    React.useState<StoredSettings>(DEFAULT_SETTINGS)
  const [remaining, setRemaining] = React.useState(DEFAULT_SETTINGS.seconds)
  const [endsAt, setEndsAt] = React.useState<number | null>(null)
  const isRunning = endsAt !== null
  const lastSignal = React.useRef(autoStartSignal)

  // Load persisted settings once on the client.
  React.useEffect(() => {
    const stored = loadSettings()
    setSettings(stored)
    setRemaining(stored.seconds)
  }, [])

  const start = React.useCallback((seconds: number) => {
    setRemaining(seconds)
    setEndsAt(Date.now() + seconds * 1000)
  }, [])

  const stop = React.useCallback(() => setEndsAt(null), [])

  // Auto-start when a set is saved.
  React.useEffect(() => {
    if (autoStartSignal === lastSignal.current) return
    lastSignal.current = autoStartSignal
    if (settings.autoStart) start(settings.seconds)
  }, [autoStartSignal, settings, start])

  // Tick while running; finish with a beep + toast.
  React.useEffect(() => {
    if (endsAt === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        setEndsAt(null)
        beep()
        toast.success("休憩終了。次のセットへ！")
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endsAt])

  const updateSettings = (next: Partial<StoredSettings>) => {
    const merged = { ...settings, ...next }
    setSettings(merged)
    saveSettings(merged)
  }

  const selectPreset = (seconds: number) => {
    updateSettings({ seconds })
    if (isRunning) {
      start(seconds)
    } else {
      setRemaining(seconds)
    }
  }

  const progress = Math.round(
    ((settings.seconds - remaining) / settings.seconds) * 100,
  )

  return (
    <div className={cn("rounded-lg border px-3 py-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TimerReset className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">休息タイマー</span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="rest-timer-autostart" className="text-xs">
            保存後に自動開始
          </Label>
          <Switch
            id="rest-timer-autostart"
            checked={settings.autoStart}
            onCheckedChange={(checked) =>
              updateSettings({ autoStart: checked })
            }
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p
          className={cn(
            "font-mono text-3xl font-semibold tabular-nums",
            isRunning && remaining <= 5 && "text-destructive",
          )}
          aria-live="polite"
        >
          {formatClock(remaining)}
        </p>
        <div className="flex flex-1 flex-col gap-2">
          <Progress
            value={isRunning || remaining < settings.seconds ? progress : 0}
          />
          <div className="flex flex-wrap gap-1">
            {PRESETS_SECONDS.map((seconds) => (
              <Button
                key={seconds}
                type="button"
                size="sm"
                variant={settings.seconds === seconds ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => selectPreset(seconds)}
              >
                {formatClock(seconds)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {isRunning ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stop}
              aria-label="一時停止"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={() =>
                start(remaining > 0 ? remaining : settings.seconds)
              }
              aria-label="開始"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              stop()
              setRemaining(settings.seconds)
            }}
            aria-label="リセット"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
