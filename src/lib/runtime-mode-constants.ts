export const DEMO_MODE_COOKIE = "tt_demo_mode";
export const CACHEABLE_DEMO_HEADER = "X-TraceTutor-Cacheable-Demo";

export function isApplicationPath(pathname: string) {
  return pathname.startsWith("/student/") || pathname.startsWith("/tutor/");
}

export function requiresPrivateAccountCache(
  pathname: string,
  explicitDemo: boolean,
) {
  return (
    pathname.startsWith("/auth/") ||
    (!explicitDemo && isApplicationPath(pathname))
  );
}
