/**
 * Patient portal data access — the single swap point for the real backend.
 *
 * `fetchMedications`, `fetchVisitHistory`, and `fetchObgynHistory` are wired to
 * live patient-scoped endpoints (`/api/patient-portal/medications`, `…/visits`,
 * `…/obgyn-history`).
 * The remaining functions still resolve from in-memory fixtures until their
 * backends exist; replace each body with a patient-scoped fetch the same way
 * when they do — the return types and all callers stay identical.
 *
 * Uploads mutate a module-local clone of the fixtures so the prototype reflects
 * new documents and flips the related lab order to "pending_review".
 */
import { apiFetch } from "@/infrastructure/http/api";
import { mapApiMedication } from "../lib/map-medication";
import { mapApiJourney } from "../lib/map-journey";
import { mapApiJourneyTimeline } from "../lib/map-journey-timeline";
import { mapApiVisit } from "../lib/map-visit";
import { mapApiUpcomingVisit } from "../lib/map-upcoming-visit";
import { mapApiInvestigation } from "../lib/map-investigation";
import { mapApiProfile } from "../lib/map-profile";
import type { ApiPatientMedicationsResponse } from "./patient-medications.api.types";
import type {
  ApiPatientUpcomingVisitsResponse,
  ApiPatientVisitsResponse,
} from "./patient-visits.api.types";
import type { ApiPatientJourneyTimelineResponse } from "./patient-journey-timeline.api.types";
import type {
  ApiPatientInvestigationsResponse,
  ApiResultUploadUrl,
} from "./patient-investigations.api.types";
import type { ApiPatientNotificationsResponse } from "./patient-notifications.api.types";
import type { ApiPatientJourneyResponse } from "./patient-journey.api.types";
import type {
  ApiPatientProfile,
  ApiProfileImageUploadUrl,
} from "./patient-profile.api.types";
import type {
  ApiPortalHistoryGroup,
  ApiPortalHistoryResponse,
} from "./patient-history.api.types";
import type {
  Appointment,
  HealthRecord,
  LabOrder,
  PatientProfile,
  PortalDocument,
  PortalJourney,
  PortalJourneyTimelineEntry,
  PortalMedication,
  PortalTest,
  PortalUpcomingVisit,
  PortalVisit,
  PatientProfileDetails,
  Reminder,
  UpdatePatientProfileInput,
  UploadDocumentInput,
} from "../types/patient-portal.types";
import {
  APPOINTMENTS,
  CLINICS,
  DOCUMENTS,
  HEALTH_RECORDS,
  LAB_ORDERS,
  REMINDERS,
} from "./fixtures";

/**
 * Resolves on the microtask queue (no artificial latency). Real network delay
 * arrives for free when these bodies are swapped for `apiAuthFetch` calls.
 * Avoiding `setTimeout` also keeps behavior deterministic under hidden tabs,
 * which throttle timers.
 */
function delay<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Mutable in-memory state, seeded from fixtures, so uploads persist per session. */
const documentsState: Record<string, PortalDocument[]> = clone(DOCUMENTS);
const labOrdersState: Record<string, LabOrder[]> = clone(LAB_ORDERS);

/** Minimal shape of the `/api/patient-auth/me` payload this module consumes. */
type PatientMeResponse = {
  data: {
    accessible_patients: {
      id: string;
      full_name: string;
      date_of_birth: string;
      relation: string; // "SELF" or a GuardianRelation value
      profile_image_url: string | null;
    }[];
  };
};

/**
 * The profile list is the real signed-in account: the patient themselves, or
 * the patients a guardian may act on — straight from `/patient-auth/me`, with no
 * mock fixtures or fallback. Demographic fields the backend doesn't yet return
 * (avatar, blood type, height, national id) are simply absent; consumers render
 * a placeholder. Errors surface to the query (the navbar's `usePatientMe`
 * governs the sign-in redirect).
 */
