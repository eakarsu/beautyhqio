import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Enable instrumentation for cron job initialization
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
