import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";
import { withSentryConfig } from "@sentry/nextjs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(process.env.VERCEL
    ? {}
    : {
        turbopack: {
          root: path.resolve(__dirname),
        },
      }),
  async redirects() {
    return [
      {
        source: "/use-cases/rag-search",
        destination: "/use-cases/research-agent",
        permanent: true,
      },
      {
        source: "/use-cases/teaching-data-factory",
        destination: "/use-cases/reasoning-ai",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendOrigin = (process.env.MEMORYOS_API_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/horos/:path*",
        destination: `${backendOrigin}/api/v1/horos/:path*`,
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