export async function fetchProfiles(): Promise<PatientProfile[]> {
  const me = await apiFetch<PatientMeResponse>("/api/patient-auth/me");
  return me.data.accessible_patients.map((real) => {
    const isSelf = real.relation === "SELF";
    return {
      id: real.id,
      kind: isSelf ? "self" : "dependent",
      fullName: real.full_name,
      dateOfBirth: real.date_of_birth,
      relation: isSelf ? undefined : real.relation,
      imageUrl: real.profile_image_url ?? null,
    };
  });
}

export function fetchHealthRecord(patientId: string): Promise<HealthRecord> {
  const record = HEALTH_RECORDS[patientId] ?? {
    patientId,
    visits: [],
    vitals: [],
    allergies: [],
  };
  return delay(clone(record));
}

/** One page of visit history. Shape mirrors staff `ApiVisitHistoryResponse`. */
export type VisitHistoryPage = {
  data: PortalVisit[];
  meta: { page: number; limit: number; total: number };
};

/**
 * Paginated COMPLETED visit history for a patient, newest first, from the live
 * patient-scoped endpoint. The backend wraps the list as `{ data, meta }`; each
 * item is mapped to the portal `PortalVisit` view model. An empty `patientId`
 * lets the backend resolve all patients the caller may access.
 */
export async function fetchVisitHistory({
  patientId,
  page = 1,
  limit = 10,
}: {
  patientId: string;
  page?: number;
  limit?: number;
}): Promise<VisitHistoryPage> {
  const search = new URLSearchParams();
  if (patientId) search.set("patient_id", patientId);
  search.set("page", String(page));
  search.set("limit", String(limit));

  const res = await apiFetch<ApiPatientVisitsResponse>(
    `/api/patient-portal/visits?${search.toString()}`,
  );

  return {
    data: res.data.map(mapApiVisit),
    meta: { page: res.meta.page, limit: res.meta.limit, total: res.meta.total },
  };
}

/** One page of upcoming follow-ups, mapped to `PortalUpcomingVisit`. */
export type UpcomingVisitsPage = {
  data: PortalUpcomingVisit[];
  meta: { page: number; limit: number; total: number };
};

/**
 * Paginated upcoming recommended follow-ups for a patient, soonest first, from
 * the live `/patient-portal/visits/upcoming` endpoint. These are derived from
 * completed visits' `follow_up_date`, not booked appointments. An empty
 * `patientId` lets the backend resolve all patients the caller may access.
 */
export async function fetchUpcomingVisits({
  patientId,
  page = 1,
  limit = 10,
}: {
  patientId: string;
  page?: number;
  limit?: number;
}): Promise<UpcomingVisitsPage> {
  const search = new URLSearchParams();
  if (patientId) search.set("patient_id", patientId);
  search.set("page", String(page));
  search.set("limit", String(limit));

  const res = await apiFetch<ApiPatientUpcomingVisitsResponse>(
    `/api/patient-portal/visits/upcoming?${search.toString()}`,
  );

  return {
    data: res.data.map(mapApiUpcomingVisit),
    meta: { page: res.meta.page, limit: res.meta.limit, total: res.meta.total },
  };
}

/** One page of the journey timeline (paginated by journey). */
export type JourneyTimelinePage = {
  data: PortalJourneyTimelineEntry[];
  meta: { page: number; limit: number; total: number };
};

/**
 * Paginated Journey → Episode → Visit timeline for a patient (journeys newest
 * first), from the live `/patient-portal/visits/journeys/timeline` endpoint.
 * Cross-org and scoped server-side to the patients the caller may access; each
 * nested visit is mapped to the same `PortalVisit` the flat history renders. An
 * empty `patientId` lets the backend resolve the patients the caller may access.
 */
