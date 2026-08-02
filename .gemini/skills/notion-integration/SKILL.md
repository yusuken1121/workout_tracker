---
name: notion-integration
description: >-
  Configure, map, extend, and unit-test Notion database writes via the
  configurable Notion gateway. Use when adding Notion as a data store or
  connecting a form to a Notion database.
---

# Notion Integration

The Notion module is an **Infrastructure adapter** implementing a Core Port.

| Role          | Location                                                                                          |
| :------------ | :------------------------------------------------------------------------------------------------ |
| Entity        | `ContactSubmission` — `src/core/domain/contact-submission.entity.ts`                              |
| Port          | `INotionRecordWriter<TRecord>` — `src/core/ports/notion-record-writer.port.ts`                    |
| Use Case      | `CreateNotionRecordUseCase` — `src/core/use-cases/create-notion-record.use-case.ts`               |
| Adapter       | `ConfigurableNotionGateway<TRecord>` — `src/infrastructure/notion/configurable-notion.gateway.ts` |
| Factory       | `createNotionRecordWriter(config)` — `src/infrastructure/notion/index.ts`                         |
| Route Handler | `src/app/api/notion/route.ts`                                                                     |
| UI            | `ContactForm` — `src/app/_components/contact-form.tsx`                                            |
| Hook          | `useCreateNotionRecord` — `src/lib/api/queries/useNotion.ts`                                      |

A second, more advanced example — the Workout Log form (`src/app/_components/workout-log-form.tsx`) —
demonstrates **relation** properties (a select populated from another Notion
data source) and a **derived relation** resolved server-side before writing
(auto-linking a workout entry to its Weekly Progress week). See
`src/infrastructure/notion/workout-log.config.ts`,
`src/infrastructure/notion/notion-options.reader.ts`, and
`src/infrastructure/notion/week.resolver.ts`.

## End-to-end flow

```
ContactForm
  → useCreateNotionRecord()
  → POST /api/notion
  → contactSubmissionSchema (Zod — format)
  → CreateNotionRecordUseCase + assertValidContactSubmission (domain — business rules)
  → ConfigurableNotionGateway
  → Notion API
```

## Validation split

| Layer  | Schema / function              | Checks                                      |
| :----- | :----------------------------- | :------------------------------------------ |
| Client | `contactFormSchema`            | Required fields, email format, min 10 chars |
| Route  | `contactSubmissionSchema`      | Required fields, email format               |
| Domain | `assertValidContactSubmission` | Message min 10 characters (business rule)   |

Domain errors return **400** via `handleRouteError` in `src/lib/route-error.ts`.

## Setting Up a New Database

### 1. Define the record type in domain

```typescript
// src/core/domain/contact-submission.entity.ts
export interface ContactSubmission {
  name: string
  email: string
  message: string
}
```

### 2. Define field mapping in infrastructure

```typescript
// src/infrastructure/notion/contact.config.ts
import type { NotionDatabaseConfig } from "./notion-field-mapping.types"
import type { ContactSubmission } from "@/core/domain/contact-submission.entity"

export const contactNotionConfig: NotionDatabaseConfig<ContactSubmission> = {
  databaseId: process.env.NOTION_CONTACT_DATABASE_ID ?? "",
  fields: [
    { recordKey: "name", propertyName: "Name", type: "title" },
    { recordKey: "email", propertyName: "Email", type: "rich_text" },
    { recordKey: "message", propertyName: "Message", type: "rich_text" },
  ],
}
```

Property names must match your Notion database column names exactly.

### 3. Supported field types

`NotionPropertyBuilder` supports: `title`, `rich_text`, `number`, `date`, `select`, `checkbox`, `url`, `files` (HTTPS only), `relation` (page ID or array of page IDs — see `NotionOption`/`INotionOptionsReader` for populating a relation `Select` from another data source).

Mark a field `optional: true` to omit the Notion property entirely (instead of throwing) when its resolved value is `undefined`/`null` — useful for a relation that's only sometimes resolvable (e.g. `weekPageId` in `workout-log.config.ts`).

### 4. Reading options for dropdowns / relation lookups

For read-only queries against a Notion **data source** (e.g. populating a `<Select>` with existing rows, or resolving a relation by matching a value):

- Port: `INotionOptionsReader` / `IWeekResolver` — `src/core/ports/`
- Adapter: `NotionOptionsReader` / `NotionWeekResolver` — `src/infrastructure/notion/`
- Factory: `createNotionOptionsReader(dataSourceId, titleProperty)` / `createWeekResolver(dataSourceId, dateProperty)` — `src/infrastructure/notion/index.ts`
- Pagination helper: `queryAllDataSourcePages()` — `src/infrastructure/notion/notion-data-source.util.ts`. Prefer narrowing with a `filter` (see `week.resolver.ts` for a date-range example) before falling back to a full scan — Notion date filters on range properties compare against the range's **start** date only.
- Data sources require `NOTION_*_DATA_SOURCE_ID` (not the outer `database_id`) — get this from the `<data-source url="collection://...">` tag when inspecting the database.

### 5. Wire Route Handler + React Query + UI

Existing implementation:

- Route: `src/app/api/notion/route.ts`
- API wrapper: `src/lib/api/notion.ts`
- Hook: `useCreateNotionRecord` in `src/lib/api/queries/useNotion.ts`
- Form: `src/app/_components/contact-form.tsx`
- Page: `src/app/contact/page.tsx`

## Environment Variables

| Variable                         | Required | Description                            |
| :------------------------------- | :------- | :------------------------------------- |
| `NOTION_API_KEY`                 | Yes      | Integration token                      |
| `NOTION_CONTACT_DATABASE_ID`     | Yes      | Contact form database ID               |
| `NOTION_WORKOUT_LOG_DATABASE_ID` | Yes      | Workout Log database ID                |
| `NOTION_EXERCISE_DATA_SOURCE_ID` | Yes      | Exercises data source ID (reads)       |
| `NOTION_WEEK_DATA_SOURCE_ID`     | Yes      | Weekly Progress data source ID (reads) |

`createNotionRecordWriter()` throws if `databaseId` is empty.

See [project-setup](../project-setup/SKILL.md).

## Unit Testing

Run with `pnpm test`. See:

- `notion-property.builder.spec.ts`
- `configurable-notion.gateway.spec.ts`
- `create-notion-record.use-case.spec.ts`
- `notion-options.reader.spec.ts`
- `week.resolver.spec.ts`
- `notion-data-source.util.spec.ts`

## Related Skills

- [react-query-api-pattern](../react-query-api-pattern/SKILL.md)
- [clean-architecture-extension](../clean-architecture-extension/SKILL.md)
