import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN
        protocol: "https",
        hostname: "tomxtegnwnuwojvcmhur.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Unsplash (legacy fallback — remove after cleanup phase)
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Wikimedia (legacy fallback — remove after cleanup phase)
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