export async function fetchPatientJourneyTimeline({
  patientId,
  page = 1,
  limit = 5,
}: {
  patientId: string;
  page?: number;
  limit?: number;
}): Promise<JourneyTimelinePage> {
  const search = new URLSearchParams();
  if (patientId) search.set("patient_id", patientId);
  search.set("page", String(page));
  search.set("limit", String(limit));

  const res = await apiFetch<ApiPatientJourneyTimelineResponse>(
    `/api/patient-portal/visits/journeys/timeline?${search.toString()}`,
  );

  return {
    data: res.data.map(mapApiJourneyTimeline),
    meta: { page: res.meta.page, limit: res.meta.limit, total: res.meta.total },
  };
}

/**
 * The patient's single active journey for the home dashboard (care-path type,
 * ordered stages, optional pregnancy block) from the live
 * `/patient-portal/journey` endpoint, mapped to the `PortalJourney` view model.
 * Returns null when the patient has no active journey. An empty `patientId`
 * lets the backend resolve the patients the caller may access.
 */
export async function fetchPatientJourney(
  patientId: string,
): Promise<PortalJourney | null> {
  const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<ApiPatientJourneyResponse>(
    `/api/patient-portal/journey${qs}`,
  );
  return res.data ? mapApiJourney(res.data) : null;
}

/** One page of investigations, mapped to the portal `PortalTest` view model. */
export type InvestigationsPage = {
  data: PortalTest[];
  meta: { page: number; limit: number; total: number };
};

/**
 * Paginated investigations (lab tests & imaging) for a patient, newest first,
 * from the live patient-scoped endpoint. The backend wraps the list as
 * `{ data, meta }` and gates result content on REVIEWED; each item is mapped to
 * the portal `PortalTest` view model. An empty `patientId` lets the backend
 * resolve all patients the caller may access.
 */
export async function fetchInvestigations({
  patientId,
  page = 1,
  limit = 10,
  status,
  type,
}: {
  patientId: string;
  page?: number;
  limit?: number;
  /** Backend `InvestigationStatus` (ORDERED | RESULTED | REVIEWED | CANCELLED). */
  status?: string;
  /** Backend `LabTestCategory` (LAB | IMAGING | OTHER). */
  type?: string;
}): Promise<InvestigationsPage> {
  const search = new URLSearchParams();
  if (patientId) search.set("patient_id", patientId);
  search.set("page", String(page));
  search.set("limit", String(limit));
  if (status) search.set("status", status);
  if (type) search.set("type", type);

  const res = await apiFetch<ApiPatientInvestigationsResponse>(
    `/api/patient-portal/investigations?${search.toString()}`,
  );

  return {
    data: res.data.map(mapApiInvestigation),
    meta: { page: res.meta.page, limit: res.meta.limit, total: res.meta.total },
  };
}

/**
 * Uploads one result file to an investigation via the presigned R2 flow:
 * ask the API for a presigned PUT, upload the bytes **directly to R2** (a plain
 * `fetch`, not the `/api` proxy), then confirm the object key. The browser→R2
 * PUT relies on the bucket's CORS policy allowing this origin.
 */
async function uploadOneResultFile(
  investigationId: string,
  file: File,
): Promise<void> {
  const presign = await apiFetch<{ data: ApiResultUploadUrl }>(
    `/api/patient-portal/investigations/${investigationId}/result-upload-url`,
    {
      method: "POST",
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
      }),
    },
  );

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.data.content_type },
  });
  if (!put.ok) {
    throw new Error("Upload failed");
  }

  await apiFetch(
    `/api/patient-portal/investigations/${investigationId}/result`,
    { method: "POST", body: JSON.stringify({ key: presign.data.key }) },
  );
}

/**
 * Uploads result files to an investigation, sequentially so the server-side cap
 * is respected and a failure stops the rest.
 */
export async function uploadInvestigationResult({
  investigationId,
  files,
}: {
  investigationId: string;
  files: File[];
}): Promise<void> {
  for (const file of files) {
    await uploadOneResultFile(investigationId, file);
  }
}

