export function buildDashboardUrl(orgId: string, branchId: string, path = "") {
  return `/${orgId}/${branchId}/dashboard${path}`;
}
