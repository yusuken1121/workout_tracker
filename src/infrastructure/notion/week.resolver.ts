import type { Client, PageObjectResponse } from "@notionhq/client"
import type { IWeekResolver } from "../../core/ports/week-resolver.port"
import { NotionClientFactory } from "./notion-client.factory"
import { queryAllDataSourcePages } from "./notion-data-source.util"
import { extractDateRange } from "./notion-page-property.util"

/**
 * Notion's date filter compares against the *start* of a date-range
 * property. A generous lookback window keeps the filtered query small
 * (a handful of rows) without risking a false negative for irregular
 * week lengths.
 */
const LOOKBACK_DAYS = 32

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Finds the Weekly Progress page whose date range (期間) contains a given
 * date, so a new workout log entry can be auto-linked to the correct week.
 */
export class NotionWeekResolver implements IWeekResolver {
  private readonly client: Client

  constructor(
    private readonly dataSourceId: string,
    private readonly datePropertyName: string,
    client?: Client,
  ) {
    this.client = client ?? NotionClientFactory.create()
  }

  async findWeekIdForDate(dateIso: string): Promise<string | undefined> {
    const target = new Date(dateIso)
    if (Number.isNaN(target.getTime())) return undefined

    const candidates = await this.queryCandidatePages(target)
    const match = this.findContainingPage(candidates, target)
    if (match) return match.id

    // Filter assumptions didn't hold (e.g. unexpected data shape) — fall
    // back to a full scan so a valid week is never silently missed.
    const allPages = await queryAllDataSourcePages(
      this.client,
      this.dataSourceId,
    )
    return this.findContainingPage(allPages, target)?.id
  }

  private async queryCandidatePages(
    target: Date,
  ): Promise<PageObjectResponse[]> {
    const lowerBound = new Date(target)
    lowerBound.setDate(lowerBound.getDate() - LOOKBACK_DAYS)

    const response = await this.client.dataSources.query({
      data_source_id: this.dataSourceId,
      page_size: 25,
      filter: {
        and: [
          {
            property: this.datePropertyName,
            date: { on_or_before: toIsoDate(target) },
          },
          {
            property: this.datePropertyName,
            date: { on_or_after: toIsoDate(lowerBound) },
          },
        ],
      },
    })

    return response.results.filter(
      (result): result is PageObjectResponse => result.object === "page",
    )
  }

  private findContainingPage(
    pages: PageObjectResponse[],
    target: Date,
  ): PageObjectResponse | undefined {
    return pages.find((page) => {
      const range = extractDateRange(page, this.datePropertyName)
      return !!range && target >= range.start && target <= range.end
    })
  }
}
