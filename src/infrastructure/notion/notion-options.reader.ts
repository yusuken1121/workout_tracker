import type { Client } from "@notionhq/client"
import type { NotionOption } from "../../core/domain/notion-option"
import type { INotionOptionsReader } from "../../core/ports/notion-options-reader.port"
import { NotionClientFactory } from "./notion-client.factory"
import { queryAllDataSourcePages } from "./notion-data-source.util"
import {
  extractPlainText,
  extractSelectOptionNames,
} from "./notion-page-property.util"

/**
 * Lists selectable options (id + title) from any Notion data source.
 * Select / multi-select values on each page are exposed as `tags` so the UI
 * can filter by them (e.g. a 部位 column on the 種目 database).
 */
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
      .map((page): NotionOption => {
        const option: NotionOption = {
          id: page.id,
          label: extractPlainText(page, this.titlePropertyName).trim(),
        }
        const tags = extractSelectOptionNames(page)
        return tags.length > 0 ? { ...option, tags } : option
      })
      .filter((option) => option.label.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label, "ja"))
  }
}
