/**
 * Server side locale resolution. Reads the manual override cookie first and
 * falls back to Accept Language auto detection. Imported by the request config
 * and the root layout, both of which run only on the server.
 */
import { cookies, headers } from "next/headers";
import { type Locale, LOCALE_COOKIE, isLocale } from "./config";
import { matchAcceptLanguage } from "./negotiate";

export async function getUserLocale(): Promise<Locale> {
  // 1. Manual override wins: a cookie set by the language switcher.
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  // 2. Otherwise auto detect from the browser Accept Language header.
  const headerStore = await headers();
  return matchAcceptLanguage(headerStore.get("accept-language"));
}
