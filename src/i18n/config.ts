/**
 * Central locale configuration for the whole app.
 *
 * Six shipped locales. English is the fallback used when the visitor has no
 * saved override and sends no recognizable Accept Language preference. Keys use
 * dot.notation / snake_case in the message catalogs (see messages/*.json).
 */

export const locales = ["en", "es", "de", "fr", "pt", "tr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Human readable names shown inside the language switcher (each in its own language). */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  tr: "Türkçe",
};

/** Short flag style label for the compact switcher trigger. */
export const localeShort: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  de: "DE",
  fr: "FR",
  pt: "PT",
  tr: "TR",
};

/** Cookie name that stores a manual language override. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
