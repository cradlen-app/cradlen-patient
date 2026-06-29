import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Holds the active patient profile (self or a dependent) the portal is
 * currently viewing. Separate from the staff `authContextStore` — a patient is
 * not bound to an org/branch. All portal hooks read `activeProfileId` to scope
 * their queries.
 *
 * Starts empty; `useActivePatientId` reconciles it to the real account holder
 * once the profiles load from `/patient-auth/me`.
 */
type PatientProfileState = {
  activeProfileId: string;
  setActiveProfile: (id: string) => void;
};

export const DEFAULT_PROFILE_ID = "";

export const usePatientProfileStore = create<PatientProfileState>()(
  persist(
    (set) => ({
      activeProfileId: DEFAULT_PROFILE_ID,
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    { name: "cradlen-patient-profile" },
  ),
);
