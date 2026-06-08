import { afterEach, describe, expect, it } from "vitest";
import { useTicketStore } from "@/store/ticket";
import type { TicketDto } from "@/types/queue";

const initial = useTicketStore.getState();
afterEach(() => useTicketStore.setState(initial, true));

const ticket = (id: string) =>
  ({ id, number: "A7", status: "WAITING" }) as unknown as TicketDto;

describe("useTicketStore", () => {
  it("setTicket stores the store id and ticket", () => {
    useTicketStore.getState().setTicket("store-1", ticket("t1"));
    const state = useTicketStore.getState();
    expect(state.storeId).toBe("store-1");
    expect(state.ticketId).toBe("t1");
  });

  it("hasActiveTicket is true only for the matching store", () => {
    useTicketStore.getState().setTicket("store-1", ticket("t1"));
    expect(useTicketStore.getState().hasActiveTicket("store-1")).toBe(true);
    expect(useTicketStore.getState().hasActiveTicket("store-2")).toBe(false);
  });

  it("clearTicket resets the ticket fields", () => {
    useTicketStore.getState().setTicket("store-1", ticket("t1"));
    useTicketStore.getState().clearTicket();
    expect(useTicketStore.getState().ticket).toBeNull();
  });

  it("persists the active ticket under the configured storage key", () => {
    useTicketStore.getState().setTicket("store-1", ticket("t1"));
    const raw = localStorage.getItem("notiguide-ticket");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).state.storeId).toBe("store-1");
  });
});
