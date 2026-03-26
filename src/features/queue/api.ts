import { apiFetch } from "@/lib/api";
import type { IssueTicketResponse, TicketStatusResponse } from "@/types/queue";

export function joinQueue(storeId: string): Promise<IssueTicketResponse> {
  return apiFetch<IssueTicketResponse>(`/api/queue/public/${storeId}/tickets`, {
    method: "POST",
  });
}

export function getTicketStatus(
  storeId: string,
  ticketId: string,
): Promise<TicketStatusResponse> {
  return apiFetch<TicketStatusResponse>(
    `/api/queue/public/${storeId}/tickets/${ticketId}`,
  );
}

export function cancelTicket(storeId: string, ticketId: string): Promise<void> {
  return apiFetch<void>(
    `/api/queue/public/${storeId}/tickets/${ticketId}/cancel`,
    { method: "POST", expectNoContent: true },
  );
}

export function registerFcmToken(
  storeId: string,
  ticketId: string,
  token: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/queue/public/${storeId}/tickets/${ticketId}/fcm-token`,
    {
      method: "POST",
      body: JSON.stringify({ token }),
      expectNoContent: true,
    },
  );
}
