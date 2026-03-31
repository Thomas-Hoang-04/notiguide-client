"use client";

import {
  AlertCircleIcon,
  TicketIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { JoinQueueButton } from "@/components/queue/join-queue-button";
import { QueueFullBanner } from "@/components/store/queue-full-banner";
import { QueuePausedBanner } from "@/components/store/queue-paused-banner";
import { StoreClosedBanner } from "@/components/store/store-closed-banner";
import { StoreHeader } from "@/components/store/store-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJoinQueue } from "@/features/queue/hooks";
import { useQueueSize, useStoreInfo } from "@/features/store/hooks";
import { useTicketStorage } from "@/hooks/use-ticket-storage";
import { useRouter } from "@/i18n/navigation";
import { useTicketStore } from "@/store/ticket";
import type { TicketStatus } from "@/types/queue";

interface ActiveTicketSummary {
  storeId: string;
  ticketId: string;
  number: string;
}

interface StorePageProps {
  params: Promise<{ storeId: string }>;
}

export default function StorePage({ params }: StorePageProps) {
  const { storeId } = use(params);

  return <StorePageContent storeId={storeId} />;
}

function StorePageContent({ storeId }: { storeId: string }) {
  const t = useTranslations("store");
  const tQueue = useTranslations("queue");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const {
    storeInfo,
    isLoading: storeLoading,
    error: storeError,
  } = useStoreInfo(storeId);
  const { queueSize, isLoading: queueLoading } = useQueueSize(
    storeId,
    !!storeInfo?.isActive,
  );
  const {
    join,
    isJoining,
    error: joinError,
    rateLimitSeconds,
  } = useJoinQueue(storeId);
  const ticketStoreStoreId = useTicketStore((s) => s.storeId);
  const ticketStoreTicketId = useTicketStore((s) => s.ticketId);
  const ticketStoreTicketNumber = useTicketStore(
    (s) => s.ticket?.number ?? null,
  );
  const ticketStoreStatus = useTicketStore((s) => s.status?.status ?? null);
  const { getStoredTicket } = useTicketStorage();

  const [activeTicket, setActiveTicket] = useState<ActiveTicketSummary | null>(
    null,
  );
  const [isTicketLookupReady, setIsTicketLookupReady] = useState(false);
  const isJoiningRef = useRef(false);

  useEffect(() => {
    if (storeInfo && storeInfo.publicId !== storeId) {
      router.replace(`/store/${storeInfo.publicId}`);
    }
  }, [storeInfo, storeId, router]);

  // Resolve any active ticket before allowing another join attempt.
  useEffect(() => {
    const persistedActiveTicket =
      ticketStoreStoreId &&
      ticketStoreTicketId &&
      ticketStoreTicketNumber &&
      !isTerminalStatus(ticketStoreStatus)
        ? {
            storeId: ticketStoreStoreId,
            ticketId: ticketStoreTicketId,
            number: ticketStoreTicketNumber,
          }
        : null;

    const storedCurrentTicket = !ticketStoreTicketId
      ? getStoredTicket(storeId)
      : null;

    setActiveTicket(
      persistedActiveTicket ??
        (storedCurrentTicket
          ? {
              storeId,
              ticketId: storedCurrentTicket.ticketId,
              number: storedCurrentTicket.ticket.number,
            }
          : null),
    );
    setIsTicketLookupReady(true);
  }, [
    storeId,
    getStoredTicket,
    ticketStoreStoreId,
    ticketStoreTicketId,
    ticketStoreTicketNumber,
    ticketStoreStatus,
  ]);

  // Handle successful join — redirect to ticket page (only after user-initiated join)
  useEffect(() => {
    if (
      isJoiningRef.current &&
      ticketStoreStoreId === storeId &&
      ticketStoreTicketId &&
      ticketStoreTicketNumber
    ) {
      isJoiningRef.current = false;
      router.push(`/store/${storeId}/ticket/${ticketStoreTicketId}`);
    }
  }, [
    ticketStoreStoreId,
    ticketStoreTicketId,
    ticketStoreTicketNumber,
    storeId,
    router,
  ]);

  async function handleJoin() {
    if (activeTicket) {
      router.push(
        `/store/${activeTicket.storeId}/ticket/${activeTicket.ticketId}`,
      );
      return;
    }

    isJoiningRef.current = true;
    await join();
    // Redirect happens via the useEffect above
  }

  // Store not found
  if (storeError === "notFound") {
    return (
      <div className="flex min-h-dvh flex-col bg-gradient-page">
        <Header />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
        >
          <div
            role="alert"
            className="glass-card glass-card-elevated flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center"
          >
            <AlertCircleIcon
              aria-hidden="true"
              className="size-10 text-muted-foreground"
            />
            <h1 className="text-lg font-semibold">{t("storeNotFound")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("storeNotFoundDescription")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Network error
  if (storeError === "network") {
    return (
      <div className="flex min-h-dvh flex-col bg-gradient-page">
        <Header />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
        >
          <div
            role="alert"
            className="glass-card glass-card-elevated flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center"
          >
            <WifiOffIcon
              aria-hidden="true"
              className="size-10 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              {tErrors("networkError")}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {tCommon("retry")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Server error
  if (storeError === "server") {
    return (
      <div className="flex min-h-dvh flex-col bg-gradient-page">
        <Header />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8"
        >
          <div
            role="alert"
            className="glass-card glass-card-elevated flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center"
          >
            <AlertCircleIcon
              aria-hidden="true"
              className="size-10 text-destructive"
            />
            <p className="text-sm text-muted-foreground">
              {tErrors("serverError")}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {tCommon("retry")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-page">
      <Header />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-3 py-6 s:px-4 s:py-8"
      >
        <div className="w-full max-w-[480px] l:max-w-[560px]">
          <div className="flex flex-col gap-5">
            {/* Store Info Card */}
            <Card className="glass-card glass-card-elevated glass-context-primary rounded-2xl">
              <CardContent className="flex flex-col gap-4 pt-4 pb-4">
                {storeLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : storeInfo ? (
                  <>
                    <StoreHeader store={storeInfo} />

                    {/* Store Inactive Banner */}
                    {!storeInfo.isActive && <StoreClosedBanner />}

                    {/* Queue Paused Banner */}
                    {storeInfo.isActive &&
                      storeInfo.queueState === "PAUSED" && (
                        <QueuePausedBanner />
                      )}

                    {/* Queue Full Banner */}
                    {storeInfo.isActive &&
                      storeInfo.queueState !== "PAUSED" &&
                      storeInfo.maxQueueSize > 0 &&
                      queueSize !== null &&
                      queueSize >= storeInfo.maxQueueSize && (
                        <QueueFullBanner />
                      )}

                    {/* Queue Size */}
                    {storeInfo.isActive && (
                      <div
                        aria-live="polite"
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <UsersIcon
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        {queueLoading ? (
                          <Skeleton className="h-4 w-32" />
                        ) : queueSize !== null && queueSize > 0 ? (
                          <span>
                            {t("ticketsWaiting", { count: queueSize })}
                          </span>
                        ) : (
                          <span>{t("noOneWaiting")}</span>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Active Ticket Banner */}
            {activeTicket && (
              <Card className="glass-card rounded-2xl border-primary/20">
                <CardContent className="flex flex-col gap-3 pt-4 pb-4">
                  <div className="flex items-center gap-2">
                    <TicketIcon
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    <p className="text-sm font-medium">
                      {tQueue("hasActiveTicket", {
                        number: activeTicket.number,
                      })}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl"
                    onClick={() =>
                      router.push(
                        `/store/${activeTicket.storeId}/ticket/${activeTicket.ticketId}`,
                      )
                    }
                  >
                    {tQueue("viewActiveTicket")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Join Queue Button */}
            {!isTicketLookupReady ? (
              <Skeleton className="h-12 w-full rounded-xl xs:h-14" />
            ) : !activeTicket ? (
              <JoinQueueButton
                onJoin={handleJoin}
                isJoining={isJoining}
                disabled={
                  storeLoading ||
                  !storeInfo?.isActive ||
                  storeInfo?.queueState === "PAUSED" ||
                  (storeInfo != null &&
                    storeInfo.maxQueueSize > 0 &&
                    queueSize !== null &&
                    queueSize >= storeInfo.maxQueueSize)
                }
              />
            ) : null}

            {/* Join Error Messages */}
            <div aria-live="polite">
              {joinError === "rateLimited" && rateLimitSeconds && (
                <p className="text-center text-sm text-destructive">
                  {tErrors("rateLimited", { seconds: rateLimitSeconds })}
                </p>
              )}
              {joinError === "network" && (
                <p className="text-center text-sm text-destructive">
                  {tErrors("networkError")}
                </p>
              )}
              {joinError === "server" && (
                <p className="text-center text-sm text-destructive">
                  {tErrors("serverError")}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function isTerminalStatus(status: TicketStatus | null | undefined): boolean {
  return (
    status === "SERVED" || status === "CANCELLED" || status === "SKIPPED"
  );
}
