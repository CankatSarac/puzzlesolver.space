/**
 * Pure Accept Language negotiation. Kept dependency free and side effect free
 * so it can run inside the request config, in server components, and in tests.
 */
import { type Locale, locales, defaultLocale } from "./config";

/**
 * Parse an Accept Language header and return the best supported locale.
 *
 * The header looks like "en-US,en;q=0.9,es;q=0.8". Tags are ranked by their q
 * weight (default 1). For each tag we try an exact match first, then fall back
 * to the primary subtag so that a regional variant such as pt_BR still resolves
 * to the base "pt" catalog. English is returned when nothing matches.
 */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;

  const supported = locales as readonly string[];

  const ranked = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number.parseFloat(value);
          if (Number.isFinite(parsed)) q = parsed;
        }
      }
      return { tag: rawTag.trim().toLowerCase(), q };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === "*") return defaultLocale;
    if (supported.includes(tag)) return tag as Locale;
    // Primary subtag sits before the region separator in a BCP47 tag.
    const primary = tag.split("-")[0];
    if (supported.includes(primary)) return primary as Locale;
  }

  return defaultLocale;
}
