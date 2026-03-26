"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface CalledAlertProps {
  ticketNumber: string;
  onDismiss: () => void;
}

export function CalledAlert({ ticketNumber, onDismiss }: CalledAlertProps) {
  const t = useTranslations("queue");

  return (
    <div
      className="called-alert-overlay called-alert-enter"
      role="alertdialog"
      aria-live="assertive"
      aria-label={t("calledAlert")}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing ticket number */}
        <div className="called-pulse-ring flex items-center justify-center rounded-full bg-action/10 p-6 s:p-8 dark:bg-action/15">
          <span className="called-ticket-number">#{ticketNumber}</span>
        </div>

        {/* Alert text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-bold text-foreground s:text-2xl">
            {t("calledAlert")}
          </h2>
          <p className="text-sm text-muted-foreground s:text-base">
            {t("calledAlertDescription")}
          </p>
        </div>

        {/* Dismiss button */}
        <Button
          onClick={onDismiss}
          className="h-12 min-w-[160px] rounded-xl text-base font-semibold"
        >
          {t("calledDismiss")}
        </Button>
      </div>
    </div>
  );
}
