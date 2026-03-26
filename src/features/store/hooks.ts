"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POLLING_INTERVALS } from "@/lib/constants";
import { NetworkError, NotFoundError } from "@/types/api";
import type { StorePublicInfoResponse } from "@/types/store";
import { getQueueSize, getStoreInfo } from "./api";

interface UseStoreInfoResult {
  storeInfo: StorePublicInfoResponse | null;
  isLoading: boolean;
  error: "notFound" | "network" | "server" | null;
}

export function useStoreInfo(storeId: string): UseStoreInfoResult {
  const [storeInfo, setStoreInfo] = useState<StorePublicInfoResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<"notFound" | "network" | "server" | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchInfo() {
      try {
        setIsLoading(true);
        setError(null);
        const info = await getStoreInfo(storeId);
        if (!cancelled) {
          setStoreInfo(info);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotFoundError) {
          setError("notFound");
        } else if (err instanceof NetworkError) {
          setError("network");
        } else {
          setError("server");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchInfo();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return { storeInfo, isLoading, error };
}

interface UseQueueSizeResult {
  queueSize: number | null;
  isLoading: boolean;
  refresh: () => void;
}

export function useQueueSize(
  storeId: string,
  enabled = true,
): UseQueueSizeResult {
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSize = useCallback(async () => {
    try {
      const result = await getQueueSize(storeId);
      setQueueSize(result.queueSize);
    } catch {
      // Silently ignore queue size errors — it's supplementary info
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const refresh = useCallback(() => {
    void fetchSize();
  }, [fetchSize]);

  useEffect(() => {
    if (!enabled) return;

    void fetchSize();
    intervalRef.current = setInterval(fetchSize, POLLING_INTERVALS.QUEUE_SIZE);

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        void fetchSize();
        intervalRef.current = setInterval(
          fetchSize,
          POLLING_INTERVALS.QUEUE_SIZE,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, fetchSize]);

  return { queueSize, isLoading, refresh };
}
