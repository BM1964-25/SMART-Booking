import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/smartbooking",
        destination: "/smartbooking/index.html",
      },
    ];
  },
};

export default nextConfig;
