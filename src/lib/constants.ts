export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const POLLING_INTERVALS = {
  DEFAULT: 5000,
  NEAR_FRONT: 3000,
  CALLED: 10000,
  QUEUE_SIZE: 15000,
} as const;

export const NEAR_FRONT_THRESHOLD = 3;

export const ERROR_BACKOFF = {
  INITIAL: 5000,
  MULTIPLIER: 2,
  MAX: 30000,
  MAX_CONSECUTIVE_ERRORS: 3,
} as const;

export const TICKET_STORAGE_PREFIX = "notiguide-ticket-";

export const REQUEST_TIMEOUT = 10000;

export const VIBRATION_PATTERNS = {
  CALLED: [200, 100, 200, 100, 400],
  JOIN_SUCCESS: [100],
} as const;
