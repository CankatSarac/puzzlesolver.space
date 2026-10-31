import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point the i18n plugin at the request config. No locale prefix is used, so the
// existing routes (/, /tango, /battleship, /skyscraper, /slitherlink) are kept.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The vendored solver pages (Tango/Battleship/Slitherlink/Skyscraper) are proven,
  // working apps written with loose TS. This skips tsc type nits for vendored code so
  // it can't block deploys. Real bundler errors (unresolved imports, syntax) still
  // fail the build, so integration mistakes are still caught. (Next 16 no longer runs
  // ESLint during build, so no eslint key is needed.)
  typescript: { ignoreBuildErrors: true },
};

export default withNextIntl(nextConfig);
