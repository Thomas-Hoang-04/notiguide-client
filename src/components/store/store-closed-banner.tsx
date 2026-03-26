"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function StoreClosedBanner() {
  const t = useTranslations("store");

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-3 text-sm text-warning-foreground dark:border-warning/15 dark:bg-warning/5">
      <AlertCircleIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-warning"
      />
      <p>{t("storeInactive")}</p>
    </div>
  );
}
