import type { Client, PageObjectResponse } from "@notionhq/client"

const MAX_PAGE_SIZE = 100

/**
 * Queries every page in a data source, following pagination until exhausted.
 * Acceptable for small/medium personal databases; revisit with server-side
 * filters if a data source grows very large.
 */
export async function queryAllDataSourcePages(
  client: Client,
  dataSourceId: string,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = []
  let startCursor: string | undefined

  do {
    const response = await client.dataSources.query({
      data_source_id: dataSourceId,
      page_size: MAX_PAGE_SIZE,
      start_cursor: startCursor,
    })

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
