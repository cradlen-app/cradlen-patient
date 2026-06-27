import type {
  PermissionId,
  PermissionPredicate,
} from "@/common/kernel-contracts";

/**
 * The patient portal renders in its own shell (not the staff dashboard), so it
 * contributes no dashboard nav and no kernel permissions in this phase. Access
 * is gated by the patient login flow (national ID + verify), which is designed
 * but not built yet — see the deferred backend spec.
 *
 * An empty map satisfies the manifest contract while reserving the namespace.
 */
export const patientPortalPermissions: Readonly<
  Record<PermissionId, PermissionPredicate>
> = {};
