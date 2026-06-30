// Pure predicate for the patient-API privacy boundary, extracted so it can be
// unit-tested independently of the service-worker runtime. Matches against the
// URL pathname (RegExpRoute matches the full href, which is why an anchored
// regex must be applied to the pathname here instead).
export function isPatientApiPath(pathname: string): boolean {
  return /^\/api\/(patient-portal|patient-auth)\//.test(pathname);
}
