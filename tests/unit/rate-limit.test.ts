import { describe, expect, it } from "vitest";
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit";

describe("rate limiting", () => {
  it("builds stable hashed keys without leaking raw identifiers", () => {
    const key = buildRateLimitKey(["13800000000", "127.0.0.1"]);

    expect(key).not.toContain("13800000000");
    expect(key).not.toContain("127.0.0.1");
    expect(key.split(":")).toHaveLength(2);
  });

  it("blocks after the configured in-memory limit", async () => {
    const key = `test:rate-limit:${Date.now()}:${Math.random()}`;

    const first = await rateLimit({ key, limit: 2, windowSeconds: 60 });
    const second = await rateLimit({ key, limit: 2, windowSeconds: 60 });
    const third = await rateLimit({ key, limit: 2, windowSeconds: 60 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
