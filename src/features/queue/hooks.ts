"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTicketStorage } from "@/hooks/use-ticket-storage";
import { useVibration } from "@/hooks/use-vibration";
import {
  ERROR_BACKOFF,
  NEAR_FRONT_THRESHOLD,
  POLLING_INTERVALS,
} from "@/lib/constants";
import { useTicketStore } from "@/store/ticket";
import { NetworkError, NotFoundError, RateLimitError } from "@/types/api";
import type { TicketStatusResponse } from "@/types/queue";
import {
  cancelTicket as cancelTicketApi,
  getTicketStatus,
  joinQueue as joinQueueApi,
} from "./api";

interface UseJoinQueueResult {
  join: () => Promise<void>;
  isJoining: boolean;
  error: "rateLimited" | "network" | "server" | null;
  rateLimitSeconds: number | null;
}

export function useJoinQueue(storeId: string): UseJoinQueueResult {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<
    "rateLimited" | "network" | "server" | null
  >(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const { setTicket } = useTicketStore();
  const { storeTicket } = useTicketStorage();
  const { vibrateOnJoinSuccess } = useVibration();

  const join = useCallback(async () => {
    try {
      setIsJoining(true);
      setError(null);
      setRateLimitSeconds(null);
      const response = await joinQueueApi(storeId);
      setTicket(storeId, response.ticket);
      storeTicket(storeId, response.ticket);
      vibrateOnJoinSuccess();
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError("rateLimited");
        setRateLimitSeconds(err.retryAfterSeconds);
      } else if (err instanceof NetworkError) {
        setError("network");
      } else {
        setError("server");
      }
    } finally {
      setIsJoining(false);
    }
  }, [storeId, setTicket, storeTicket, vibrateOnJoinSuccess]);

  return { join, isJoining, error, rateLimitSeconds };
}

type PollingError = "rateLimited" | "network" | "expired" | null;

interface UseTicketPollingResult {
  status: TicketStatusResponse | null;
  lastUpdated: Date | null;
  error: PollingError;
  rateLimitSeconds: number | null;
  isReconnecting: boolean;
  refresh: () => void;
}

export function useTicketPolling(
  storeId: string,
  ticketId: string,
): UseTicketPollingResult {
  const [status, setStatus] = useState<TicketStatusResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<PollingError>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { updateStatus, clearTicket } = useTicketStore();
  const { clearStoredTicket } = useTicketStorage();
  const consecutiveErrors = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getTicketStatus(storeId, ticketId);
      if (!mountedRef.current) return;

      setStatus(result);
      updateStatus(result);
      setLastUpdated(new Date());
      setError(null);
      setIsReconnecting(false);
      consecutiveErrors.current = 0;

      // Stop polling for terminal states
      if (
        result.status === "SERVED" ||
        result.status === "CANCELLED" ||
        result.status === "SKIPPED"
      ) {
        clearStoredTicket(storeId);
        return;
      }

      // Schedule next poll
      const interval = getPollingInterval(result);
      timeoutRef.current = setTimeout(fetchStatus, interval);
    } catch (err) {
      if (!mountedRef.current) return;

      if (err instanceof NotFoundError) {
        setError("expired");
        clearTicket();
        clearStoredTicket(storeId);
        return;
      }

      consecutiveErrors.current += 1;

      if (err instanceof RateLimitError) {
        setError("rateLimited");
        setRateLimitSeconds(err.retryAfterSeconds);
        timeoutRef.current = setTimeout(
          fetchStatus,
          err.retryAfterSeconds * 1000,
        );
        return;
      }

      if (consecutiveErrors.current >= ERROR_BACKOFF.MAX_CONSECUTIVE_ERRORS) {
        setIsReconnecting(true);
      }

      setError("network");

      // Exponential backoff
      const backoff = Math.min(
        ERROR_BACKOFF.INITIAL *
          ERROR_BACKOFF.MULTIPLIER ** (consecutiveErrors.current - 1),
        ERROR_BACKOFF.MAX,
      );
      timeoutRef.current = setTimeout(fetchStatus, backoff);
    }
  }, [storeId, ticketId, updateStatus, clearTicket, clearStoredTicket]);

  const refresh = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchStatus();

    const handleVisibility = () => {
      if (document.hidden) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        void fetchStatus();
      }
    };

    const handleOnline = () => {
      void fetchStatus();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchStatus]);

  return {
    status,
    lastUpdated,
    error,
    rateLimitSeconds,
    isReconnecting,
    refresh,
  };
}

function getPollingInterval(status: TicketStatusResponse): number {
  if (status.status === "CALLED") {
    return POLLING_INTERVALS.CALLED;
  }
  if (
    status.status === "WAITING" &&
    status.positionInQueue !== null &&
    status.positionInQueue <= NEAR_FRONT_THRESHOLD
  ) {
    return POLLING_INTERVALS.NEAR_FRONT;
  }
  return POLLING_INTERVALS.DEFAULT;
}

interface UseCancelTicketResult {
  cancel: () => Promise<boolean>;
  isCancelling: boolean;
  error: "rateLimited" | "network" | null;
  rateLimitSeconds: number | null;
}

export function useCancelTicket(
  storeId: string,
  ticketId: string,
): UseCancelTicketResult {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<"rateLimited" | "network" | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const { clearTicket } = useTicketStore();
  const { clearStoredTicket } = useTicketStorage();

  const cancel = useCallback(async (): Promise<boolean> => {
    try {
      setIsCancelling(true);
      setError(null);
      await cancelTicketApi(storeId, ticketId);
      clearTicket();
      clearStoredTicket(storeId);
      return true;
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError("rateLimited");
        setRateLimitSeconds(err.retryAfterSeconds);
      } else {
        setError("network");
      }
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [storeId, ticketId, clearTicket, clearStoredTicket]);

  return { cancel, isCancelling, error, rateLimitSeconds };
}
