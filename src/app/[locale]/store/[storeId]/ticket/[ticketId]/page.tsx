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
  const { vibrateOnCalled } = useVibration();
  const { getStoredTicket } = useTicketStorage();

  const [showCalledAlert, setShowCalledAlert] = useState(false);
  const [lastRelativeTime, setLastRelativeTime] = useState("");
  // Seed from persisted status so re-mount doesn't re-trigger the called alert
  const previousStatusRef = useRef<string | null>(storedStatus?.status ?? null);
  const [isRedirectingAfterCancel, setIsRedirectingAfterCancel] =
    useState(false);

  // Resolve ticket from store or localStorage
  const resolvedTicket = ticket ?? getStoredTicket(storeId)?.ticket ?? null;

  // Detect CALLED transition — only fires on genuine WAITING→CALLED change
  useEffect(() => {
    if (status?.status === "CALLED" && previousStatusRef.current !== "CALLED") {
      setShowCalledAlert(true);
      vibrateOnCalled();
    }
    previousStatusRef.current = status?.status ?? null;
  }, [status?.status, vibrateOnCalled]);

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
    setShowCalledAlert(false);
  }

  // Terminal states
  const isServed = status?.status === "SERVED";
  const isCancelled = status?.status === "CANCELLED";
  const isSkipped = status?.status === "SKIPPED";
  const isExpired = pollingError === "expired";
  const isTerminal = isServed || isCancelled || isSkipped || isExpired;
  const canCancel =
    status?.status === "WAITING" ||
    status?.status === "CALLED" ||
    status?.status === "REQUEUED";

  // Called Alert overlay
  if (showCalledAlert && resolvedTicket) {
    return (
      <CalledAlert
        ticketNumber={resolvedTicket.number}
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
            {!resolvedTicket || !status ? (
              <Card className="glass-card glass-card-elevated rounded-2xl">
                <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : isTerminal ? (
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
              />
            ) : (
              <TicketCard ticket={resolvedTicket} status={status} />
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
}: {
  status: "served" | "cancelled" | "skipped" | "expired";
  storeId: string;
}) {
  const t = useTranslations("queue");
  const router = useRouter();

  const config = {
    served: {
      icon: CheckCircle2Icon,
      iconClass: "text-success",
      message: t("servedMessage"),
    },
    cancelled: {
      icon: XCircleIcon,
      iconClass: "text-muted-foreground",
      message: t("cancelledMessage"),
    },
    skipped: {
      icon: AlertCircleIcon,
      iconClass: "text-destructive",
      message: t("ticketSkippedMessage"),
    },
    expired: {
      icon: AlertCircleIcon,
      iconClass: "text-muted-foreground",
      message: t("ticketExpired"),
    },
  };

  const { icon: Icon, iconClass, message } = config[status];

  return (
    <Card className="glass-card glass-card-elevated rounded-2xl">
      <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6 text-center status-transition">
        <Icon aria-hidden="true" className={`size-12 ${iconClass}`} />
        <p className="text-base font-medium">{message}</p>
        {status === "expired" && (
          <p className="text-sm text-muted-foreground">
            {t("ticketExpiredDescription")}
          </p>
        )}
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
