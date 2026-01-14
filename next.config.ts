import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "https://93b8f3bc8354.ngrok-free.app",
    "https://*.ngrok-free.app",
  ],
};

export default nextConfig;
