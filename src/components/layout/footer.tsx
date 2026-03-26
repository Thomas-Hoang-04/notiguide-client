"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("store");

  return (
    <footer className="py-4 text-center">
      <p className="text-xs text-muted-foreground">{t("poweredBy")}</p>
    </footer>
  );
}
