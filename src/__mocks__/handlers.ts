import {
  cancelTicket,
  getTicketStatus,
  issueTicket,
  QUEUE_SIZES,
  STORES,
} from "./data";

type MockResponse = { status: number; body?: unknown };

// Simulate network delay (ms)
const DELAY = 200;

function json(body: unknown, status = 200): MockResponse {
  return { status, body };
}

function noContent(): MockResponse {
  return { status: 204 };
}

function notFound(entity: string, path: string): MockResponse {
  return {
    status: 404,
    body: {
      timestamp: new Date().toISOString(),
      code: 404,
      error: "Not Found",
      message: `${entity} not found`,
      path,
      method: "GET",
    },
  };
}

function badRequest(message: string, path: string): MockResponse {
  return {
    status: 400,
    body: {
      timestamp: new Date().toISOString(),
      code: 400,
      error: "Bad Request",
      message,
      path,
      method: "POST",
    },
  };
}

export function handleRequest(
  method: string,
  path: string,
): MockResponse | null {
  const pathname = new URL(path, "http://localhost").pathname;

  // GET /api/queue/public/{storeId}/info
  const infoMatch = pathname.match(/^\/api\/queue\/public\/([^/]+)\/info$/);
  if (method === "GET" && infoMatch) {
    const store = STORES[infoMatch[1]];
    return store ? json(store) : notFound("Store", pathname);
  }

  // GET /api/queue/public/{storeId}/size
  const sizeMatch = pathname.match(/^\/api\/queue\/public\/([^/]+)\/size$/);
  if (method === "GET" && sizeMatch) {
    const storeId = sizeMatch[1];
    if (!STORES[storeId]) return notFound("Store", pathname);
    return json({ queueSize: QUEUE_SIZES[storeId] ?? 0 });
  }

  // POST /api/queue/public/{storeId}/tickets — join queue
  const joinMatch = pathname.match(/^\/api\/queue\/public\/([^/]+)\/tickets$/);
  if (method === "POST" && joinMatch) {
    const storeId = joinMatch[1];
    const store = STORES[storeId];
    if (!store) return notFound("Store", pathname);

    // Check paused
    if (store.queueState === "PAUSED") {
      return badRequest("Queue is currently paused", pathname);
    }

    // Check full
    const queueSize = QUEUE_SIZES[storeId] ?? 0;
    if (store.maxQueueSize > 0 && queueSize >= store.maxQueueSize) {
      return badRequest("Queue is full", pathname);
    }

    const result = issueTicket(storeId);
    if (!result) return notFound("Store", pathname);
    return json(result, 201);
  }

  // GET /api/queue/public/{storeId}/tickets/{ticketId} — poll status
  const statusMatch = pathname.match(
    /^\/api\/queue\/public\/([^/]+)\/tickets\/([^/]+)$/,
  );
  if (method === "GET" && statusMatch) {
    const result = getTicketStatus(statusMatch[1], statusMatch[2]);
    if (!result) return notFound("Ticket", pathname);
    return json(result);
  }

  // POST /api/queue/public/{storeId}/tickets/{ticketId}/cancel
  const cancelMatch = pathname.match(
    /^\/api\/queue\/public\/([^/]+)\/tickets\/([^/]+)\/cancel$/,
  );
  if (method === "POST" && cancelMatch) {
    const success = cancelTicket(cancelMatch[1], cancelMatch[2]);
    if (!success) return notFound("Ticket", pathname);
    return noContent();
  }

  // POST /api/queue/public/{storeId}/tickets/{ticketId}/fcm-token
  const fcmMatch = pathname.match(
    /^\/api\/queue\/public\/([^/]+)\/tickets\/([^/]+)\/fcm-token$/,
  );
  if (method === "POST" && fcmMatch) {
    // Silently accept — FCM token registration in mock mode is a no-op
    return noContent();
  }

  // No match — pass through
  return null;
}

export { DELAY };
