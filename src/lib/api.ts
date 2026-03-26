import type { ErrorResponse } from "@/types/api";
import {
  ApiError,
  NetworkError,
  NotFoundError,
  RateLimitError,
} from "@/types/api";
import { API_BASE_URL, REQUEST_TIMEOUT } from "./constants";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { expectNoContent?: boolean },
): Promise<T> {
  const { expectNoContent, ...fetchOptions } = options ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions?.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NetworkError("Request timed out");
    }
    if (err instanceof TypeError) {
      throw new NetworkError("Connection failed");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (response.ok) {
    if (expectNoContent || response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  if (response.status === 404) {
    throw new NotFoundError("Resource not found", path);
  }

  if (response.status === 429) {
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    const retryAfter = resetHeader
      ? Math.max(0, Math.ceil(Number(resetHeader) - Date.now() / 1000))
      : 60;
    throw new RateLimitError("Too many requests", retryAfter, path);
  }

  let errorBody: ErrorResponse | undefined;
  try {
    errorBody = (await response.json()) as ErrorResponse;
  } catch {
    // Response body is not JSON
  }

  throw new ApiError(
    response.status,
    errorBody?.error ?? response.statusText,
    errorBody?.message ?? "An error occurred",
    path,
  );
}
