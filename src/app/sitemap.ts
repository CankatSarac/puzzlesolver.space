import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];
  for (const s of SOLVERS) {
    if (s.status === "available" && s.url) {
      routes.push({
        url: `${SITE.url}${s.url}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }
  return routes;
}
