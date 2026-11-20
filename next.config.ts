import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point the i18n plugin at the request config. No locale prefix is used, so the
// existing routes (/, /tango, /battleship, /skyscraper, /slitherlink) are kept.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
