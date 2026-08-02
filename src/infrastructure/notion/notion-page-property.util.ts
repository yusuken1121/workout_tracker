import type { PageObjectResponse } from "@notionhq/client"

/** Reads the plain text of a title or rich_text property, or "" if absent. */
export function extractPlainText(
  page: PageObjectResponse,
  propertyName: string,
): string {
  const property = page.properties[propertyName]
  if (!property) return ""

  if (property.type === "title") {
    return property.title.map((t) => t.plain_text).join("")
  }
  if (property.type === "rich_text") {
    return property.rich_text.map((t) => t.plain_text).join("")
  }
  return ""
}

/** Reads a date property's start/end as Date objects, or null if unset/invalid. */
export function extractDateRange(
  page: PageObjectResponse,
  propertyName: string,
): { start: Date; end: Date } | null {
  const property = page.properties[propertyName]
  if (!property || property.type !== "date" || !property.date?.start) {
    return null
  }

  const start = new Date(property.date.start)
  if (Number.isNaN(start.getTime())) return null

  const end = property.date.end ? new Date(property.date.end) : null
  if (end && !Number.isNaN(end.getTime())) {
    return { start, end }
  }

  // No explicit end: assume this date marks the start of a 7-day week.
  const inferredEnd = new Date(start)
  inferredEnd.setDate(inferredEnd.getDate() + 6)
  return { start, end: inferredEnd }
}

/** Reads a number property, or null if unset/non-numeric. */
export function extractNumber(
  page: PageObjectResponse,
  propertyName: string,
): number | null {
  const property = page.properties[propertyName]
  if (!property || property.type !== "number" || property.number === null) {
    return null
  }
  return property.number
}

/** Reads related page IDs from a relation property. */
export function extractRelationIds(
  page: PageObjectResponse,
  propertyName: string,
): string[] {
  const property = page.properties[propertyName]
  if (!property || property.type !== "relation") {
    return []
  }
  return property.relation.map((item) => item.id)
}

/**
 * Reads a date property's start as YYYY-MM-DD.
 * Handles both date-only and datetime Notion values.
 */
export function extractDateStartIso(
  page: PageObjectResponse,
  propertyName: string,
): string | null {
  const property = page.properties[propertyName]
  if (!property || property.type !== "date" || !property.date?.start) {
    return null
  }

  const raw = property.date.start
  // date-only: "2026-08-02" | datetime: "2026-08-02T04:50:00.000Z" or "2026-08-02 04:50:00Z"
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}
