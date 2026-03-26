"use client";

import { PauseCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function QueuePausedBanner() {
  const t = useTranslations("store");

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-3 text-sm text-warning-foreground dark:border-warning/15 dark:bg-warning/5">
      <PauseCircleIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-warning"
      />
      <div>
        <p className="font-medium">{t("queuePaused")}</p>
        <p className="text-xs text-muted-foreground">
          {t("queuePausedDescription")}
        </p>
      </div>
    </div>
  );
}
