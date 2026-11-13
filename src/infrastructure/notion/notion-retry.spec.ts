import { describe, expect, it, vi } from "vitest"
import {
  APIErrorCode,
  APIResponseError,
  RequestTimeoutError,
} from "@notionhq/client"
import {
  describeNotionError,
  isRetryableNotionError,
  withNotionRetry,
} from "./notion-retry"

function apiError(code: APIErrorCode, status: number): APIResponseError {
  return new APIResponseError({
    code,
    status,
    message: code,
    headers: new Headers(),
    rawBodyText: "{}",
    additional_data: undefined,
    request_id: undefined,
  })
}

const noSleep = () => Promise.resolve()

describe("isRetryableNotionError", () => {
  it("retries reads on transient server and network failures", () => {
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.ConflictError, 409),
        "idempotent",
      ),
    ).toBe(true)
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.InternalServerError, 500),
        "idempotent",
      ),
    ).toBe(true)
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.GatewayTimeout, 504),
        "idempotent",
      ),
    ).toBe(true)
    expect(
      isRetryableNotionError(new RequestTimeoutError(), "idempotent"),
    ).toBe(true)
    expect(
      isRetryableNotionError(new TypeError("fetch failed"), "idempotent"),
    ).toBe(true)
  })

  it("retries creates only when Notion guarantees nothing was written", () => {
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.ConflictError, 409),
        "create",
      ),
    ).toBe(true)
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.ServiceUnavailable, 503),
        "create",
      ),
    ).toBe(true)
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.InternalServerError, 500),
        "create",
      ),
    ).toBe(false)
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.GatewayTimeout, 504),
        "create",
      ),
    ).toBe(false)
    expect(isRetryableNotionError(new RequestTimeoutError(), "create")).toBe(
      false,
    )
  })

  it("never retries client errors", () => {
    expect(
      isRetryableNotionError(
        apiError(APIErrorCode.ValidationError, 400),
        "idempotent",
      ),
    ).toBe(false)
    expect(isRetryableNotionError(new Error("bug"), "idempotent")).toBe(false)
  })
})

describe("withNotionRetry", () => {
  it("retries until the call succeeds", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(apiError(APIErrorCode.ConflictError, 409))
      .mockResolvedValueOnce("ok")

    await expect(
      withNotionRetry(operation, { policy: "create", sleep: noSleep }),
    ).resolves.toBe("ok")
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it("gives up after maxAttempts", async () => {
    const error = apiError(APIErrorCode.ServiceUnavailable, 503)
    const operation = vi.fn().mockRejectedValue(error)

    await expect(
      withNotionRetry(operation, {
        policy: "idempotent",
        maxAttempts: 3,
        sleep: noSleep,
      }),
    ).rejects.toBe(error)
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it("does not retry non-retryable errors", async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(apiError(APIErrorCode.ValidationError, 400))

    await expect(
      withNotionRetry(operation, { policy: "idempotent", sleep: noSleep }),
    ).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(1)
  })
})

describe("describeNotionError", () => {
  it("explains validation errors with Notion's message", () => {
    expect(
      describeNotionError(apiError(APIErrorCode.ValidationError, 400)),
    ).toContain("validation_error")
  })

  it("falls back to a connection message", () => {
    expect(describeNotionError(new TypeError("fetch failed"))).toContain("接続")
  })
})
