import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["images.unsplash.com"],
    remotePatterns: [
      {
        protocol: "https",
        // replace hostname with your supabase project host (no protocol)
        hostname: "xzcehmgbzoscskqhqvlm.supabase.co",
        // only allow storage public objects; adjust if you use different path
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
