import { describe, expect, it, vi } from "vitest"
import { ListNotionOptionsUseCase } from "./list-notion-options.use-case"
import type { INotionOptionsReader } from "../ports/notion-options-reader.port"

describe("ListNotionOptionsUseCase", () => {
  it("delegates to the reader port", async () => {
    const options = [{ id: "1", label: "Squat" }]
    const mockReader: INotionOptionsReader = {
      listOptions: vi.fn().mockResolvedValue(options),
    }

    const useCase = new ListNotionOptionsUseCase(mockReader)
    const result = await useCase.execute()

    expect(mockReader.listOptions).toHaveBeenCalled()
    expect(result).toEqual(options)
  })
})
