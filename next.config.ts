import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.hit-pay.com',
      },
      {
        protocol: 'https',
        hostname: 'api.hit-pay.com',
      },
      {
        protocol: 'https',
        hostname: 'api.sandbox.hit-pay.com',
      },
    ],
  },
};

export default nextConfig;
