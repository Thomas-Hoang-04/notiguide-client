"use client";

import { DELAY, handleRequest } from "./handlers";

// Patch fetch at module-load time (before any useEffect runs)
if (typeof window !== "undefined") {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();

    // Only intercept API calls
    if (!url.includes("/api/")) {
      return originalFetch(input, init);
    }

    const method = init?.method?.toUpperCase() ?? "GET";
    const path = url.replace(/^https?:\/\/[^/]+/, ""); // strip origin

    const result = handleRequest(method, path);

    // Not handled — pass through to real server
    if (!result) {
      return originalFetch(input, init);
    }

    // Simulate network latency
    await new Promise((r) => setTimeout(r, DELAY));

    const responseBody =
      result.body !== undefined ? JSON.stringify(result.body) : null;

    return new Response(responseBody, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  };

  console.log(
    "%c[MOCK] API mocking active — all /api/* calls are intercepted",
    "color: #f97316; font-weight: bold",
  );
}

// Render nothing — this component exists only to trigger the module side-effect
export function MockInit() {
  return null;
}
