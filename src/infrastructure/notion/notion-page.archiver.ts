import type { Client } from "@notionhq/client"
import type { INotionPageArchiver } from "../../core/ports/notion-page-archiver.port"
import { NotionClientFactory } from "./notion-client.factory"
import { NotionWriteError } from "./notion-write.error"

/** Archives a Notion page (moves it to trash) via the pages.update endpoint. */
export class NotionPageArchiver implements INotionPageArchiver {
  private readonly client: Client

  constructor(client?: Client) {
    this.client = client ?? NotionClientFactory.create()
  }

  async archive(pageId: string): Promise<void> {
    try {
      await this.client.pages.update({ page_id: pageId, archived: true })
    } catch (error) {
      throw new NotionWriteError("Failed to archive Notion page", error)
    }
  }
}
