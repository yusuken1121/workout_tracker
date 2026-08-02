import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { NotionWeekResolver } from "./week.resolver"

describe("NotionWeekResolver", () => {
  function makeClient(results: unknown[]): Client {
    return {
      dataSources: {
        query: vi
          .fn()
          .mockResolvedValue({ results, has_more: false, next_cursor: null }),
      },
    } as unknown as Client
  }

  it("returns the page id of the week containing the given date", async () => {
    const client = makeClient([
      {
        object: "page",
        id: "week-1",
        properties: {
          期間: {
            type: "date",
            date: { start: "2026-01-05", end: "2026-01-11" },
          },
        },
      },
      {
        object: "page",
        id: "week-2",
        properties: {
          期間: {
            type: "date",
            date: { start: "2026-01-12", end: "2026-01-18" },
          },
        },
      },
    ])

    const resolver = new NotionWeekResolver("data-source-1", "期間", client)

    await expect(resolver.findWeekIdForDate("2026-01-15")).resolves.toBe(
      "week-2",
    )
  })

  it("returns undefined when no week matches", async () => {
    const client = makeClient([
      {
        object: "page",
        id: "week-1",
        properties: {
          期間: {
            type: "date",
            date: { start: "2026-01-05", end: "2026-01-11" },
          },
        },
      },
    ])

    const resolver = new NotionWeekResolver("data-source-1", "期間", client)

    await expect(
      resolver.findWeekIdForDate("2099-01-01"),
    ).resolves.toBeUndefined()
  })

  it("returns undefined for an invalid target date without querying", async () => {
    const client = makeClient([])
    const resolver = new NotionWeekResolver("data-source-1", "期間", client)

    await expect(
      resolver.findWeekIdForDate("not-a-date"),
    ).resolves.toBeUndefined()
    expect(client.dataSources.query).not.toHaveBeenCalled()
  })
})
