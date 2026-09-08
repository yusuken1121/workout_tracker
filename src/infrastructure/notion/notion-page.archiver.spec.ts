import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { NotionPageArchiver } from "./notion-page.archiver"
import { NotionWriteError } from "./notion-write.error"

describe("NotionPageArchiver", () => {
  it("archives the page via pages.update", async () => {
    const update = vi.fn().mockResolvedValue({ id: "page-1", archived: true })
    const client = { pages: { update } } as unknown as Client

    await new NotionPageArchiver(client).archive("page-1")

    expect(update).toHaveBeenCalledWith({ page_id: "page-1", archived: true })
  })

  it("wraps SDK errors in NotionWriteError", async () => {
    const update = vi.fn().mockRejectedValue(new Error("not found"))
    const client = { pages: { update } } as unknown as Client

    await expect(
      new NotionPageArchiver(client).archive("missing"),
    ).rejects.toThrow(NotionWriteError)
  })
})
