import { format, parseISO } from "date-fns"

/** Date → YYYY-MM-DD (local time). */
export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

/** 1305 → "1,305 kg" */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString("ja-JP")} kg`
}

/** +5 → "+5 kg", -2.5 → "-2.5 kg" */
export function formatSignedKg(deltaKg: number): string {
  const sign = deltaKg > 0 ? "+" : ""
  return `${sign}${deltaKg.toLocaleString("ja-JP")} kg`
}

/** "2026-08-02" → "8/2" (falls back to the raw string when unparsable). */
export function formatShortDate(dateIso: string): string {
  return safeFormatIso(dateIso, "M/d")
}

/** "2026-08-02" → "2026/08/02" */
export function formatFullDate(dateIso: string): string {
  return safeFormatIso(dateIso, "yyyy/MM/dd")
}

/** Date → "2026年8月2日" */
export function formatJapaneseDate(date: Date): string {
  return format(date, "yyyy年M月d日")
}

function safeFormatIso(dateIso: string, pattern: string): string {
  const parsed = parseISO(dateIso)
  return Number.isNaN(parsed.getTime()) ? dateIso : format(parsed, pattern)
}
