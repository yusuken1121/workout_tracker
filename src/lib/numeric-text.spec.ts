import { describe, expect, it } from "vitest"
import { formatNumericText, parseNumericText } from "./numeric-text"

describe("parseNumericText", () => {
  it.each([
    ["62.5", 62.5],
    ["62.", 62],
    [".5", 0.5],
    ["６２．５", 62.5],
    ["62,5", 62.5],
    ["0", 0],
  ])("parses %s", (raw, expected) => {
    expect(parseNumericText(raw)).toBe(expected)
  })

  it("treats empty input as no number yet", () => {
    expect(parseNumericText("")).toBeNull()
    expect(parseNumericText(".")).toBeNull()
  })

  it("rejects text that can never be a number", () => {
    expect(parseNumericText("6a")).toBeUndefined()
    expect(parseNumericText("-5")).toBeUndefined()
    expect(parseNumericText("1.2.3")).toBeUndefined()
  })
})

describe("formatNumericText", () => {
  it("shows 0 as empty so the placeholder appears", () => {
    expect(formatNumericText(0)).toBe("")
    expect(formatNumericText(62.5)).toBe("62.5")
  })
})
