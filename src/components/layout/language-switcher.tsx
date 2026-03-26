"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, string> = {
  vi: "🇻🇳 VI",
  en: "🇬🇧 EN",
};

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  const nextLocale: AppLocale = locale === "vi" ? "en" : "vi";

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      aria-label={t("switchTo")}
      className="text-xs font-medium"
    >
      {LOCALE_LABELS[locale]}
    </Button>
  );
}
