/** Public origin of the deployed app. Never use an internal/localhost host in production. */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (typeof window !== "undefined") return window.location.origin;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  return "http://localhost:3000";
}

export function authCallbackUrl(next: string) {
  const path = next.startsWith("/") ? next : `/${next}`;
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(path)}`;
}

export function safeNextPath(next: string | null, fallback = "/app") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export function originFromRequest(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const hostIsLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    forwardedHost?.startsWith("localhost") ||
    forwardedHost?.startsWith("127.0.0.1");

  if (process.env.NODE_ENV === "development" && hostIsLocal) {
    return url.origin;
  }

  if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.startsWith("127.")) {
    return `${forwardedProto.split(",")[0]?.trim() || "https"}://${forwardedHost.split(",")[0]?.trim()}`;
  }

  const site = getSiteUrl();
  if (!site.includes("localhost")) return site;
  return url.origin;
}
