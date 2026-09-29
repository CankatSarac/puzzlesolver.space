import type { Metadata } from "next";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";

/**
 * Per-page metadata. Next replaces the parent `openGraph` / `twitter` objects
 * wholesale, so every field the root layout sets is re-specified here.
 */
export function pageMetadata({
  path,
  title,
  description,
  shareImage,
}: {
  path: string;
  title: string;
  description: string;
  /**
   * Explicit share image. Routes with their own `opengraph-image` file leave this out; other
   * pages pass the hub card, because overriding `openGraph` drops the image inherited from the root.
   */
  shareImage?: string;
}): Metadata {
  const images = shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: SITE.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE.name,
      title,
      description,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images && { images }),
    },
  };
}

/** The hub's social card (served by src/app/opengraph-image.tsx). */
export const HUB_SHARE_IMAGE = "/opengraph-image";

export const PERSON = {
  "@type": "Person",
  "@id": `${SITE.url}/#person`,
  name: SITE.author,
  url: SITE.links.linkedin,
  sameAs: [SITE.links.linkedin, SITE.links.github],
} as const;

/** schema.org WebApplication block for one solver route. */
export function solverJsonLd(solverId: string, description: string) {
  const solver = SOLVERS.find((s) => s.id === solverId);
  if (!solver || !solver.url) throw new Error(`Unknown solver: ${solverId}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${solver.name} Puzzle Solver`,
    url: `${SITE.url}${solver.url}`,
    description,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: PERSON,
  };
}
