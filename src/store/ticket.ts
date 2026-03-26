import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TICKET_STORAGE_PREFIX } from "@/lib/constants";
import type { TicketDto, TicketStatusResponse } from "@/types/queue";

interface TicketState {
  storeId: string | null;
  ticketId: string | null;
  ticket: TicketDto | null;
  status: TicketStatusResponse | null;
  setTicket: (storeId: string, ticket: TicketDto) => void;
  updateStatus: (status: TicketStatusResponse) => void;
  clearTicket: () => void;
  hasActiveTicket: (storeId: string) => boolean;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      storeId: null,
      ticketId: null,
      ticket: null,
      status: null,
      setTicket: (storeId, ticket) =>
        set({
          storeId,
          ticketId: ticket.id,
          ticket,
          status: null,
        }),
      updateStatus: (status) => set({ status }),
      clearTicket: () => {
        const { storeId } = get();
        if (storeId) {
          try {
            localStorage.removeItem(`${TICKET_STORAGE_PREFIX}${storeId}`);
          } catch {
            // localStorage not available
          }
        }
        set({
          storeId: null,
          ticketId: null,
          ticket: null,
          status: null,
        });
      },
      hasActiveTicket: (storeId) => {
        const state = get();
        return state.storeId === storeId && state.ticketId !== null;
      },
    }),
    {
      name: "notiguide-ticket",
      partialize: (state) => ({
        storeId: state.storeId,
        ticketId: state.ticketId,
        ticket: state.ticket,
        status: state.status,
      }),
    },
  ),
);
