import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" removed — Vercel uses its own build pipeline
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
