import axios from "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    useFormUrlEncoded?: boolean
  }
}

const isUseMock = process.env.NEXT_PUBLIC_USE_MOCK
const BASE_URL =
  isUseMock === "true"
    ? process.env.NEXT_PUBLIC_MOCK_API_URL
    : (process.env.NEXT_PUBLIC_API_URL ?? "")

/** Long enough for Notion's own retries, short enough to not hang the gym UI. */
const REQUEST_TIMEOUT_MS = 45_000

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
})

/**
 * Turns an Axios failure into an Error whose message can be shown as-is:
 * the API's `{ error }` body when present, otherwise a Japanese hint for
 * network problems (common on weak gym Wi-Fi / mobile signal).
 */
export function toApiError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error))
  }

  const body: unknown = error.response?.data
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error
  ) {
    return new Error(body.error, { cause: error })
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new Error(
      "サーバーの応答がタイムアウトしました。保存されていないか確認してから再試行してください。",
      { cause: error },
    )
  }

  if (!error.response) {
    return new Error(
      "通信に失敗しました。電波状況を確認して再試行してください。",
      { cause: error },
    )
  }

  return new Error(`サーバーエラーが発生しました (${error.response.status})`, {
    cause: error,
  })
}

apiClient.interceptors.request.use((config) => {
  if (config.data != null) {
    if (config.useFormUrlEncoded) {
      config.headers["Content-Type"] = "application/x-www-form-urlencoded"
    } else {
      config.headers["Content-Type"] = "application/json"
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(toApiError(error)),
)
