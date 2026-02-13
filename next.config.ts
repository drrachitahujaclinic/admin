import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d23fqu91mldaa0.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
