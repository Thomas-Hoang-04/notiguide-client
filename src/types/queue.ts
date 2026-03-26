export type TicketStatus =
  | "WAITING"
  | "CALLED"
  | "SERVED"
  | "CANCELLED"
  | "SKIPPED"
  | "REQUEUED"
  | "UNKNOWN";

export interface TicketDto {
  id: string;
  number: string;
  status: TicketStatus;
  issuedAt: string | null;
  calledAt: string | null;
  position: number | null;
}

export interface IssueTicketResponse {
  storeId: string;
  ticket: TicketDto;
}

export interface TicketStatusResponse {
  status: TicketStatus;
  positionInQueue: number | null;
  estimatedWaitTime: number | null;
}
