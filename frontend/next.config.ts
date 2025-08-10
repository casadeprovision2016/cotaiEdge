import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Optimize images
  images: {
    unoptimized: true,
  },
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  // PWA support
  generateBuildId: () => {
    return 'cotai-edge-' + Date.now()
  },
};

export default nextConfig;
