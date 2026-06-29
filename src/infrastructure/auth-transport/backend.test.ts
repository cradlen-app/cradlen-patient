import { afterEach, describe, expect, it, vi } from "vitest";
import {
  API_BASE_URL,
  backendUrl,
  extractTokens,
  readBackendJson,
  sanitizeBackendError,
} from "./backend";
import { DEFAULT_AUTH_EXPIRES_IN } from "./constants";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("extractTokens", () => {
  it("returns null for non-object input", () => {
    expect(extractTokens(null)).toBeNull();
    expect(extractTokens("string")).toBeNull();
    expect(extractTokens(42)).toBeNull();
  });

  it("returns null when access_token or refresh_token is missing", () => {
    expect(extractTokens({ access_token: "a" })).toBeNull();
    expect(extractTokens({ refresh_token: "r" })).toBeNull();
  });

  it("reads tokens from a flat body", () => {
    expect(
      extractTokens({ access_token: "a", refresh_token: "r" }),
    ).toEqual({
      access_token: "a",
      refresh_token: "r",
      token_type: "Bearer",
      expires_in: DEFAULT_AUTH_EXPIRES_IN,
    });
  });

  it("reads tokens from a { data } wrapper", () => {
    expect(
      extractTokens({ data: { access_token: "a", refresh_token: "r" } }),
    ).toMatchObject({ access_token: "a", refresh_token: "r" });
  });

  it("preserves provided token_type and expires_in", () => {
    expect(
      extractTokens({
        access_token: "a",
        refresh_token: "r",
        token_type: "MAC",
        expires_in: 123,
      }),
    ).toMatchObject({ token_type: "MAC", expires_in: 123 });
  });
});

describe("backendUrl", () => {
  it("joins a leading-slash path to the base URL", () => {
    expect(backendUrl("/patient-auth/login")).toBe(
      `${API_BASE_URL}/patient-auth/login`,
    );
  });

  it("inserts a slash when the path lacks one", () => {
    expect(backendUrl("auth/refresh")).toBe(`${API_BASE_URL}/auth/refresh`);
  });

  it("honors an overridden API_BASE_URL (module-load const)", async () => {
    vi.resetModules();
    vi.stubEnv("API_BASE_URL", "http://backend.test/v2");
    const mod = await import("./backend");
    expect(mod.backendUrl("/x")).toBe("http://backend.test/v2/x");
  });
});

describe("backendUrl — path safety", () => {
  it("passes a normal nested path through unchanged", () => {
    expect(backendUrl("/patient-portal/investigations/abc/result")).toBe(
      `${API_BASE_URL}/patient-portal/investigations/abc/result`,
    );
  });

  it("leaves the query string untouched", () => {
    expect(backendUrl("/patient-portal/visits?page=1&limit=10")).toBe(
      `${API_BASE_URL}/patient-portal/visits?page=1&limit=10`,
    );
  });

  it("rejects a `..` path segment (traversal)", () => {
    expect(() => backendUrl("/patient-portal/notifications/../read")).toThrow(
      /unsafe/i,
    );
  });

  it("rejects a protocol-relative target", () => {
    expect(() => backendUrl("//evil.com/steal")).toThrow(/unsafe/i);
  });

  it("rejects a smuggled absolute URL", () => {
    expect(() => backendUrl("/https://evil.com/steal")).toThrow(/unsafe/i);
  });

  it("does not false-positive on `..` inside the query string", () => {
    expect(() => backendUrl("/patient-portal/visits?q=..")).not.toThrow();
  });
});

describe("API base URL validation (production)", () => {
  async function loadWith(env: Record<string, string>) {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }
    return import("./backend");
  }

  it("accepts the canonical https cradlen host", async () => {
    const mod = await loadWith({ API_BASE_URL: "https://api.cradlen.com/v1" });
    expect(mod.API_BASE_URL).toBe("https://api.cradlen.com/v1");
  });

  it("accepts any *.cradlen.com subdomain over https", async () => {
    const mod = await loadWith({ API_BASE_URL: "https://staging-api.cradlen.com/v1" });
    expect(mod.API_BASE_URL).toBe("https://staging-api.cradlen.com/v1");
  });

  it("rejects an http base in production (token exfil risk)", async () => {
    await expect(
      loadWith({ API_BASE_URL: "http://api.cradlen.com/v1" }),
    ).rejects.toThrow(/https/i);
  });

  it("rejects a non-cradlen host in production", async () => {
    await expect(
      loadWith({ API_BASE_URL: "https://evil.com/v1" }),
    ).rejects.toThrow(/untrusted/i);
  });
});

describe("sanitizeBackendError", () => {
  it("collapses any 5xx body to a generic message", () => {
    expect(
      sanitizeBackendError(
        { message: "DB host db-01 timeout", stack: "at line 42" },
        500,
      ),
    ).toEqual({ message: "Something went wrong. Please try again." });
  });

  it("preserves a safe 4xx message", () => {
    expect(sanitizeBackendError({ message: "Invalid credentials" }, 401)).toEqual({
      message: "Invalid credentials",
    });
  });

  it("keeps validation errors as {field,message} only, dropping extras", () => {
    expect(
      sanitizeBackendError(
        {
          message: "Validation failed",
          errors: [{ field: "email", message: "bad", internalCode: 7 }],
          trace: "secret",
        },
        422,
      ),
    ).toEqual({
      message: "Validation failed",
      errors: [{ field: "email", message: "bad" }],
    });
  });

  it("falls back to detail, then a generic message, for 4xx", () => {
    expect(sanitizeBackendError({ detail: "Nope" }, 400)).toEqual({
      message: "Nope",
    });
    expect(sanitizeBackendError("raw internal text", 400)).toEqual({
      message: "Request failed.",
    });
    expect(sanitizeBackendError({ internalOnly: true }, 400)).toEqual({
      message: "Request failed.",
    });
  });
});

describe("readBackendJson", () => {
  it("returns null for an empty body", async () => {
    await expect(readBackendJson(new Response(""))).resolves.toBeNull();
  });

  it("parses valid JSON", async () => {
    await expect(
      readBackendJson(new Response(JSON.stringify({ a: 1 }))),
    ).resolves.toEqual({ a: 1 });
  });

  it("returns the raw text when JSON parsing fails", async () => {
    await expect(readBackendJson(new Response("not json"))).resolves.toBe(
      "not json",
    );
  });
});
