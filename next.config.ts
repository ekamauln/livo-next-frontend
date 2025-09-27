import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cf.shopee.co.id",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.tokopedia.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ecs7.tokopedia.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
