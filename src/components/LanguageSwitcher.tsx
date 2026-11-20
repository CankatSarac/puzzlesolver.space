"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/i18n/actions";

/**
 * Visible language switcher in the header. Reads the active locale from the
 * i18n context and, on change, persists a manual override cookie through the
 * setUserLocale server action. The server action triggers a route refresh, so
 * the whole page rerenders server side in the newly chosen language.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const [isPending, startTransition] = useTransition();

  const onChange = (value: string) => {
    startTransition(() => {
      void setUserLocale(value as Locale);
    });
  };

  return (
    <Select value={locale} onValueChange={onChange}>
      <SelectTrigger
        aria-label={t("aria")}
        disabled={isPending}
        className="h-9 w-auto gap-1.5 rounded-full border-line bg-white px-3 text-sm font-medium text-subtle hover:text-ink focus:ring-0 focus:ring-offset-0"
      >
        <Globe size={16} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeNames[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
