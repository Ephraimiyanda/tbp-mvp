import type { NextConfig } from "next";

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const inferredSite = vercelHost
  ? vercelHost.startsWith("http")
    ? vercelHost
    : `https://${vercelHost}`
  : undefined;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || inferredSite || "http://localhost:3000",
  },
};

export default nextConfig;
