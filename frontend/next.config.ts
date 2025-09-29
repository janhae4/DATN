import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this frontend folder as the root when multiple lockfiles exist
  // This helps Next pick up the correct PostCSS/Tailwind config for Shadcn UI styles
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