/**
 * Profile & account settings for the active patient. All calls accept an
 * optional `patientId` so a guardian can manage a dependent (sent as the
 * `patient_id` query param the backend validates for access). Responses are
 * `{ data }`-wrapped and mapped to the `PatientProfileDetails` view model.
 */
function profileQuery(patientId?: string): string {
  if (!patientId) return "";
  const search = new URLSearchParams({ patient_id: patientId });
  return `?${search.toString()}`;
}

export async function fetchPatientProfile(
  patientId?: string,
): Promise<PatientProfileDetails> {
  const res = await apiFetch<{ data: ApiPatientProfile }>(
    `/api/patient-portal/profile${profileQuery(patientId)}`,
  );
  return mapApiProfile(res.data);
}

export async function updatePatientProfile({
  patientId,
  input,
}: {
  patientId?: string;
  input: UpdatePatientProfileInput;
}): Promise<PatientProfileDetails> {
  const res = await apiFetch<{ data: ApiPatientProfile }>(
    `/api/patient-portal/profile${profileQuery(patientId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        full_name: input.fullName,
        date_of_birth: input.dateOfBirth,
        phone_number: input.phoneNumber,
        address: input.address,
        marital_status: input.maritalStatus,
      }),
    },
  );
  return mapApiProfile(res.data);
}

/**
 * Sets the active patient's avatar via the presigned R2 flow (mirrors
 * `uploadOneResultFile`): request a presigned PUT, upload the bytes directly to
 * R2, then confirm the object key. Returns the updated profile.
 */
export async function uploadProfileImage({
  patientId,
  file,
}: {
  patientId?: string;
  file: File;
}): Promise<PatientProfileDetails> {
  const presign = await apiFetch<{ data: ApiProfileImageUploadUrl }>(
    `/api/patient-portal/profile/image-upload-url${profileQuery(patientId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
        file_name: file.name,
      }),
    },
  );

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.data.content_type },
  });
  if (!put.ok) {
    throw new Error("Upload failed");
  }

  const res = await apiFetch<{ data: ApiPatientProfile }>(
    `/api/patient-portal/profile/image${profileQuery(patientId)}`,
    { method: "POST", body: JSON.stringify({ key: presign.data.key }) },
  );
  return mapApiProfile(res.data);
}

export async function removeProfileImage(
  patientId?: string,
): Promise<PatientProfileDetails> {
  const res = await apiFetch<{ data: ApiPatientProfile }>(
    `/api/patient-portal/profile/image${profileQuery(patientId)}`,
    { method: "DELETE" },
  );
  return mapApiProfile(res.data);
}

