import type { Client, PageObjectResponse } from "@notionhq/client"
import { withNotionRetry } from "./notion-retry"

const MAX_PAGE_SIZE = 100

type DataSourceQueryParams = Parameters<Client["dataSources"]["query"]>[0]

export type DataSourceQueryOptions = Pick<
  DataSourceQueryParams,
  "filter" | "sorts"
>

/**
 * Queries pages in a data source, following pagination until exhausted.
 * Pass `filter`/`sorts` to narrow the query server-side; omit them to read
 * everything (acceptable for small/medium personal databases).
 */
export async function queryDataSourcePages(
  client: Client,
  dataSourceId: string,
  options: DataSourceQueryOptions = {},
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = []
  let startCursor: string | undefined

  do {
    const cursor = startCursor
    const response = await withNotionRetry(
      () =>
        client.dataSources.query({
          data_source_id: dataSourceId,
          page_size: MAX_PAGE_SIZE,
          start_cursor: cursor,
          ...options,
        }),
      { policy: "idempotent" },
    )

    for (const result of response.results) {
      if (result.object === "page") {
        pages.push(result as PageObjectResponse)
      }
    }

    startCursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined
  } while (startCursor)

  return pages
}

/** Reads every page in a data source. Equivalent to `queryDataSourcePages` without options. */
export async function queryAllDataSourcePages(
  client: Client,
  dataSourceId: string,
): Promise<PageObjectResponse[]> {
  return queryDataSourcePages(client, dataSourceId)
}
