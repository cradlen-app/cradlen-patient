import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import {
  journeyResponseSchema,
  medicationsResponseSchema,
  parseApi,
  visitsResponseSchema,
} from "./api-schemas";

const validVisits = {
  data: [
    {
      id: "v1",
      visit_date: "2026-01-01T00:00:00Z",
      completed_at: "2026-01-01T01:00:00Z",
      appointment_type: "VISIT",
      priority: "NORMAL",
      status: "COMPLETED",
      specialty_code: null,
      doctor_name: "Dr. A",
      organization_name: null,
      branch_name: "Maadi",
      diagnoses: [],
      medications: [],
      investigations: [],
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("parseApi", () => {
  it("returns the validated data for a well-formed response", () => {
    const out = parseApi(visitsResponseSchema, validVisits, "visits");
    expect(out).toMatchObject({ meta: { total: 1 } });
  });

  it("tolerates unknown extra keys (forward-compatible)", () => {
    const withExtra = {
      ...validVisits,
      data: [{ ...validVisits.data[0], brand_new_field: 42 }],
      extra_top_level: true,
    };
    expect(() => parseApi(visitsResponseSchema, withExtra, "visits")).not.toThrow();
  });

  it("throws a 502 ApiError (not a TypeError) when data drifts to null", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        parseApi(visitsResponseSchema, { data: null, meta: {} }, "visits"),
      ).toThrow(ApiError);
      try {
        parseApi(visitsResponseSchema, { data: null, meta: {} }, "visits");
      } catch (e) {
        expect((e as ApiError).status).toBe(502);
      }
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects a medications envelope missing the current/past arrays", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      parseApi(medicationsResponseSchema, { data: {} }, "medications"),
    ).toThrow(ApiError);
    spy.mockRestore();
  });

  it("accepts a null journey (no active journey)", () => {
    expect(() =>
      parseApi(journeyResponseSchema, { data: null }, "journey"),
    ).not.toThrow();
  });
});
