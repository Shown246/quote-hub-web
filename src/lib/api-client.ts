import type { ProblemDetailsResponse } from "@/types/api";

export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
  retryAfter?: number;

  constructor(
    paramsOrMessage:
      | string
      | {
          status: number;
          code: string;
          detail: string;
          instance?: string;
          errors?: Record<string, string[]>;
          retryAfter?: number;
        },
    status?: number,
    code?: string,
    detail?: string,
    instance?: string
  ) {
    if (typeof paramsOrMessage === "string") {
      super(detail || paramsOrMessage);
      this.name = "ApiError";
      this.status = status ?? 500;
      this.code = code ?? "UNKNOWN_ERROR";
      this.detail = detail ?? paramsOrMessage;
      this.instance = instance;
    } else {
      super(paramsOrMessage.detail || paramsOrMessage.code || `API Error (${paramsOrMessage.status})`);
      this.name = "ApiError";
      this.status = paramsOrMessage.status;
      this.code = paramsOrMessage.code;
      this.detail = paramsOrMessage.detail;
      this.instance = paramsOrMessage.instance;
      this.errors = paramsOrMessage.errors;
      this.retryAfter = paramsOrMessage.retryAfter;
    }
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiClientOptions extends RequestInit {
  idempotencyKey?: string;
}

export async function apiClient<T>(
  path: string,
  options?: ApiClientOptions
): Promise<T> {
  const {
    idempotencyKey,
    headers: customHeaders,
    credentials,
    ...restOptions
  } = options || {};

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = {};

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      for (const [key, value] of customHeaders) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  if (
    !headers["Content-Type"] &&
    !headers["content-type"] &&
    restOptions.body &&
    typeof restOptions.body === "string"
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    credentials: credentials ?? "include",
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    let retryAfter: number | undefined;
    const retryAfterHeader = response.headers?.get?.("retry-after");
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!Number.isNaN(parsed)) {
        retryAfter = parsed;
      }
    }

    const requestId =
      response.headers?.get?.("x-request-id") ||
      response.headers?.get?.("X-Request-Id") ||
      undefined;

    let problemData: Partial<ProblemDetailsResponse> = {};
    try {
      const parsed = await parseResponseBody<Partial<ProblemDetailsResponse>>(response);
      if (parsed && typeof parsed === "object") {
        problemData = parsed;
      }
    } catch {
      // Ignore JSON parsing errors for problem details
    }

    throw new ApiError({
      status: response.status,
      code: problemData.code || "UNKNOWN_ERROR",
      detail:
        problemData.detail ||
        problemData.title ||
        response.statusText ||
        "Request failed",
      instance: problemData.instance || requestId,
      errors: problemData.errors,
      retryAfter,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseResponseBody<T>(response)) as T;
}

async function parseResponseBody<T>(response: Response): Promise<T | undefined> {
  if (typeof response.text === "function") {
    const text = await response.text();
    if (!text || !text.trim()) {
      return undefined;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  if (typeof response.json === "function") {
    try {
      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
