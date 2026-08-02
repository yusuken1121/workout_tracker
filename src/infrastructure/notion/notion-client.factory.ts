import { Client } from "@notionhq/client"

export class NotionClientFactory {
  static create(token?: string): Client {
    const auth = token ?? process.env.NOTION_API_KEY

    if (!auth) {
      throw new Error(
        "NOTION_API_KEY is not set. Provide it via environment variable or constructor argument.",
      )
    }

    return new Client({ auth })
  }
}
