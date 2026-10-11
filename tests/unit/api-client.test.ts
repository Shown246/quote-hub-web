import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "@/lib/api-client";

describe("apiClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses successful JSON responses with credentials included", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ status: "alive" }),
    });

    const res = await apiClient<{ status: string }>("/health/live");
    expect(res).toEqual({ status: "alive" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/health/live"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("decodes RFC 9457 Problem Details into ApiError instances on 400 Bad Request", async () => {
    const problemPayload = {
      type: "about:blank",
      title: "Validation failed",
      status: 400,
      detail: "Quote text must not exceed 280 characters",
      code: "VALIDATION_ERROR",
      instance: "req-12345",
      errors: { text: ["Quote text must not exceed 280 characters"] },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/problem+json" }),
      json: async () => problemPayload,
    });

    await expect(apiClient("/api/v1/quotes")).rejects.toThrow(ApiError);
    await expect(apiClient("/api/v1/quotes")).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      detail: "Quote text must not exceed 280 characters",
      errors: { text: ["Quote text must not exceed 280 characters"] },
    });
  });

  it("extracts Retry-After header on 429 RATE_LIMIT_EXCEEDED", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({
        "content-type": "application/problem+json",
        "retry-after": "12",
      }),
      json: async () => ({
        title: "Too Many Requests",
        status: 429,
        detail: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
      }),
    });

    try {
      await apiClient("/api/v1/quotes");
      expect.fail("Expected ApiError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).retryAfter).toBe(12);
    }
  });

  it("injects Idempotency-Key header when idempotencyKey option is provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ id: "quote-1" }),
    });

    await apiClient("/api/v1/quotes", {
      method: "POST",
      body: JSON.stringify({ text: "Hello" }),
      idempotencyKey: "test-idem-key-123",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/quotes"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Idempotency-Key": "test-idem-key-123",
        }),
      })
    );
  });

  it("handles 204 No Content responses gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      text: async () => "",
    });

    const res = await apiClient<void>("/api/v1/quotes/1/like", {
      method: "DELETE",
    });

    expect(res).toBeUndefined();
  });

  it("captures x-request-id from response headers when JSON problem payload omits instance", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({
        "content-type": "application/problem+json",
        "x-request-id": "req-trace-abc-123",
      }),
      text: async () =>
        JSON.stringify({
          title: "Internal Server Error",
          status: 500,
          detail: "Something broke",
          code: "SERVER_ERROR",
        }),
    });

    try {
      await apiClient("/api/v1/error");
      expect.fail("Expected ApiError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.instance).toBe("req-trace-abc-123");
    }
  });

  it("captures X-Request-Id fallback header with capitalized name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: new Headers({
        "content-type": "application/problem+json",
        "X-Request-Id": "req-trace-capital-456",
      }),
      text: async () =>
        JSON.stringify({
          title: "Bad Gateway",
          status: 502,
          detail: "Upstream failure",
          code: "BAD_GATEWAY",
        }),
    });

    try {
      await apiClient("/api/v1/error");
      expect.fail("Expected ApiError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.instance).toBe("req-trace-capital-456");
    }
  });

  it("prioritizes problem payload instance over x-request-id header when both exist", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({
        "content-type": "application/problem+json",
        "x-request-id": "header-trace-id",
      }),
      text: async () =>
        JSON.stringify({
          title: "Bad Request",
          status: 400,
          detail: "Invalid input",
          code: "BAD_REQUEST",
          instance: "payload-instance-id",
        }),
    });

    try {
      await apiClient("/api/v1/quotes");
      expect.fail("Expected ApiError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).instance).toBe("payload-instance-id");
    }
  });

  it("never reads body stream twice when parsing responses", async () => {
    let readCount = 0;
    const mockResponse = {
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: vi.fn().mockImplementation(async () => {
        readCount++;
        return JSON.stringify({ data: "ok" });
      }),
      json: vi.fn().mockImplementation(async () => {
        readCount++;
        return { data: "ok" };
      }),
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const res = await apiClient<{ data: string }>("/api/v1/test");
    expect(res).toEqual({ data: "ok" });
    expect(readCount).toBe(1);
    expect(mockResponse.text).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
