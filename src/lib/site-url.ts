/** True for loopback hosts that must never appear in production auth emails. */
export function isLocalHost(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/.test(value);
  }
}

/**
 * Public origin of the app.
 * On the client, the live window origin wins so confirm-email `redirect_to`
 * cannot stay stuck on localhost from a copied .env.example.
 */
export function getSiteUrl() {
  if (typeof window !== "undefined" && !isLocalHost(window.location.origin)) {
    return window.location.origin;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit && !isLocalHost(explicit)) return explicit;

  if (typeof window !== "undefined") return window.location.origin;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) {
    const url = vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
    if (!isLocalHost(url)) return url;
  }

  if (explicit) return explicit;
  return "http://localhost:3000";
}

/**
 * Origin only — no `?next=` query.
 * Supabase drops `redirect_to` values that are not an exact (or wildcard)
 * match in Redirect URLs and silently uses Site URL, which is often localhost.
 */
export function authCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`;
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
    isLocalHost(url.origin) || (forwardedHost ? isLocalHost(forwardedHost) : false);

  if (process.env.NODE_ENV === "development" && hostIsLocal) {
    return url.origin;
  }

  if (forwardedHost && !isLocalHost(forwardedHost)) {
    return `${forwardedProto.split(",")[0]?.trim() || "https"}://${forwardedHost.split(",")[0]?.trim()}`;
  }

  const site = getSiteUrl();
  if (!isLocalHost(site)) return site;
  return url.origin;
}
