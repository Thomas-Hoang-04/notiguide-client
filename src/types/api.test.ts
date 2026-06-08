import { describe, expect, it } from "vitest";
import {
  ApiError,
  NetworkError,
  NotFoundError,
  RateLimitError,
} from "@/types/api";

describe("api error classes", () => {
  it("ApiError carries its fields", () => {
    const e = new ApiError(400, "BAD_REQUEST", "bad", "/x");
    expect(e.code).toBe(400);
    expect(e.error).toBe("BAD_REQUEST");
    expect(e.message).toBe("bad");
    expect(e).toBeInstanceOf(Error);
  });

  it("NotFoundError and RateLimitError extend ApiError", () => {
    expect(new NotFoundError("nope")).toBeInstanceOf(ApiError);
    const rl = new RateLimitError("slow", 30);
    expect(rl).toBeInstanceOf(ApiError);
    expect(rl.retryAfterSeconds).toBe(30);
  });

  it("NetworkError is a plain Error", () => {
    expect(new NetworkError()).toBeInstanceOf(Error);
  });
});
