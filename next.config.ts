import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@daily-co/daily-js",
    "@daily-co/daily-react",
    "livekit-client",
    "@palabra-ai/translator",
  ],
  turbopack: {
    resolveAlias: {
      // Force @palabra-ai/translator to use its pre-built bundle (dist/lib.js)
      // instead of the shipped src/ directory. The src/ files import
      // livekit-client from node_modules which calls adapter.js shims
      // at module load time, breaking Daily.co's WebRTC detection.
      "@palabra-ai/translator": "@palabra-ai/translator/dist/lib.js",
    },
  },
};

export default nextConfig;
