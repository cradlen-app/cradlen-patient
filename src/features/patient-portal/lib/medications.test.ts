import { describe, expect, it } from "vitest";
import { Pill, Syringe, Droplet } from "lucide-react";
import { groupIntoPrescriptions, MED_FORM_ICON } from "./medications";
import type { PortalMedication } from "../types/patient-portal.types";

function med(overrides: Partial<PortalMedication> = {}): PortalMedication {
  return {
    id: "m1",
    prescriptionId: "rx1",
    name: "Folic Acid",
    dose: "5mg",
    frequency: "Daily",
    prescriberName: "Dr. Jane",
    clinic: { id: "c1", name: "Maadi" },
    startDate: "2026-06-01T00:00:00.000Z",
    status: "active",
    ...overrides,
  } as PortalMedication;
}

describe("groupIntoPrescriptions", () => {
  it("folds medicines that share a prescriptionId into one prescription", () => {
    const result = groupIntoPrescriptions([
      med({ id: "m1", prescriptionId: "rx1" }),
      med({ id: "m2", prescriptionId: "rx1", name: "Iron" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rx1");
    expect(result[0].items.map((i) => i.id)).toEqual(["m1", "m2"]);
  });

  it("takes header fields (date/doctor/clinic) from the first item of each group", () => {
    const result = groupIntoPrescriptions([
      med({ prescriptionId: "rx1", prescriberName: "Dr. A", startDate: "2026-06-01T00:00:00.000Z" }),
      med({ id: "m2", prescriptionId: "rx1", prescriberName: "Dr. B" }),
    ]);
    expect(result[0].doctorName).toBe("Dr. A");
    expect(result[0].prescribedAt).toBe("2026-06-01T00:00:00.000Z");
  });

  it("sorts prescriptions newest-first by prescribedAt", () => {
    const result = groupIntoPrescriptions([
      med({ id: "old", prescriptionId: "rxOld", startDate: "2025-01-01T00:00:00.000Z" }),
      med({ id: "new", prescriptionId: "rxNew", startDate: "2026-06-01T00:00:00.000Z" }),
    ]);
    expect(result.map((r) => r.id)).toEqual(["rxNew", "rxOld"]);
  });

  it("returns an empty array for no medicines", () => {
    expect(groupIntoPrescriptions([])).toEqual([]);
  });
});

describe("MED_FORM_ICON", () => {
  it("maps every dosage form to an icon", () => {
    expect(MED_FORM_ICON.tablet).toBe(Pill);
    expect(MED_FORM_ICON.capsule).toBe(Pill);
    expect(MED_FORM_ICON.injection).toBe(Syringe);
    expect(MED_FORM_ICON.drops).toBe(Droplet);
    expect(MED_FORM_ICON.syrup).toBe(Droplet);
    expect(MED_FORM_ICON.other).toBe(Pill);
  });
});
