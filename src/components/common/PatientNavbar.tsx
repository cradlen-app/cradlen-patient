"use client";

import { useEffect } from "react";
import Image from "next/image";
// Messages icon hidden until the messaging feature is built.
// import { Mail } from "lucide-react";

import Logo from "@/public/Logo.png";
import { Link, useRouter } from "@/i18n/navigation";
import { usePatientMe } from "@/features/auth/hooks/usePatientAuth";
import { PatientNotificationBell } from "@/core/patient-portal";
import { PatientProfileSwitcher } from "./PatientProfileSwitcher";

// Only used by the (currently hidden) Messages icon. Restore alongside it.
// function IconButton({
//   label,
//   badge,
//   children,
// }: {
//   label: string;
//   badge?: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       type="button"
//       aria-label={label}
//       className="relative size-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
//     >
//       {children}
//       {badge && (
//         <span className="absolute top-1.5 inset-e-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-white" />
//       )}
//     </button>
//   );
// }

/**
 * Patient portal top bar — mirrors the staff `Navbar`. On md+ the right side
 * shows the account control (`PatientProfileSwitcher`: switch profile, Profile
 * link, logout); on phones those affordances live in the More overlay
 * (`PatientMoreSheet`) opened from the bottom tab bar.
 */
export function PatientNavbar() {
  const router = useRouter();

  // Validate the real patient session beyond the optimistic proxy gate: if the
  // token is missing/invalid, bounce to the patient sign-in.
  const { isError: sessionInvalid } = usePatientMe();
  useEffect(() => {
    if (sessionInvalid) router.replace("/patient/signin");
  }, [sessionInvalid, router]);

  return (
    <header className="relative h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0">
      {/* Logo — start-aligned at every size */}
      <Link
        href="/patient"
        aria-label="Cradlen home"
        className="static w-30 shrink-0 inline-flex"
      >
        <Image src={Logo} alt="CRADLEN" className="w-auto" priority />
      </Link>

      {/* Right section */}
      <div className="ms-auto flex items-center gap-1">
        <PatientNotificationBell />

        {/* Messages — hidden until the messaging feature is built:
        <div className="hidden md:flex">
          <IconButton label="Messages">
            <Mail className="size-5" />
          </IconButton>
        </div> */}

        {/* Account control (switch profile + logout) — md+ only */}
        <div className="hidden md:flex items-center gap-1">
          <div className="w-px h-5 bg-gray-200 mx-1.5" />
          <PatientProfileSwitcher />
        </div>
      </div>
    </header>
  );
}
