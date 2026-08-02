export type NotionFieldType =
  | "title"
  | "rich_text"
  | "number"
  | "date"
  | "select"
  | "files"
  | "checkbox"
  | "url"
  | "relation"

export type NotionFieldMapping<TRecord> = {
  /** Omit when using transform-only fields (e.g. derived title). */
  recordKey?: keyof TRecord & string
  propertyName: string
  type: NotionFieldType
  transform?: (value: unknown, record: TRecord) => unknown
  /** When true, a missing/undefined/null value skips this property instead of throwing. */
  optional?: boolean
}

export type NotionDatabaseConfig<TRecord> = {
  databaseId: string
  fields: Array<NotionFieldMapping<TRecord>>
}
