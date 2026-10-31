"use server";

/**
 * Server action used by the language switcher to persist a manual override.
 * Setting the cookie inside a server action makes Next re render the current
 * route with the new locale, so the change is reflected without a full reload.
 */
import { cookies } from "next/headers";
import { type Locale, LOCALE_COOKIE, isLocale } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setUserLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}
