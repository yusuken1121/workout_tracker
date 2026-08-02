/** Resolves the Notion page ID of the Weekly Progress entry containing a given date. */
export interface IWeekResolver {
  findWeekIdForDate(dateIso: string): Promise<string | undefined>
}
