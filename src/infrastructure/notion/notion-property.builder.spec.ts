import { describe, it, expect } from "vitest"
import { NotionPropertyBuilder } from "./notion-property.builder"
import type { NotionFieldMapping } from "./notion-field-mapping.types"

describe("NotionPropertyBuilder", () => {
  interface TestRecord extends Record<string, unknown> {
    id: string
    title: string
    description: string
    count: number
    isActive: boolean
    publishDate: string
    category: string
    website: string
    images: string[]
    singleImage: string
  }

  const sampleRecord: TestRecord = {
    id: "123",
    title: "Test Project",
    description: "This is a clean description.",
    count: 42,
    isActive: true,
    publishDate: "2026-05-27",
    category: "Software",
    website: "https://google.com",
    images: ["https://example.com/img1.png", "https://example.com/img2.png"],
    singleImage: "https://example.com/img3.png",
  }

  it("should format standard primitive properties correctly", () => {
    const fields: Array<NotionFieldMapping<TestRecord>> = [
      { recordKey: "title", propertyName: "Name", type: "title" },
      { recordKey: "description", propertyName: "Summary", type: "rich_text" },
      { recordKey: "count", propertyName: "Quantity", type: "number" },
      { recordKey: "isActive", propertyName: "ActiveState", type: "checkbox" },
      { recordKey: "publishDate", propertyName: "Published At", type: "date" },
      { recordKey: "category", propertyName: "Tag", type: "select" },
      { recordKey: "website", propertyName: "Link", type: "url" },
    ]

    const result = NotionPropertyBuilder.build(sampleRecord, fields)

    expect(result).toEqual({
      Name: { title: [{ text: { content: "Test Project" } }] },
      Summary: {
        rich_text: [{ text: { content: "This is a clean description." } }],
      },
      Quantity: { number: 42 },
      ActiveState: { checkbox: true },
      "Published At": { date: { start: "2026-05-27" } },
      Tag: { select: { name: "Software" } },
      Link: { url: "https://google.com" },
    })
  })

  it("should apply custom transform functions when provided", () => {
    const fields: Array<NotionFieldMapping<TestRecord>> = [
      {
        recordKey: "title",
        propertyName: "Name",
        type: "title",
        transform: (value) => `[PROJ] ${value}`,
      },
      {
        propertyName: "CalculatedScore",
        type: "number",
        transform: (_, record) => record.count * 2,
      },
    ]

    const result = NotionPropertyBuilder.build(sampleRecord, fields)

    expect(result).toEqual({
      Name: { title: [{ text: { content: "[PROJ] Test Project" } }] },
      CalculatedScore: { number: 84 },
    })
  })

  describe("files property type", () => {
    it("should format an array of HTTPS URLs correctly", () => {
      const fields: Array<NotionFieldMapping<TestRecord>> = [
        { recordKey: "images", propertyName: "Gallery", type: "files" },
      ]

      const result = NotionPropertyBuilder.build(sampleRecord, fields)

      expect(result).toEqual({
        Gallery: {
          files: [
            {
              type: "external",
              name: "attachment",
              external: { url: "https://example.com/img1.png" },
            },
            {
              type: "external",
              name: "attachment-2",
              external: { url: "https://example.com/img2.png" },
            },
          ],
        },
      })
    })

    it("should format a single HTTPS URL as a single-item files property", () => {
      const fields: Array<NotionFieldMapping<TestRecord>> = [
        { recordKey: "singleImage", propertyName: "Hero Image", type: "files" },
      ]

      const result = NotionPropertyBuilder.build(sampleRecord, fields)

      expect(result).toEqual({
        "Hero Image": {
          files: [
            {
              type: "external",
              name: "attachment",
              external: { url: "https://example.com/img3.png" },
            },
          ],
        },
      })
    })

    it("should throw an error if files contain HTTP instead of HTTPS URLs", () => {
      const invalidRecord = {
        ...sampleRecord,
        singleImage: "http://example.com/img.png",
      }

      const fields: Array<NotionFieldMapping<TestRecord>> = [
        { recordKey: "singleImage", propertyName: "Hero Image", type: "files" },
      ]

      expect(() => NotionPropertyBuilder.build(invalidRecord, fields)).toThrow(
        'Notion files property "Hero Image" requires HTTPS URLs. Got: http://example.com/img.png',
      )
    })
  })

  describe("relation property type", () => {
    interface RelationRecord extends Record<string, unknown> {
      exercisePageId: string
      weekPageId?: string
      tagPageIds: string[]
    }

    it("formats a single page ID as a one-item relation array", () => {
      const record: RelationRecord = {
        exercisePageId: "exercise-page-1",
        tagPageIds: [],
      }
      const fields: Array<NotionFieldMapping<RelationRecord>> = [
        { recordKey: "exercisePageId", propertyName: "種目", type: "relation" },
      ]

      const result = NotionPropertyBuilder.build(record, fields)

      expect(result).toEqual({
        種目: { relation: [{ id: "exercise-page-1" }] },
      })
    })

    it("formats an array of page IDs as a multi-item relation array", () => {
      const record: RelationRecord = {
        exercisePageId: "exercise-page-1",
        tagPageIds: ["tag-1", "tag-2"],
      }
      const fields: Array<NotionFieldMapping<RelationRecord>> = [
        { recordKey: "tagPageIds", propertyName: "Tags", type: "relation" },
      ]

      const result = NotionPropertyBuilder.build(record, fields)

      expect(result).toEqual({
        Tags: { relation: [{ id: "tag-1" }, { id: "tag-2" }] },
      })
    })
  })

  describe("optional fields", () => {
    interface OptionalRecord extends Record<string, unknown> {
      weekPageId?: string
    }

    it("omits the property entirely when value is undefined and marked optional", () => {
      const record: OptionalRecord = {}
      const fields: Array<NotionFieldMapping<OptionalRecord>> = [
        {
          recordKey: "weekPageId",
          propertyName: "週",
          type: "relation",
          optional: true,
        },
      ]

      const result = NotionPropertyBuilder.build(record, fields)

      expect(result).toEqual({})
    })

    it("still builds the property when an optional field has a value", () => {
      const record: OptionalRecord = { weekPageId: "week-1" }
      const fields: Array<NotionFieldMapping<OptionalRecord>> = [
        {
          recordKey: "weekPageId",
          propertyName: "週",
          type: "relation",
          optional: true,
        },
      ]

      const result = NotionPropertyBuilder.build(record, fields)

      expect(result).toEqual({ 週: { relation: [{ id: "week-1" }] } })
    })
  })

  describe("error handling and edge cases", () => {
    it("should throw an error if a mapped record key is missing, undefined, or null", () => {
      const incompleteRecord = {
        title: "Incomplete",
      } as unknown as TestRecord

      const fields: Array<NotionFieldMapping<TestRecord>> = [
        { recordKey: "count", propertyName: "Quantity", type: "number" },
      ]

      expect(() =>
        NotionPropertyBuilder.build(incompleteRecord, fields),
      ).toThrow('Missing value for Notion property "Quantity" (type: number)')
    })

    it("should throw an error for unsupported field types", () => {
      const fields = [
        {
          recordKey: "title",
          propertyName: "Name",
          type: "unsupported-type" as unknown as never,
        },
      ]

      expect(() => NotionPropertyBuilder.build(sampleRecord, fields)).toThrow(
        "Unsupported Notion field type: unsupported-type",
      )
    })
  })
})
