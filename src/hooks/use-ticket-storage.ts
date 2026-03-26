"use client";

import { useCallback } from "react";
import { TICKET_STORAGE_PREFIX } from "@/lib/constants";
import type { TicketDto } from "@/types/queue";

interface StoredTicket {
  ticketId: string;
  ticket: TicketDto;
  storedAt: number;
}

export function useTicketStorage() {
  const getStoredTicket = useCallback(
    (storeId: string): StoredTicket | null => {
      try {
        const raw = localStorage.getItem(`${TICKET_STORAGE_PREFIX}${storeId}`);
        if (!raw) return null;
        return JSON.parse(raw) as StoredTicket;
      } catch {
        return null;
      }
    },
    [],
  );

  const storeTicket = useCallback((storeId: string, ticket: TicketDto) => {
    try {
      const data: StoredTicket = {
        ticketId: ticket.id,
        ticket,
        storedAt: Date.now(),
      };
      localStorage.setItem(
        `${TICKET_STORAGE_PREFIX}${storeId}`,
        JSON.stringify(data),
      );
    } catch {
      // localStorage not available
    }
  }, []);

  const clearStoredTicket = useCallback((storeId: string) => {
    try {
      localStorage.removeItem(`${TICKET_STORAGE_PREFIX}${storeId}`);
    } catch {
      // localStorage not available
    }
  }, []);

  return { getStoredTicket, storeTicket, clearStoredTicket };
}
