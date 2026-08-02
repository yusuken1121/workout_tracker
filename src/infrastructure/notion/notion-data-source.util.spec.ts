import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { queryAllDataSourcePages } from "./notion-data-source.util"

describe("queryAllDataSourcePages", () => {
  it("follows pagination until has_more is false", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        results: [{ object: "page", id: "page-1" }],
        has_more: true,
        next_cursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        results: [{ object: "page", id: "page-2" }],
        has_more: false,
        next_cursor: null,
      })
    const client = { dataSources: { query } } as unknown as Client

    const pages = await queryAllDataSourcePages(client, "data-source-1")

    expect(pages.map((p) => p.id)).toEqual(["page-1", "page-2"])
    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenNthCalledWith(1, {
      data_source_id: "data-source-1",
      page_size: 100,
      start_cursor: undefined,
    })
    expect(query).toHaveBeenNthCalledWith(2, {
      data_source_id: "data-source-1",
      page_size: 100,
      start_cursor: "cursor-1",
    })
  })

  it("filters out non-page results (e.g. nested data sources)", async () => {
    const query = vi.fn().mockResolvedValue({
      results: [
        { object: "page", id: "page-1" },
        { object: "data_source", id: "ds-1" },
      ],
      has_more: false,
      next_cursor: null,
    })
    const client = { dataSources: { query } } as unknown as Client

    const pages = await queryAllDataSourcePages(client, "data-source-1")

    expect(pages.map((p) => p.id)).toEqual(["page-1"])
  })
})
