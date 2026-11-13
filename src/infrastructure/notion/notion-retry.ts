import {
  APIErrorCode,
  isHTTPResponseError,
  RequestTimeoutError,
  type NotionErrorCode,
} from "@notionhq/client"

/**
 * - `idempotent`: reads (data source queries) and updates that are safe to
 *   repeat. Retried on any transient failure.
 * - `create`: page creation. Retried only when Notion says the write did
 *   NOT happen, so a retry can never produce a duplicate set.
 */
export type NotionRetryPolicy = "idempotent" | "create"

const WRITE_NOT_APPLIED_CODES: ReadonlySet<NotionErrorCode> = new Set([
  APIErrorCode.ConflictError,
  APIErrorCode.RateLimited,
  APIErrorCode.ServiceUnavailable,
])

const TRANSIENT_CODES: ReadonlySet<NotionErrorCode> = new Set([
  ...WRITE_NOT_APPLIED_CODES,
  APIErrorCode.InternalServerError,
  APIErrorCode.GatewayTimeout,
])

/** Network-level failure before any HTTP response (e.g. undici "fetch failed"). */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

export function isRetryableNotionError(
  error: unknown,
  policy: NotionRetryPolicy,
): boolean {
  if (isHTTPResponseError(error)) {
    if (policy === "create") return WRITE_NOT_APPLIED_CODES.has(error.code)
    return TRANSIENT_CODES.has(error.code) || error.status >= 500
  }
  if (policy === "create") return false
  return (
    RequestTimeoutError.isRequestTimeoutError(error) || isNetworkError(error)
  )
}

export type NotionRetryOptions = {
  policy: NotionRetryPolicy
  /** Total attempts including the first one. */
  maxAttempts?: number
  baseDelayMs?: number
  sleep?: (ms: number) => Promise<void>
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 400

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Runs a Notion API call, retrying transient failures (409 conflict,
 * 5xx, timeouts) with exponential back-off + jitter. The Notion SDK only
 * retries 429s for POST requests, and data source queries are POSTs.
 */
export async function withNotionRetry<T>(
  operation: () => Promise<T>,
  {
    policy,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    sleep = defaultSleep,
  }: NotionRetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableNotionError(error, policy)) {
        throw error
      }
      const backoff = baseDelayMs * 2 ** (attempt - 1)
      await sleep(backoff + Math.random() * baseDelayMs)
    }
  }
}

/** Japanese, user-facing explanation of a Notion failure. */
export function describeNotionError(error: unknown): string {
  if (isHTTPResponseError(error)) {
    switch (error.code) {
      case APIErrorCode.RateLimited:
        return "Notion へのアクセスが集中しています。少し待ってから再試行してください。"
      case APIErrorCode.ValidationError:
      case APIErrorCode.InvalidRequest:
        return `Notion が入力を受け付けませんでした（${error.message}）。`
      case APIErrorCode.Unauthorized:
      case APIErrorCode.RestrictedResource:
      case APIErrorCode.ObjectNotFound:
        return `Notion の接続設定を確認してください（${error.code}）。`
      default:
        return "Notion が一時的に応答しませんでした。もう一度お試しください。"
    }
  }
  if (RequestTimeoutError.isRequestTimeoutError(error)) {
    return "Notion の応答がタイムアウトしました。カレンダーで保存されていないか確認してから再試行してください。"
  }
  return "Notion に接続できませんでした。もう一度お試しください。"
}
