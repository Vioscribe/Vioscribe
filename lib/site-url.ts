export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = configuredUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return url.replace(/\/$/, "");
}
