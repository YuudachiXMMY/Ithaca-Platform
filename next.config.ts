import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img1.wsimg.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
