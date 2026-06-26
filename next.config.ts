import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/manifest.json',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=0' }],
    },
  ],
};

export default nextConfig;
