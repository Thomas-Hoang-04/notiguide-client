"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatTimestamp } from "@/lib/utils";
import type { TicketDto, TicketStatusResponse } from "@/types/queue";
import { PositionDisplay } from "./position-display";
import { TicketStatusBadge } from "./ticket-status-badge";

interface TicketCardProps {
  ticket: TicketDto;
  status: TicketStatusResponse | null;
  className?: string;
}

export function TicketCard({ ticket, status, className }: TicketCardProps) {
  const t = useTranslations("queue");

  const currentStatus = status?.status ?? ticket.status;
  const isWaiting = currentStatus === "WAITING";
  const isCalled = currentStatus === "CALLED";
  const isSkipped = currentStatus === "SKIPPED";
  const isRequeued = currentStatus === "REQUEUED";

  return (
    <Card
      className={cn(
        "glass-card glass-card-elevated rounded-2xl",
        isCalled && "glass-context-action",
        isWaiting && "glass-context-primary",
        className,
      )}
    >
      <CardContent className="flex flex-col items-center gap-4 pt-4 pb-4">
        {/* Ticket Number */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("ticketNumber")}
          </p>
          <p
            className={cn(
              "ticket-number",
              isCalled ? "text-action" : "text-primary",
            )}
          >
            <span className="sr-only">
              {t("ticketNumber")} {ticket.number}
            </span>
            <span aria-hidden="true">#{ticket.number}</span>
          </p>
        </div>

        {/* Status Badge */}
        <TicketStatusBadge status={currentStatus} />

        {/* Position Display (WAITING / REQUEUED) */}
        {(isWaiting || isRequeued) && status?.positionInQueue != null && (
          <PositionDisplay position={status.positionInQueue} />
        )}

        {/* Estimated Wait (WAITING / REQUEUED, when available) */}
        {(isWaiting || isRequeued) && (
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-xs text-muted-foreground">
              {t("estimatedWait")}
            </p>
            <p className="text-sm text-muted-foreground">
              {status?.estimatedWaitTime
                ? t("estimatedWaitMinutes", {
                    minutes: status.estimatedWaitTime,
                  })
                : t("waitUnavailable")}
            </p>
          </div>
        )}

        {/* Skipped / Requeued Messages */}
        {isSkipped && (
          <p className="text-center text-sm text-destructive">
            {t("ticketSkippedMessage")}
          </p>
        )}
        {isRequeued && (
          <p className="text-center text-sm text-warning-foreground">
            {t("ticketRequeuedMessage")}
          </p>
        )}

        {/* Timestamps */}
        <div className="flex w-full flex-col gap-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("issuedAt")}</span>
            <span>{formatTimestamp(ticket.issuedAt)}</span>
          </div>
          {isCalled && ticket.calledAt && (
            <div className="flex justify-between">
              <span>{t("calledAt")}</span>
              <span>{formatTimestamp(ticket.calledAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
