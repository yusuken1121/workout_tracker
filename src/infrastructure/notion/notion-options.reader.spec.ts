import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { NotionOptionsReader } from "./notion-options.reader"

describe("NotionOptionsReader", () => {
  function makeClient(results: unknown[]): Client {
    return {
      dataSources: {
        query: vi
          .fn()
          .mockResolvedValue({ results, has_more: false, next_cursor: null }),
      },
    } as unknown as Client
  }

  it("maps pages to id/label options sorted alphabetically", async () => {
    const client = makeClient([
      {
        object: "page",
        id: "page-2",
        properties: {
          種目名: { type: "title", title: [{ plain_text: "Squat" }] },
        },
      },
      {
        object: "page",
        id: "page-1",
        properties: {
          種目名: { type: "title", title: [{ plain_text: "Bench Press" }] },
        },
      },
    ])

    const reader = new NotionOptionsReader("data-source-1", "種目名", client)
    const result = await reader.listOptions()

    expect(result).toEqual([
      { id: "page-1", label: "Bench Press" },
      { id: "page-2", label: "Squat" },
    ])
    expect(client.dataSources.query).toHaveBeenCalledWith({
      data_source_id: "data-source-1",
      page_size: 100,
      start_cursor: undefined,
    })
  })

  it("skips non-page results and pages with an empty title", async () => {
    const client = makeClient([
      { object: "data_source", id: "ds-1" },
      {
        object: "page",
        id: "page-1",
        properties: { 種目名: { type: "title", title: [] } },
      },
    ])

    const reader = new NotionOptionsReader("data-source-1", "種目名", client)
    const result = await reader.listOptions()

    expect(result).toEqual([])
  })
})
