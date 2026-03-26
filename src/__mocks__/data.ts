import type { TicketDto, TicketStatus } from "@/types/queue";
import type { StorePublicInfoResponse } from "@/types/store";

// ── Stores ──────────────────────────────────────────────────
export const STORES: Record<string, StorePublicInfoResponse> = {
  "s-001": {
    id: "s-001",
    name: "Downtown Branch",
    address: "123 Main St, Suite 200",
    isActive: true,
    queueState: "ACTIVE",
    maxQueueSize: 50,
  },
  "s-002": {
    id: "s-002",
    name: "Airport Terminal 3",
    address: "456 Airport Rd, Gate B12",
    isActive: true,
    queueState: "ACTIVE",
    maxQueueSize: 100,
  },
  "s-003": {
    id: "s-003",
    name: "Mall Kiosk",
    address: null,
    isActive: false,
    queueState: "ACTIVE",
    maxQueueSize: 20,
  },
  "s-004": {
    id: "s-004",
    name: "Central Station Hub",
    address: "789 Railway Ave",
    isActive: true,
    queueState: "PAUSED",
    maxQueueSize: 0,
  },
  "s-005": {
    id: "s-005",
    name: "City Hall Office",
    address: "1 Government Plaza",
    isActive: true,
    queueState: "ACTIVE",
    maxQueueSize: 5,
  },
};

// ── Queue sizes per store ───────────────────────────────────
export const QUEUE_SIZES: Record<string, number> = {
  "s-001": 7,
  "s-002": 3,
  "s-003": 0,
  "s-004": 12,
  "s-005": 5, // at max capacity
};

// ── Ticket counter per store ────────────────────────────────
const ticketCounters: Record<string, number> = {
  "s-001": 42,
  "s-002": 15,
  "s-003": 0,
  "s-004": 80,
  "s-005": 20,
};

// ── Existing tickets (mutable — status changes on poll) ─────
interface MockTicket {
  storeId: string;
  ticket: TicketDto;
  positionInQueue: number | null;
  estimatedWaitTime: number | null;
  pollCount: number;
  scenario: "waiting" | "called-soon" | "served-soon" | "skipped" | "requeued";
}

export const TICKETS: Record<string, MockTicket> = {};

export function issueTicket(storeId: string): {
  storeId: string;
  ticket: TicketDto;
} | null {
  const store = STORES[storeId];
  if (!store || !store.isActive) return null;

  // Check paused queue
  if (store.queueState === "PAUSED") return null;

  // Check max capacity
  const queueSize = QUEUE_SIZES[storeId] ?? 0;
  if (store.maxQueueSize > 0 && queueSize >= store.maxQueueSize) return null;

  const counter = (ticketCounters[storeId] ?? 0) + 1;
  ticketCounters[storeId] = counter;

  QUEUE_SIZES[storeId] = queueSize + 1;

  const ticketId = `t-${storeId}-${counter}`;
  const ticket: TicketDto = {
    id: ticketId,
    number: String(counter),
    status: "WAITING",
    issuedAt: new Date().toISOString(),
    calledAt: null,
    position: queueSize + 1,
  };

  // Cycle through scenarios so the user can see different states
  const scenarios: MockTicket["scenario"][] = [
    "waiting",
    "called-soon",
    "served-soon",
    "skipped",
    "requeued",
  ];
  const scenario = scenarios[counter % scenarios.length];

  TICKETS[ticketId] = {
    storeId,
    ticket,
    positionInQueue: queueSize + 1,
    estimatedWaitTime: (queueSize + 1) * 3,
    pollCount: 0,
    scenario,
  };

  return { storeId, ticket };
}

export function getTicketStatus(storeId: string, ticketId: string) {
  const mock = TICKETS[ticketId];
  if (!mock || mock.storeId !== storeId) return null;

  mock.pollCount++;

  // Simulate ticket lifecycle based on scenario
  if (mock.scenario === "called-soon" && mock.pollCount >= 3) {
    // After 3 polls (~15s), get called
    mock.ticket.status = "CALLED";
    mock.ticket.calledAt = new Date().toISOString();
    mock.positionInQueue = null;
    mock.estimatedWaitTime = null;
  } else if (mock.scenario === "served-soon" && mock.pollCount >= 3) {
    mock.ticket.status = "CALLED";
    mock.ticket.calledAt = new Date().toISOString();
    mock.positionInQueue = null;
    mock.estimatedWaitTime = null;
    if (mock.pollCount >= 6) {
      mock.ticket.status = "SERVED";
    }
  } else if (mock.scenario === "skipped" && mock.pollCount >= 4) {
    // After 4 polls, get called then skipped (no-show)
    if (mock.pollCount < 6) {
      mock.ticket.status = "CALLED";
      mock.ticket.calledAt = new Date().toISOString();
      mock.positionInQueue = null;
      mock.estimatedWaitTime = null;
    } else {
      mock.ticket.status = "SKIPPED";
      mock.positionInQueue = null;
      mock.estimatedWaitTime = null;
    }
  } else if (mock.scenario === "requeued" && mock.pollCount >= 3) {
    // After 3 polls, get called, then requeued back to position 2
    if (mock.pollCount < 5) {
      mock.ticket.status = "CALLED";
      mock.ticket.calledAt = new Date().toISOString();
      mock.positionInQueue = null;
      mock.estimatedWaitTime = null;
    } else if (mock.pollCount < 8) {
      mock.ticket.status = "REQUEUED";
      mock.ticket.calledAt = null;
      mock.positionInQueue = 2;
      mock.estimatedWaitTime = 6;
    } else {
      // Eventually get called again and served
      mock.ticket.status = "CALLED";
      mock.ticket.calledAt = new Date().toISOString();
      mock.positionInQueue = null;
      mock.estimatedWaitTime = null;
      if (mock.pollCount >= 10) {
        mock.ticket.status = "SERVED";
      }
    }
  } else if (mock.scenario === "waiting" && mock.positionInQueue !== null) {
    // Slowly decrement position
    if (mock.pollCount % 4 === 0 && mock.positionInQueue > 1) {
      mock.positionInQueue--;
      mock.estimatedWaitTime = mock.positionInQueue * 3;
    }
  }

  return {
    status: mock.ticket.status as TicketStatus,
    positionInQueue: mock.positionInQueue,
    estimatedWaitTime: mock.estimatedWaitTime,
  };
}

export function cancelTicket(storeId: string, ticketId: string): boolean {
  const mock = TICKETS[ticketId];
  if (!mock || mock.storeId !== storeId) return false;

  mock.ticket.status = "CANCELLED";
  mock.positionInQueue = null;
  mock.estimatedWaitTime = null;

  const queueSize = QUEUE_SIZES[storeId] ?? 0;
  if (queueSize > 0) {
    QUEUE_SIZES[storeId] = queueSize - 1;
  }

  return true;
}
