import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";
import { withSentryConfig } from "@sentry/nextjs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendOrigin = (process.env.MEMORYOS_API_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/epoch/:path*",
        destination: `${backendOrigin}/api/v1/epoch/:path*`,
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Clerk UI times out when webpack lazy-compilation stalls chunk loads in dev.
    if (dev && !isServer) {
      config.experiments = {
        ...config.experiments,
        lazyCompilation: false,
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
