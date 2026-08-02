import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { NotionWorkoutLogReader } from "./workout-log.reader"

describe("NotionWorkoutLogReader", () => {
  function makeClient(results: unknown[]): Client {
    return {
      dataSources: {
        query: vi.fn().mockResolvedValue({
          results,
          has_more: false,
          next_cursor: null,
        }),
      },
    } as unknown as Client
  }

  it("maps Notion pages to WorkoutLogEntry and filters incomplete rows", async () => {
    const client = makeClient([
      {
        object: "page",
        id: "log-1",
        properties: {
          種目: { type: "relation", relation: [{ id: "ex-1" }] },
          kg: { type: "number", number: 60 },
          reps: { type: "number", number: 8 },
          実施日: { type: "date", date: { start: "2026-08-01T06:23:00.000Z" } },
          感想: { type: "title", title: [{ plain_text: "good" }] },
        },
      },
      {
        object: "page",
        id: "log-incomplete",
        properties: {
          種目: { type: "relation", relation: [{ id: "ex-1" }] },
          kg: { type: "number", number: null },
          reps: { type: "number", number: 8 },
          実施日: { type: "date", date: { start: "2026-08-01" } },
          感想: { type: "title", title: [] },
        },
      },
    ])

    const reader = new NotionWorkoutLogReader("data-source-1", client)
    const entries = await reader.listByExercise("ex-1")

    expect(entries).toEqual([
      {
        id: "log-1",
        exercisePageId: "ex-1",
        weightKg: 60,
        reps: 8,
        performedAt: "2026-08-01",
        notes: "good",
      },
    ])
    expect(client.dataSources.query).toHaveBeenCalledWith(
      expect.objectContaining({
        data_source_id: "data-source-1",
        filter: {
          property: "種目",
          relation: { contains: "ex-1" },
        },
      }),
    )
  })

  it("queries by date range using on_or_after / on_or_before filters", async () => {
    const client = makeClient([])
    const reader = new NotionWorkoutLogReader("data-source-1", client)

    await reader.listByDateRange("2026-08-01", "2026-08-31")

    expect(client.dataSources.query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          and: [
            { property: "実施日", date: { on_or_after: "2026-08-01" } },
            { property: "実施日", date: { on_or_before: "2026-08-31" } },
          ],
        },
      }),
    )
  })
})
