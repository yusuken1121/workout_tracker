/** A selectable option backed by a Notion page (e.g. an Exercise row). */
export interface NotionOption {
  id: string
  label: string
  /**
   * Values of the page's select / multi-select properties (e.g. 部位 "胸",
   * 器具 "バーベル"). Used as filter chips. Omitted when the page has none.
   */
  tags?: string[]
}
