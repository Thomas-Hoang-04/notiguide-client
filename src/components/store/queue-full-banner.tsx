"use client";

import { UsersRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function QueueFullBanner() {
  const t = useTranslations("store");

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive dark:border-destructive/15 dark:bg-destructive/5">
      <UsersRoundIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-destructive"
      />
      <div>
        <p className="font-medium">{t("queueFull")}</p>
        <p className="text-xs text-muted-foreground">
          {t("queueFullDescription")}
        </p>
      </div>
    </div>
  );
}
