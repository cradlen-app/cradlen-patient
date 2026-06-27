/**
 * In-memory mock data for the patient portal prototype.
 *
 * Shaped exactly like the domain types so the swap to real patient-scoped
 * endpoints later only touches `patient-portal.api.ts`. Data is keyed by
 * patient profile id (self + dependents) and tagged with originating clinic.
 */
import type {
  Appointment,
  Clinic,
  HealthRecord,
  LabOrder,
  PortalDocument,
  Reminder,
} from "../types/patient-portal.types";

export const CLINICS: Record<string, Clinic> = {
  maadi: { id: "cln-maadi", name: "Cradlen Maadi", city: "Cairo" },
  nasrCity: { id: "cln-nasr", name: "Cradlen Nasr City", city: "Cairo" },
};

export const HEALTH_RECORDS: Record<string, HealthRecord> = {
  "pat-self": {
    patientId: "pat-self",
    activeJourney: {
      name: "Pregnancy",
      stage: "Week 24 · 2nd trimester",
      clinic: CLINICS.maadi,
    },
    allergies: [
      { id: "alg-1", substance: "Penicillin", reaction: "Rash", severity: "moderate" },
    ],
    vitals: [
      { date: "2026-03-02", systolic: 118, diastolic: 76, weightKg: 64, bmi: 24.1 },
      { date: "2026-04-06", systolic: 121, diastolic: 78, weightKg: 66, bmi: 24.8 },
      { date: "2026-05-04", systolic: 124, diastolic: 80, weightKg: 68, bmi: 25.6 },
      { date: "2026-06-02", systolic: 122, diastolic: 79, weightKg: 70, bmi: 26.3 },
    ],
    visits: [
      {
        id: "vis-self-3",
        date: "2026-06-02",
        clinic: CLINICS.maadi,
        organizationName: "Cradlen",
        doctorName: "Dr. Sara Mansour",
        specialty: "OB/GYN",
        reason: "Antenatal follow-up",
        diagnosis: "Normal pregnancy, week 24",
        notes: "BP stable. Ordered CBC + blood sugar and pelvic ultrasound.",
        status: "completed",
        type: "FOLLOW_UP",
        priority: "normal",
        medications: ["Folic acid 5mg", "Ferrous sulfate 200mg"],
        investigations: ["CBC + Blood sugar", "Pelvic ultrasound"],
      },
      {
        id: "vis-self-2",
        date: "2026-05-04",
        clinic: CLINICS.maadi,
        organizationName: "Cradlen",
        doctorName: "Dr. Sara Mansour",
        specialty: "OB/GYN",
        reason: "Antenatal follow-up",
        diagnosis: "Normal pregnancy, week 20",
        status: "completed",
        type: "FOLLOW_UP",
        priority: "normal",
        medications: ["Folic acid 5mg"],
        investigations: [],
      },
      {
        id: "vis-self-1",
        date: "2026-03-02",
        clinic: CLINICS.nasrCity,
        organizationName: "Cradlen",
        doctorName: "Dr. Hany Adel",
        specialty: "Internal Medicine",
        reason: "Anemia review",
        diagnosis: "Mild iron-deficiency anemia",
        status: "completed",
        type: "VISIT",
        priority: "urgent",
        medications: ["Ferrous sulfate 200mg", "Vitamin C 500mg"],
        investigations: ["Iron studies", "Complete blood count (CBC)"],
      },
    ],
  },
  "pat-child-1": {
    patientId: "pat-child-1",
    activeJourney: {
      name: "Pediatric annual checkup",
      stage: "Age 6 · routine",
      clinic: CLINICS.nasrCity,
    },
    allergies: [],
    vitals: [
      { date: "2026-04-12", weightKg: 20, bmi: 15.4 },
      { date: "2026-06-01", weightKg: 21, bmi: 15.7 },
    ],
    visits: [
      {
        id: "vis-c1-2",
        date: "2026-06-01",
        clinic: CLINICS.nasrCity,
        organizationName: "Cradlen",
        doctorName: "Dr. Nadia Fouad",
        specialty: "Pediatrics",
        reason: "Annual checkup",
        diagnosis: "Healthy, growth on track",
        notes: "Ordered vitamin D level.",
        status: "completed",
        type: "VISIT",
        priority: "normal",
        medications: ["Vitamin D3 1000 IU"],
        investigations: ["Vitamin D level"],
      },
      {
        id: "vis-c1-1",
        date: "2026-02-10",
        clinic: CLINICS.nasrCity,
        organizationName: "Cradlen",
        doctorName: "Dr. Nadia Fouad",
        specialty: "Pediatrics",
        reason: "Fever",
        diagnosis: "Viral upper respiratory infection",
        status: "completed",
        type: "VISIT",
        priority: "urgent",
        medications: ["Paracetamol 250mg syrup", "ORS sachets"],
        investigations: [],
      },
    ],
  },
  "pat-child-2": {
    patientId: "pat-child-2",
    activeJourney: {
      name: "Vaccination schedule",
      stage: "Age 4 · on track",
      clinic: CLINICS.maadi,
    },
    allergies: [],
    vitals: [{ date: "2026-05-20", weightKg: 14, bmi: 16.1 }],
    visits: [
      {
        id: "vis-c2-1",
        date: "2026-05-20",
        clinic: CLINICS.maadi,
        organizationName: "Cradlen",
        doctorName: "Dr. Nadia Fouad",
        specialty: "Pediatrics",
        reason: "18-month vaccination",
        diagnosis: "Routine immunization given",
        status: "completed",
        type: "VISIT",
        priority: "normal",
        medications: [],
        investigations: [],
      },
    ],
  },
};

