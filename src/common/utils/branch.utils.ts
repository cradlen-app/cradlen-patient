import type { UserBranch } from "@/common/types/user.types";

/**
 * Returns a formatted location string by joining the non-empty address, city,
 * and governorate fields of a branch with ", ".
 *
 * Example: "123 Main St, Cairo, Giza"
 */
export function formatBranchLocation(
  branch: UserBranch | null | undefined,
): string | undefined {
  if (!branch) return undefined;
  const parts = [branch.address, branch.city, branch.governorate].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : undefined;
}
