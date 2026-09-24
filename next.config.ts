import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The second local test session uses 127.0.0.1 to keep its auth cookie separate.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
