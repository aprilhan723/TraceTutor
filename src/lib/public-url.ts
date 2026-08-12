const LOCAL_FALLBACK_URL = "http://localhost:3000";

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) return new URL(LOCAL_FALLBACK_URL);

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(LOCAL_FALLBACK_URL);
    }
    return url;
  } catch {
    return new URL(LOCAL_FALLBACK_URL);
  }
}