export const LAB_ORDERS: Record<string, LabOrder[]> = {
  "pat-self": [
    {
      id: "lab-self-1",
      name: "CBC + Blood sugar",
      category: "lab",
      orderedDate: "2026-06-02",
      doctorName: "Dr. Sara Mansour",
      clinic: CLINICS.maadi,
      visitId: "vis-self-3",
      status: "awaiting_upload",
    },
    {
      id: "lab-self-2",
      name: "Pelvic ultrasound",
      category: "imaging",
      orderedDate: "2026-06-02",
      doctorName: "Dr. Sara Mansour",
      clinic: CLINICS.maadi,
      visitId: "vis-self-3",
      status: "awaiting_upload",
    },
    {
      id: "lab-self-3",
      name: "Iron studies",
      category: "lab",
      orderedDate: "2026-03-02",
      doctorName: "Dr. Hany Adel",
      clinic: CLINICS.nasrCity,
      visitId: "vis-self-1",
      status: "result_ready",
      result: {
        id: "res-self-3",
        name: "Iron studies",
        date: "2026-03-09",
        summary: "Low ferritin — iron started",
        fileRef: "mock://iron-studies.pdf",
      },
    },
  ],
  "pat-child-1": [
    {
      id: "lab-c1-1",
      name: "Vitamin D level",
      category: "lab",
      orderedDate: "2026-06-01",
      doctorName: "Dr. Nadia Fouad",
      clinic: CLINICS.nasrCity,
      visitId: "vis-c1-2",
      status: "awaiting_upload",
    },
  ],
  "pat-child-2": [],
};

export const DOCUMENTS: Record<string, PortalDocument[]> = {
  "pat-self": [
    {
      id: "doc-self-1",
      title: "Iron studies result",
      kind: "lab_result",
      files: [
        { id: "f-1", name: "iron_studies.pdf", sizeLabel: "1.1 MB", type: "pdf" },
      ],
      clinic: CLINICS.nasrCity,
      doctorName: "Dr. Hany Adel",
      forPatientId: "pat-self",
      visitId: "vis-self-1",
      labOrderId: "lab-self-3",
      uploadedAt: "2026-03-09",
      status: "reviewed",
      note: "Lab from El-Borg.",
    },
  ],
  "pat-child-1": [],
  "pat-child-2": [],
};

export const APPOINTMENTS: Record<string, Appointment[]> = {
  "pat-self": [
    {
      id: "apt-self-1",
      date: "2026-06-09",
      time: "10:30",
      clinic: CLINICS.maadi,
      doctorName: "Dr. Sara Mansour",
      specialty: "OB/GYN",
      type: "Antenatal follow-up",
      status: "upcoming",
    },
    {
      id: "apt-self-2",
      date: "2026-06-02",
      time: "11:00",
      clinic: CLINICS.maadi,
      doctorName: "Dr. Sara Mansour",
      specialty: "OB/GYN",
      type: "Antenatal follow-up",
      status: "completed",
    },
  ],
  "pat-child-1": [
    {
      id: "apt-c1-1",
      date: "2026-06-20",
      time: "09:00",
      clinic: CLINICS.nasrCity,
      doctorName: "Dr. Nadia Fouad",
      specialty: "Pediatrics",
      type: "Checkup follow-up",
      status: "upcoming",
    },
  ],
  "pat-child-2": [],
};

export const REMINDERS: Record<string, Reminder[]> = {
  "pat-self": [
    { id: "rem-1", label: "Take Folic acid", detail: "Daily" },
    { id: "rem-2", label: "Upload CBC result", detail: "Requested by Dr. Sara" },
  ],
  "pat-child-1": [
    { id: "rem-c1-1", label: "Upload Vitamin D result", detail: "Requested by Dr. Nadia" },
  ],
  "pat-child-2": [],
};
