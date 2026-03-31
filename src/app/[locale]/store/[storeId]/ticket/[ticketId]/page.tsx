"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { CalledAlert } from "@/components/queue/called-alert";
import { CancelTicketDialog } from "@/components/queue/cancel-ticket-dialog";
import { NotificationPrompt } from "@/components/queue/notification-prompt";
import { TicketCard } from "@/components/queue/ticket-card";
import { TicketStatusBadge } from "@/components/queue/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelTicket, useTicketPolling } from "@/features/queue/hooks";
import { usePushNotification } from "@/hooks/use-push-notification";
import { useTicketStorage } from "@/hooks/use-ticket-storage";
import { useVibration } from "@/hooks/use-vibration";
import { useRouter } from "@/i18n/navigation";
import { getRelativeTime } from "@/lib/utils";
import { useTicketStore } from "@/store/ticket";
import type { TicketDto, TicketStatus } from "@/types/queue";

type TerminalStateStatus = "served" | "cancelled" | "skipped" | "expired";

interface TicketPageProps {
  params: Promise<{ storeId: string; ticketId: string }>;
}

export default function TicketPage({ params }: TicketPageProps) {
  const { storeId, ticketId } = use(params);

  return <TicketPageContent storeId={storeId} ticketId={ticketId} />;
}

