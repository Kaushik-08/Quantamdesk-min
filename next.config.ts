import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev "N" badge (bottom-left) — it overlaps the sidebar profile.
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
