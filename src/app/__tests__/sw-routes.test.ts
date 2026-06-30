import { describe, it, expect } from "vitest";
import { isPatientApiPath } from "../sw-routes";

describe("isPatientApiPath", () => {
  it("matches patient-portal and patient-auth API paths", () => {
    expect(isPatientApiPath("/api/patient-portal/notifications")).toBe(true);
    expect(isPatientApiPath("/api/patient-portal/visits/123")).toBe(true);
    expect(isPatientApiPath("/api/patient-auth/me")).toBe(true);
  });
  it("matches bare patient-portal and patient-auth paths (no trailing slash)", () => {
    expect(isPatientApiPath("/api/patient-portal")).toBe(true);
    expect(isPatientApiPath("/api/patient-auth")).toBe(true);
  });
  it("does not match non-patient API or app paths", () => {
    expect(isPatientApiPath("/api/csp-report")).toBe(false);
    expect(isPatientApiPath("/api/version")).toBe(false);
    expect(isPatientApiPath("/api/auth/login")).toBe(false);
    expect(isPatientApiPath("/patient/visits")).toBe(false);
    expect(isPatientApiPath("/")).toBe(false);
  });
  it("does not match paths that merely start with patient-portal or patient-auth prefix", () => {
    expect(isPatientApiPath("/api/patient-portal-extra")).toBe(false);
  });
});
