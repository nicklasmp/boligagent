import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.boliga.dk" },
    ],
  },
};

export default nextConfig;
