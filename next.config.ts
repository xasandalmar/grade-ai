import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Exam result sheets can be a few MB; the default 1MB limit is too small.
      bodySizeLimit: "10mb",
    },
  },
};

export default withNextIntl(nextConfig);
