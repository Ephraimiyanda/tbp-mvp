import type { NextConfig } from "next";

function resolvedSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const vercelUrl = vercelHost
    ? vercelHost.startsWith("http")
      ? vercelHost.replace(/\/$/, "")
      : `https://${vercelHost}`
    : undefined;
  const explicitIsLocal = !explicit || /localhost|127\.0\.0\.1/.test(explicit);
  if (explicit && !explicitIsLocal) return explicit;
  if (vercelUrl) return vercelUrl;
  return explicit || "http://localhost:3000";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: resolvedSiteUrl(),
  },
};

export default nextConfig;
