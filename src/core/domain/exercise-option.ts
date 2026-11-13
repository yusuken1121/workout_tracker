import type { NotionOption } from "./notion-option"
import type { WorkoutLogEntry } from "./workout-progress"

/** An exercise (種目) option annotated with how recently / often it was logged. */
export interface ExerciseOption extends NotionOption {
  /** Most recent date (YYYY-MM-DD) this exercise was logged, if any. */
  lastPerformedAt?: string
  /** Number of distinct days this exercise was logged in the lookback window. */
  recentDayCount?: number
}

/**
 * Adds `lastPerformedAt` / `recentDayCount` to each option from recent log
 * entries. Options never logged are returned unchanged.
 */
export function annotateExerciseUsage(
  options: NotionOption[],
  entries: WorkoutLogEntry[],
): ExerciseOption[] {
  const daysById = new Map<string, Set<string>>()
  for (const entry of entries) {
    if (!entry.exercisePageId) continue
    let days = daysById.get(entry.exercisePageId)
    if (!days) {
      days = new Set()
      daysById.set(entry.exercisePageId, days)
    }
    days.add(entry.performedAt)
  }

  return options.map((option) => {
    const days = daysById.get(option.id)
    if (!days || days.size === 0) return option

    let lastPerformedAt = ""
    for (const day of days) {
      if (day > lastPerformedAt) lastPerformedAt = day
    }
    return { ...option, lastPerformedAt, recentDayCount: days.size }
  })
}

/** Exercises logged recently, most recent first (ties → more frequent first). */
export function pickRecentExercises(
  options: ExerciseOption[],
  limit: number,
): ExerciseOption[] {
  return options
    .filter((option) => option.lastPerformedAt)
    .sort(
      (a, b) =>
        (b.lastPerformedAt ?? "").localeCompare(a.lastPerformedAt ?? "") ||
        (b.recentDayCount ?? 0) - (a.recentDayCount ?? 0) ||
        a.label.localeCompare(b.label, "ja"),
    )
    .slice(0, limit)
}

/** Every distinct tag across options, in Japanese collation order. */
export function collectExerciseTags(options: NotionOption[]): string[] {
  const tags = new Set<string>()
  for (const option of options) {
    for (const tag of option.tags ?? []) tags.add(tag)
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, "ja"))
}

const KATAKANA_START = 0x30a1
const KATAKANA_END = 0x30f6
const KANA_OFFSET = 0x60

/**
 * Normalizes text for forgiving search: full-width → half-width, lower case,
 * katakana → hiragana, and separators (spaces, ・, -, _) removed.
 * "ベンチ・プレス" and "べんちぷれす" both become "べんちぷれす".
 */
export function normalizeSearchText(text: string): string {
  let result = ""
  for (const char of text.normalize("NFKC").toLowerCase()) {
    const code = char.codePointAt(0) ?? 0
    result +=
      code >= KATAKANA_START && code <= KATAKANA_END
        ? String.fromCodePoint(code - KANA_OFFSET)
        : char
  }
  return result.replace(/[\s・\-_]/g, "")
}

export type ExerciseFilter = {
  query?: string
  tag?: string | null
}

/**
 * Filters options by tag and by a space-separated query (every word must
 * match the name or a tag). With a query, names that start with it come
 * first; otherwise the original order is kept.
 */
export function filterExerciseOptions<T extends NotionOption>(
  options: T[],
  { query = "", tag = null }: ExerciseFilter,
): T[] {
  const words = query
    .split(/[\s　]+/)
    .map(normalizeSearchText)
    .filter(Boolean)

  const matched = options.filter((option) => {
    if (tag && !(option.tags ?? []).includes(tag)) return false
    if (words.length === 0) return true
    const haystack = normalizeSearchText(
      [option.label, ...(option.tags ?? [])].join(" "),
    )
    return words.every((word) => haystack.includes(word))
  })

  if (words.length === 0) return matched

  const first = words[0]
  const startsWith = (option: T) =>
    normalizeSearchText(option.label).startsWith(first) ? 0 : 1
  return matched
    .map((option, index) => ({ option, index }))
    .sort(
      (a, b) =>
        startsWith(a.option) - startsWith(b.option) || a.index - b.index,
    )
    .map(({ option }) => option)
}
