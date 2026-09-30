import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les polices de l'image « top 10 » sont lues depuis le disque : on les emporte en ligne
  outputFileTracingIncludes: {
    "/api/top-image": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
