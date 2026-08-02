import { describe, expect, it } from "vitest"
import type { PageObjectResponse } from "@notionhq/client"
import {
  extractDateRange,
  extractPlainText,
  extractNumber,
  extractRelationIds,
  extractDateStartIso,
} from "./notion-page-property.util"

function makePage(
  properties: PageObjectResponse["properties"],
): PageObjectResponse {
  return { properties } as unknown as PageObjectResponse
}

describe("extractPlainText", () => {
  it("reads plain text from a title property", () => {
    const page = makePage({
      種目名: {
        type: "title",
        title: [{ plain_text: "Bench Press" }],
      },
    } as unknown as PageObjectResponse["properties"])

    expect(extractPlainText(page, "種目名")).toBe("Bench Press")
  })

  it("reads plain text from a rich_text property", () => {
    const page = makePage({
      Notes: {
        type: "rich_text",
        rich_text: [{ plain_text: "hello " }, { plain_text: "world" }],
      },
    } as unknown as PageObjectResponse["properties"])

    expect(extractPlainText(page, "Notes")).toBe("hello world")
  })

  it("returns an empty string when the property is missing", () => {
    const page = makePage({} as PageObjectResponse["properties"])
    expect(extractPlainText(page, "Missing")).toBe("")
  })
})

describe("extractDateRange", () => {
  it("returns the explicit start/end when both are set", () => {
    const page = makePage({
      期間: {
        type: "date",
        date: { start: "2026-01-05", end: "2026-01-11" },
      },
    } as unknown as PageObjectResponse["properties"])

    const range = extractDateRange(page, "期間")

    expect(range?.start.toISOString().slice(0, 10)).toBe("2026-01-05")
    expect(range?.end.toISOString().slice(0, 10)).toBe("2026-01-11")
  })

  it("infers a 7-day range when only start is set", () => {
    const page = makePage({
      期間: {
        type: "date",
        date: { start: "2026-01-05", end: null },
      },
    } as unknown as PageObjectResponse["properties"])

    const range = extractDateRange(page, "期間")

    expect(range?.start.toISOString().slice(0, 10)).toBe("2026-01-05")
    expect(range?.end.toISOString().slice(0, 10)).toBe("2026-01-11")
  })

  it("returns null when the date property is unset", () => {
    const page = makePage({
      期間: { type: "date", date: null },
    } as unknown as PageObjectResponse["properties"])

    expect(extractDateRange(page, "期間")).toBeNull()
  })
})

describe("extractNumber", () => {
  it("reads a number property", () => {
    const page = makePage({
      kg: { type: "number", number: 62.5 },
    } as unknown as PageObjectResponse["properties"])

    expect(extractNumber(page, "kg")).toBe(62.5)
  })

  it("returns null when the number is unset", () => {
    const page = makePage({
      kg: { type: "number", number: null },
    } as unknown as PageObjectResponse["properties"])

    expect(extractNumber(page, "kg")).toBeNull()
  })
})

describe("extractRelationIds", () => {
  it("reads related page IDs", () => {
    const page = makePage({
      種目: { type: "relation", relation: [{ id: "ex-1" }, { id: "ex-2" }] },
    } as unknown as PageObjectResponse["properties"])

    expect(extractRelationIds(page, "種目")).toEqual(["ex-1", "ex-2"])
  })
})

describe("extractDateStartIso", () => {
  it("normalizes datetime values to YYYY-MM-DD", () => {
    const page = makePage({
      実施日: {
        type: "date",
        date: { start: "2026-08-02T04:50:00.000Z" },
      },
    } as unknown as PageObjectResponse["properties"])

    expect(extractDateStartIso(page, "実施日")).toBe("2026-08-02")
  })

  it("keeps date-only values as-is", () => {
    const page = makePage({
      実施日: { type: "date", date: { start: "2026-08-02" } },
    } as unknown as PageObjectResponse["properties"])

    expect(extractDateStartIso(page, "実施日")).toBe("2026-08-02")
  })
})
