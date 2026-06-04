import { afterEach, describe, expect, it, vi } from "vitest";
import { createRawSessionToken, hashValue, isValidPhone, maskPhone, sessionCookieOptions, verifyHash } from "@/lib/auth";
import { validateProductionRuntimeConfig } from "@/lib/runtime-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth helpers", () => {
  it("validates mainland China mobile numbers", () => {
    expect(isValidPhone("13800000001")).toBe(true);
    expect(isValidPhone("12800000001")).toBe(false);
    expect(isValidPhone("1380000000")).toBe(false);
  });

  it("masks phone numbers for display", () => {
    expect(maskPhone("13800000001")).toBe("138****0001");
  });

  it("hashes and verifies session-like secrets", () => {
    const token = createRawSessionToken();
    const hash = hashValue(token);

    expect(verifyHash(token, hash)).toBe(true);
    expect(verifyHash(`${token}x`, hash)).toBe(false);
  });

  it("marks cookies secure for HTTPS deployments unless explicitly overridden", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://example.com");
    expect(sessionCookieOptions(60).secure).toBe(true);

    vi.stubEnv("APP_URL", "http://example.com");
    expect(sessionCookieOptions(60).secure).toBe(false);

    vi.stubEnv("COOKIE_SECURE", "true");
    expect(sessionCookieOptions(60).secure).toBe(true);

    vi.stubEnv("COOKIE_SECURE", "false");
    expect(sessionCookieOptions(60).secure).toBe(false);
  });

  it("rejects unsafe production auth configuration", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MOCK_SMS", "true");
    vi.stubEnv("JWT_SECRET", "change-me");

    expect(validateProductionRuntimeConfig()).toEqual({
      ok: false,
      errors: [
        "JWT_SECRET must be replaced with a strong production secret of at least 32 characters.",
        "MOCK_SMS must be set to false in production.",
        "REDIS_URL must be configured in production for rate limiting.",
      ],
    });
  });

  it("accepts production auth configuration when mock SMS is disabled and secret is strong", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MOCK_SMS", "false");
    vi.stubEnv("JWT_SECRET", "a-production-secret-with-more-than-32-characters");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379");

    expect(validateProductionRuntimeConfig()).toEqual({ ok: true });
  });
});
