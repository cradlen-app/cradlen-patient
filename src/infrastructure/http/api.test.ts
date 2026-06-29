import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

/** Build a fetch stub returning a single canned Response. */
function stubFetch(response: Response) {
  // Type the mock via vi.fn's generic so `fn.mock.calls[i]` is a typed 2-tuple
  // (input, init) without declaring unused params.
  const fn = vi.fn<(input?: unknown, init?: RequestInit) => Promise<Response>>(
    async () => response,
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiFetch — URL resolution", () => {
  it("rewrites token-issuing session endpoints to local route handlers", async () => {
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("/patient-auth/login", { method: "POST" });
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/patient-auth/login",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("preserves the query string when rewriting a session endpoint", async () => {
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("/patient-auth/signup/start?invite=abc");
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/patient-auth/signup/start?invite=abc",
      expect.anything(),
    );
  });

  it("passes absolute http(s) URLs through untouched", async () => {
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("https://example.com/thing");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://example.com/thing",
      expect.anything(),
    );
  });

  it("passes /api/* paths through and sends credentials", async () => {
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("/api/patient-portal/medications");
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/patient-portal/medications",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("prefixes other relative paths with the public API base URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/v1");
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("/patient-portal/visits");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.test/v1/patient-portal/visits",
      expect.anything(),
    );
  });

  it("sets a JSON Content-Type by default and merges caller headers", async () => {
    const fetchFn = stubFetch(jsonResponse({ ok: true }));
    await apiFetch("/api/x", { headers: { "X-Custom": "1" } });
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "X-Custom": "1",
    });
  });
});

describe("apiFetch — response body parsing", () => {
  it("returns undefined for a 204 No Content", async () => {
    stubFetch(new Response(null, { status: 204 }));
    await expect(apiFetch("/api/x")).resolves.toBeUndefined();
  });

  it("returns undefined for an empty body", async () => {
    stubFetch(new Response("", { status: 200 }));
    await expect(apiFetch("/api/x")).resolves.toBeUndefined();
  });

  it("returns parsed JSON on success", async () => {
    stubFetch(jsonResponse({ id: 7 }));
    await expect(apiFetch<{ id: number }>("/api/x")).resolves.toEqual({ id: 7 });
  });

  it("returns the raw text when the body is not JSON", async () => {
    stubFetch(new Response("plain text", { status: 200 }));
    await expect(apiFetch("/api/x")).resolves.toBe("plain text");
  });
});

describe("apiFetch — error handling", () => {
  it("throws an ApiError carrying the status and parsed body", async () => {
    stubFetch(jsonResponse({ message: "Boom" }, { status: 400 }));
    await expect(apiFetch("/api/x")).rejects.toMatchObject({
      status: 400,
      message: "Boom",
    });
  });

  it("prefers top-level `message`", async () => {
    stubFetch(jsonResponse({ message: "top" }, { status: 422 }));
    await expect(apiFetch("/api/x")).rejects.toHaveProperty("message", "top");
  });

  it("falls back to nested error.message", async () => {
    stubFetch(jsonResponse({ error: { message: "nested" } }, { status: 422 }));
    await expect(apiFetch("/api/x")).rejects.toHaveProperty("message", "nested");
  });

  it("falls back to the first validation error message", async () => {
    stubFetch(
      jsonResponse({ errors: [{ message: "field bad" }] }, { status: 422 }),
    );
    await expect(apiFetch("/api/x")).rejects.toHaveProperty("message", "field bad");
  });

  it("falls back to `detail`", async () => {
    stubFetch(jsonResponse({ detail: "detail msg" }, { status: 422 }));
    await expect(apiFetch("/api/x")).rejects.toHaveProperty("message", "detail msg");
  });

  it("falls back to statusText when the body has no usable message", async () => {
    stubFetch(new Response("{}", { status: 503, statusText: "Service Unavailable" }));
    await expect(apiFetch("/api/x")).rejects.toHaveProperty(
      "message",
      "Service Unavailable",
    );
  });
});

describe("apiFetch — transient 503 retry", () => {
  it("retries an idempotent GET once on 503, then returns the success body", async () => {
    const fn = vi
      .fn<(input?: unknown, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fn);

    await expect(apiFetch("/api/patient-portal/medications")).resolves.toEqual({
      ok: true,
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry a non-idempotent POST on 503 (no double-apply)", async () => {
    const fn = vi
      .fn<(input?: unknown, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(
        jsonResponse({ message: "busy" }, { status: 503 }),
      );
    vi.stubGlobal("fetch", fn);

    await expect(
      apiFetch("/api/patient-portal/x", { method: "POST" }),
    ).rejects.toMatchObject({ status: 503 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("ApiError", () => {
  it("joins array messages into a single message and keeps the list", () => {
    const err = new ApiError(400, ["a", "b"], { raw: true });
    expect(err.status).toBe(400);
    expect(err.messages).toEqual(["a", "b"]);
    expect(err.message).toBe("a\nb");
    expect(err.body).toEqual({ raw: true });
  });
});
