/**
 * Request scoped i18n configuration consumed by the i18n library plugin.
 *
 * No locale prefix is used: the active locale comes from the override cookie or
 * Accept Language auto detection (see locale.ts). The existing routes such as
 * /tango and /battleship therefore stay exactly the same.
 */
import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
