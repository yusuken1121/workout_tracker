import type { Client } from "@notionhq/client"
import type { NotionOption } from "../../core/domain/notion-option"
import type { INotionOptionsReader } from "../../core/ports/notion-options-reader.port"
import { NotionClientFactory } from "./notion-client.factory"
import { queryAllDataSourcePages } from "./notion-data-source.util"
import { extractPlainText } from "./notion-page-property.util"

/** Lists selectable options (id + title) from any Notion data source. */
export class NotionOptionsReader implements INotionOptionsReader {
  private readonly client: Client

  constructor(
    private readonly dataSourceId: string,
    private readonly titlePropertyName: string,
    client?: Client,
  ) {
    this.client = client ?? NotionClientFactory.create()
  }

  async listOptions(): Promise<NotionOption[]> {
    const pages = await queryAllDataSourcePages(this.client, this.dataSourceId)

    return pages
      .map((page) => ({
        id: page.id,
        label: extractPlainText(page, this.titlePropertyName),
      }))
      .filter((option) => option.label.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label))
  }
}
