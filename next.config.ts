import type { NextConfig } from "next";

const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.boliga.org" },
      { protocol: "https", hostname: "images.boligsiden.dk" },
    ],
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
};

export default nextConfig;
