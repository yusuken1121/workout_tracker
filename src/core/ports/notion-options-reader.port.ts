import type { NotionOption } from "../domain/notion-option"

/** Reads selectable options (id + label) from a Notion data source. */
export interface INotionOptionsReader {
  listOptions(): Promise<NotionOption[]>
}
