import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/vocab-games-react',
  assetPrefix: '/vocab-games-react/',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