function TicketPageContent({
  storeId,
  ticketId,
}: {
  storeId: string;
  ticketId: string;
}) {
  const t = useTranslations("queue");
  const tErrors = useTranslations("errors");
  const tTime = useTranslations("time");
  const router = useRouter();

  const ticket = useTicketStore((s) => s.ticket);
  const storedStatus = useTicketStore((s) => s.status);
  const {
    status,
    lastUpdated,
    error: pollingError,
    rateLimitSeconds,
    isReconnecting,
    refresh,
  } = useTicketPolling(storeId, ticketId);
  const cancelTicket = useCancelTicket(storeId, ticketId);
  const pushNotification = usePushNotification(storeId, ticketId);
  const { vibrateOnCalled, stopContinuousVibration } = useVibration();
  const { getStoredTicket } = useTicketStorage();

  const storedTicket = getStoredTicket(storeId)?.ticket ?? null;
  const resolvedTicket = ticket ?? storedTicket;

  const [showCalledAlert, setShowCalledAlert] = useState(false);
  const [lastRelativeTime, setLastRelativeTime] = useState("");
  const [ticketSnapshot, setTicketSnapshot] = useState<TicketDto | null>(
    () => resolvedTicket,
  );
  const [terminalStatus, setTerminalStatus] = useState<TicketStatus | null>(
    isTerminalTicketStatus(storedStatus?.status) ? storedStatus.status : null,
  );
  // Seed from persisted status so re-mount doesn't re-trigger the called alert
  const previousStatusRef = useRef<TicketStatus | null>(
    storedStatus?.status ?? null,
  );
  const [isRedirectingAfterCancel, setIsRedirectingAfterCancel] =
    useState(false);

  const displayedTicket = resolvedTicket ?? ticketSnapshot;
  const currentStatus =
    status?.status ?? storedStatus?.status ?? terminalStatus;

  // Detect CALLED transition — only fires on genuine WAITING→CALLED change
  useEffect(() => {
    if (status?.status === "CALLED" && previousStatusRef.current !== "CALLED") {
      setShowCalledAlert(true);
      vibrateOnCalled();
    }

    if (status?.status !== "CALLED") {
      stopContinuousVibration();
    }

    if (isTerminalTicketStatus(status?.status)) {
      setTerminalStatus(status.status);
    }

    previousStatusRef.current = status?.status ?? null;
  }, [status?.status, stopContinuousVibration, vibrateOnCalled]);

  useEffect(() => {
    if (resolvedTicket) {
      setTicketSnapshot(resolvedTicket);
    }
  }, [resolvedTicket]);

  useEffect(() => {
    if (isTerminalTicketStatus(storedStatus?.status)) {
      setTerminalStatus(storedStatus.status);
    }
  }, [storedStatus?.status]);

  // Update relative time display
  useEffect(() => {
    if (!lastUpdated) return;

    function updateTime() {
      if (!lastUpdated) return;
      const relative = getRelativeTime(lastUpdated);
      if (relative.unit === "justNow") {
        setLastRelativeTime(tTime("justNow"));
      } else {
        setLastRelativeTime(
          t("lastUpdated", {
            time: tTime(relative.unit, { count: relative.count }),
          }),
        );
      }
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated, tTime, t]);

  // Handle cancel success
  const handleCancelConfirm = useCallback(async () => {
    const success = await cancelTicket.cancel();
    if (success) {
      setIsRedirectingAfterCancel(true);
      router.replace(`/store/${storeId}`);
    }
  }, [cancelTicket, router, storeId]);

  // CalledAlert dismiss
  function handleDismissAlert() {
    stopContinuousVibration();
    setShowCalledAlert(false);
  }

  // Terminal states
  const isServed = currentStatus === "SERVED";
  const isCancelled = currentStatus === "CANCELLED";
  const isSkipped = currentStatus === "SKIPPED";
  const isExpired = pollingError === "expired";
  const isTerminal = isServed || isCancelled || isSkipped || isExpired;
  const canCancel =
    currentStatus === "WAITING" ||
    currentStatus === "CALLED" ||
    currentStatus === "REQUEUED";

  // Called Alert overlay
  if (showCalledAlert && displayedTicket) {
    return (
      <CalledAlert
        ticketNumber={displayedTicket.number}
        onDismiss={handleDismissAlert}
      />
    );
  }

  if (isRedirectingAfterCancel) {
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-page">
      <Header showBack backHref={`/store/${storeId}`} />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-3 py-6 s:px-4 s:py-8"
      >
        <div className="w-full max-w-120 l:max-w-140">
          <div className="flex flex-col gap-5">
            {/* Page Title */}
            <h1 className="text-center text-lg font-semibold s:text-xl">
              {t("yourTicket")}
            </h1>

            {/* Ticket Card */}
            {isTerminal ? (
              <TerminalState
                status={
                  isServed
                    ? "served"
                    : isCancelled
                      ? "cancelled"
                      : isSkipped
                        ? "skipped"
                        : "expired"
                }
                storeId={storeId}
                ticketNumber={displayedTicket?.number ?? null}
              />
            ) : !displayedTicket || !status ? (
              <Card className="glass-card glass-card-elevated rounded-2xl">
                <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : (
              <TicketCard ticket={displayedTicket} status={status} />
            )}

            {/* Push Notification Prompt */}
            {!isTerminal && status && (
              <NotificationPrompt
                permissionState={pushNotification.permissionState}
                onRequestPermission={pushNotification.requestPermission}
                isRegistering={pushNotification.isRegistering}
              />
            )}

            {/* Last Updated + Refresh */}
            {!isTerminal && lastUpdated && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>{lastRelativeTime}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={refresh}
                  aria-label={t("refreshStatus")}
                >
                  <RefreshCwIcon aria-hidden="true" className="size-3" />
                </Button>
              </div>
            )}

            {/* Connection status */}
            <div aria-live="polite">
              {isReconnecting && (
                <p className="text-center text-xs text-warning">
                  {tErrors("reconnecting")}
                </p>
              )}
              {pollingError === "rateLimited" && rateLimitSeconds && (
                <p className="text-center text-xs text-destructive">
                  {tErrors("rateLimited", { seconds: rateLimitSeconds })}
                </p>
              )}
              {pollingError === "network" && !isReconnecting && (
                <p className="text-center text-xs text-destructive">
                  {tErrors("networkError")}
                </p>
              )}
            </div>

            {/* Cancel Button (only for active tickets) */}
            {canCancel && !isTerminal && (
              <CancelTicketDialog
                onConfirm={handleCancelConfirm}
                isCancelling={cancelTicket.isCancelling}
                error={cancelTicket.error}
                rateLimitSeconds={cancelTicket.rateLimitSeconds}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TerminalState({
  status,
  storeId,
  ticketNumber,
}: {
  status: TerminalStateStatus;
  storeId: string;
  ticketNumber: string | null;
}) {
  const t = useTranslations("queue");
  const router = useRouter();

  const config = {
    served: {
      icon: CheckCircle2Icon,
      iconClass: "text-success",
      title: t("ticketCompletedTitle"),
      description: t("ticketCompletedDescription"),
    },
    cancelled: {
      icon: XCircleIcon,
      iconClass: "text-muted-foreground",
      title: t("ticketCancelledTitle"),
      description: t("ticketCancelledDescription"),
    },
    skipped: {
      icon: AlertCircleIcon,
      iconClass: "text-destructive",
      title: t("ticketSkippedTitle"),
      description: t("ticketSkippedDescription"),
    },
    expired: {
      icon: AlertCircleIcon,
      iconClass: "text-muted-foreground",
      title: t("ticketExpiredTitle"),
      description: t("ticketExpiredDescription"),
    },
  };

  const { icon: Icon, iconClass, title, description } = config[status];
  const badgeStatus =
    status === "expired" ? null : TERMINAL_STATUS_BADGE_MAP[status];

  return (
    <Card className="glass-card glass-card-elevated rounded-2xl">
      <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6 text-center status-transition">
        <Icon aria-hidden="true" className={`size-12 ${iconClass}`} />
        {ticketNumber && (
          <p className="text-sm text-muted-foreground">
            {t("ticketNumber")}{" "}
            <span className="font-semibold text-foreground">
              #{ticketNumber}
            </span>
          </p>
        )}
        {badgeStatus && <TicketStatusBadge status={badgeStatus} />}
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        <Button
          className="h-10 rounded-xl"
          onClick={() => router.push(`/store/${storeId}`)}
        >
          {t("joinAgain")}
        </Button>
      </CardContent>
    </Card>
  );
}

const TERMINAL_STATUS_BADGE_MAP: Record<
  Exclude<TerminalStateStatus, "expired">,
  TicketStatus
> = {
  served: "SERVED",
  cancelled: "CANCELLED",
  skipped: "SKIPPED",
};

function isTerminalTicketStatus(
  status: TicketStatus | null | undefined,
): status is "SERVED" | "CANCELLED" | "SKIPPED" {
  return status === "SERVED" || status === "CANCELLED" || status === "SKIPPED";
}
