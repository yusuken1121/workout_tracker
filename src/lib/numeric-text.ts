const PARTIAL_DECIMAL = /^\d*\.?\d*$/

/**
 * Parses what the user typed into a numeric field.
 * - `null`      → empty (or a lone "."), i.e. "no number yet"
 * - `undefined` → contains characters that can never form a number
 * - `number`    → the value, accepting in-progress input like "62."
 *
 * Full-width digits ("６２．５") and a "," decimal mark are normalized.
 */
export function parseNumericText(raw: string): number | null | undefined {
  const text = raw.normalize("NFKC").replace(/,/g, ".").trim()
  if (!PARTIAL_DECIMAL.test(text)) return undefined
  if (text === "" || text === ".") return null
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

/** Display text for a form value. 0 shows as empty so the placeholder appears. */
export function formatNumericText(value: number): string {
  return Number.isFinite(value) && value !== 0 ? String(value) : ""
}