/** Changes the account password. Returns nothing (backend replies 204). */
export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch("/api/patient-auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

/** The account's current security-question key (null if none set yet). */
export async function fetchSecurityQuestion(): Promise<string | null> {
  const me = await apiFetch<{ data: { security_question: string | null } }>(
    "/api/patient-auth/me",
  );
  return me.data.security_question ?? null;
}

/**
 * Sets or updates the account's security question + answer. Requires the
 * current password (the backend re-verifies it). Returns nothing (backend
 * replies 204). Only the question key + answer are sent; the answer is hashed
 * server-side and never read back.
 */
export async function setSecurityQuestion({
  securityQuestion,
  securityAnswer,
  currentPassword,
}: {
  securityQuestion: string;
  securityAnswer: string;
  currentPassword: string;
}): Promise<void> {
  await apiFetch("/api/patient-auth/security-question", {
    method: "POST",
    body: JSON.stringify({
      security_question: securityQuestion,
      security_answer: securityAnswer,
      current_password: currentPassword,
    }),
  });
}

/** Removes a result file the patient uploaded (allowed before review). */
export async function removeInvestigationAttachment({
  investigationId,
  attachmentId,
}: {
  investigationId: string;
  attachmentId: string;
}): Promise<void> {
  await apiFetch(
    `/api/patient-portal/investigations/${investigationId}/result/${attachmentId}`,
    { method: "DELETE" },
  );
}

/** One page of the patient's notifications (newest first), with the unread count. */
export function fetchPatientNotifications({
  limit = 20,
}: {
  limit?: number;
} = {}): Promise<ApiPatientNotificationsResponse> {
  return apiFetch<ApiPatientNotificationsResponse>(
    `/api/patient-portal/notifications?limit=${limit}`,
  );
}

/** A paginated page of notifications for the full "see all" list. */
export function fetchPatientNotificationsPage({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ApiPatientNotificationsResponse> {
  const search = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiFetch<ApiPatientNotificationsResponse>(
    `/api/patient-portal/notifications?${search.toString()}`,
  );
}

/** Marks one notification read. */
export async function markPatientNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/patient-portal/notifications/${id}/read`, {
    method: "PATCH",
  });
}

/** Marks all of the patient's notifications read. */
export async function markAllPatientNotificationsRead(): Promise<void> {
  await apiFetch(`/api/patient-portal/notifications/read-all`, {
    method: "PATCH",
  });
}

/**
 * Read-only OB/GYN history for a patient, as display-ready groups from the live
 * patient-scoped endpoint. The backend already composes labeled sections/rows,
 * so the portal renders them generically — no field mapping here. Returns an
 * empty array when the patient has no recorded history.
 */
export async function fetchObgynHistory(
  patientId: string,
): Promise<ApiPortalHistoryGroup[]> {
  const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<{ data: ApiPortalHistoryResponse }>(
    `/api/patient-portal/obgyn-history${qs}`,
  );
  return res.data.groups;
}

export async function fetchMedications(
  patientId: string,
): Promise<PortalMedication[]> {
  const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<ApiPatientMedicationsResponse>(
    `/api/patient-portal/medications${qs}`,
  );
  return [
    ...res.data.current.map((m) => mapApiMedication(m, "active")),
    ...res.data.past.map((m) => mapApiMedication(m, "past")),
  ];
}

export function fetchLabOrders(patientId: string): Promise<LabOrder[]> {
  return delay(clone(labOrdersState[patientId] ?? []));
}

export function fetchDocuments(patientId: string): Promise<PortalDocument[]> {
  return delay(clone(documentsState[patientId] ?? []));
}

export function fetchAppointments(patientId: string): Promise<Appointment[]> {
  return delay(clone(APPOINTMENTS[patientId] ?? []));
}

export function fetchReminders(patientId: string): Promise<Reminder[]> {
  return delay(clone(REMINDERS[patientId] ?? []));
}

export function uploadDocument(
  input: UploadDocumentInput,
): Promise<PortalDocument> {
  const clinic =
    Object.values(CLINICS).find((c) => c.id === input.clinicId) ??
    CLINICS.maadi;

  const order = input.labOrderId
    ? (labOrdersState[input.forPatientId] ?? []).find(
        (o) => o.id === input.labOrderId,
      )
    : undefined;

  const doc: PortalDocument = {
    id: `doc-${Date.now()}`,
    title: order?.name ?? titleForKind(input.kind),
    kind: input.kind,
    files: input.files,
    clinic,
    doctorName: input.doctorName,
    forPatientId: input.forPatientId,
    visitId: input.visitId ?? order?.visitId,
    labOrderId: input.labOrderId,
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: "pending_review",
    note: input.note,
  };

  documentsState[input.forPatientId] = [
    doc,
    ...(documentsState[input.forPatientId] ?? []),
  ];

  if (order) {
    order.status = "pending_review";
  }

  return delay(clone(doc));
}

function titleForKind(kind: UploadDocumentInput["kind"]): string {
  switch (kind) {
    case "lab_result":
      return "Lab result";
    case "scan":
      return "Scan";
    default:
      return "Document";
  }
}
