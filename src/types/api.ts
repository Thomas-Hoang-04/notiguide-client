export interface ErrorResponse {
  timestamp: string;
  code: number;
  error: string;
  message: string;
  path: string;
  method: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public code: number,
    public error: string,
    message: string,
    public path?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, path?: string) {
    super(404, "Not Found", message, path);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string,
    public retryAfterSeconds: number,
    path?: string,
  ) {
    super(429, "Too Many Requests", message, path);
    this.name = "RateLimitError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}
