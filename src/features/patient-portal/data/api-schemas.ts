/**
 * Runtime validation at the backend → view-model boundary.
 *
 * The `lib/map-*` mappers trust the wire shapes in `*.api.types.ts`. Those types
 * are compile-time only: if the backend drifts (a renamed field, a `null` where
 * an array was promised) the mapper throws a raw `TypeError` deep in render.
 * These Zod schemas validate the structure the mappers actually depend on, so a
 * drift surfaces as a clean, logged `ApiError(502)` the query can show as an
 * error state instead of crashing.
 *
 * Design: only the fields a mapper reads *without* a null guard are required;
 * everything else is nullable/optional. Enum-ish fields stay `z.string()` because
 * every mapper already defaults unknown values — validating them strictly would
 * reject a harmless new backend enum member. Unknown keys are stripped (Zod's
 * default), so additive backend changes never fail validation.
 */
import { z } from "zod";
import { ApiError } from "@/infrastructure/http/api";

/** Validate `data` against `schema`, or throw a clean 502 (logging the issues). */
export function parseApi<T>(
  schema: z.ZodType,
  data: unknown,
  context: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(
      `[patient-portal] malformed ${context} response`,
      result.error.issues,
    );
    throw new ApiError(502, "Received an unexpected response from the server.");
  }
  return result.data as T;
}

const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

const nullableString = z.string().nullable();

// --- Visits --------------------------------------------------------------------

const visitItem = z.object({
  id: z.string(),
  visit_date: z.string(),
  completed_at: z.string(),
  appointment_type: z.string(),
  priority: z.string(),
  status: z.string(),
  specialty_code: nullableString,
  doctor_name: nullableString,
  organization_name: nullableString,
  branch_name: nullableString,
  diagnoses: z.array(z.object({ description: z.string(), is_primary: z.boolean() })),
  medications: z.array(
    z.object({ name: z.string(), dose: z.string(), frequency: z.string() }),
  ),
  investigations: z.array(z.object({ name: z.string() })),
});

export const visitsResponseSchema = z.object({
  data: z.array(visitItem),
  meta: paginationMeta,
});

const upcomingVisitItem = z.object({
  id: z.string(),
  follow_up_date: z.string(),
  follow_up_notes: nullableString,
  specialty_code: nullableString,
  doctor_name: nullableString,
  organization_name: nullableString,
  branch_name: nullableString,
});

export const upcomingVisitsResponseSchema = z.object({
  data: z.array(upcomingVisitItem),
  meta: paginationMeta,
});

// --- Medications ---------------------------------------------------------------

const medicationItem = z.object({
  id: z.string(),
  prescription_id: z.string(),
  name: z.string(),
  dose: z.string(),
  frequency: z.string(),
  visit_date: z.string(),
  generic_name: nullableString,
  route: nullableString,
  instructions: nullableString,
  doctor_name: nullableString,
  clinic_name: nullableString,
  organization_name: nullableString,
  end_date: nullableString,
  category: nullableString,
  form: nullableString,
});

export const medicationsResponseSchema = z.object({
  data: z.object({
    current: z.array(medicationItem),
    past: z.array(medicationItem),
  }),
});

// --- Investigations ------------------------------------------------------------

const investigationItem = z.object({
  id: z.string(),
  test_name: z.string(),
  status: z.string(),
  ordered_at: z.string(),
  type: nullableString,
  instructions: nullableString,
  ordered_by_name: nullableString,
  reviewed_at: nullableString,
  reviewed_by_name: nullableString,
  result_text: nullableString,
  organization_name: nullableString,
  branch_name: nullableString,
  result_attachments: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        content_type: nullableString,
        source: z.string(),
      }),
    )
    .optional(),
});

export const investigationsResponseSchema = z.object({
  data: z.array(investigationItem),
  meta: paginationMeta,
});

// --- Profile -------------------------------------------------------------------

const profile = z.object({
  id: z.string(),
  full_name: z.string(),
  national_id: z.string(),
  date_of_birth: z.string(),
  phone_number: z.string(),
  address: z.string(),
  marital_status: z.string(),
  profile_image_url: nullableString,
});

export const profileResponseSchema = z.object({ data: profile });

// --- Journey -------------------------------------------------------------------

const journey = z.object({
  journey_id: z.string(),
  care_path_code: nullableString,
  specialty_code: nullableString,
  label: nullableString,
  status: z.string(),
  started_at: z.string(),
  stages: z.array(
    z.object({ id: z.string(), name: z.string(), order: z.number(), status: z.string() }),
  ),
  pregnancy: z
    .object({
      gestational_age_weeks: z.number().nullable(),
      gestational_age_days: z.number().nullable(),
      estimated_due_date: nullableString,
      number_of_fetuses: z.number().nullable(),
      pregnancy_type: nullableString,
      fetal_sexes: nullableString,
      risk_level: nullableString,
    })
    .nullable(),
});

export const journeyResponseSchema = z.object({ data: journey.nullable() });
