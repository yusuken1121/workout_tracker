import { describe, expect, it, vi } from "vitest"
import type { Client } from "@notionhq/client"
import { NotionWorkoutLogUpdater } from "./workout-log.updater"
import { NotionWriteError } from "./notion-write.error"

describe("NotionWorkoutLogUpdater", () => {
  it("maps the patch onto the Notion kg / reps / 感想 properties", async () => {
    const update = vi.fn().mockResolvedValue({})
    const client = { pages: { update } } as unknown as Client

    await new NotionWorkoutLogUpdater(client).update("log-1", {
      weightKg: 62.5,
      reps: 6,
      notes: "good",
    })

    expect(update).toHaveBeenCalledWith({
      page_id: "log-1",
      properties: {
        kg: { number: 62.5 },
        reps: { number: 6 },
        感想: { title: [{ text: { content: "good" } }] },
      },
    })
  })

  it("leaves 感想 untouched when notes are omitted", async () => {
    const update = vi.fn().mockResolvedValue({})
    const client = { pages: { update } } as unknown as Client

    await new NotionWorkoutLogUpdater(client).update("log-1", {
      weightKg: 60,
      reps: 8,
    })

    expect(update.mock.calls[0][0].properties).toEqual({
      kg: { number: 60 },
      reps: { number: 8 },
    })
  })

  it("wraps SDK errors in NotionWriteError", async () => {
    const update = vi.fn().mockRejectedValue(new Error("boom"))
    const client = { pages: { update } } as unknown as Client

    await expect(
      new NotionWorkoutLogUpdater(client).update("log-1", {
        weightKg: 60,
        reps: 8,
      }),
    ).rejects.toThrow(NotionWriteError)
  })
})
