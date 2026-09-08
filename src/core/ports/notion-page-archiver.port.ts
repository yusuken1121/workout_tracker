/** Archives (soft-deletes) a Notion page by ID. Archived pages can be restored from Notion's trash. */
export interface INotionPageArchiver {
  archive(pageId: string): Promise<void>
}
