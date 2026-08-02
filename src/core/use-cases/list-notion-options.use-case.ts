import type { NotionOption } from "../domain/notion-option"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"

export class ListNotionOptionsUseCase {
  constructor(private readonly reader: INotionOptionsReader) {}

  async execute(): Promise<NotionOption[]> {
    return this.reader.listOptions()
  }
}
