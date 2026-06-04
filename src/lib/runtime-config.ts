const weakSecrets = new Set(["", "change-me", "changeme", "dev-secret", "test-secret", "your-secret"]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getSessionSecret() {
  return process.env.JWT_SECRET ?? "";
}

export function shouldUseSecureCookies() {
  const explicit = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  const appUrl = process.env.APP_URL?.trim() ?? "";

  if (appUrl) {
    return appUrl.toLowerCase().startsWith("https://");
  }

  return isProduction();
}

export function isMockSmsEnabled() {
  return process.env.MOCK_SMS !== "false";
}

export function getRedisUrl() {
  return process.env.REDIS_URL ?? "";
}

export function validateProductionRuntimeConfig() {
  if (!isProduction()) {
    return {
      ok: true as const,
    };
  }

  const errors: string[] = [];
  const sessionSecret = getSessionSecret();

  if (sessionSecret.length < 32 || weakSecrets.has(sessionSecret.toLowerCase())) {
    errors.push("JWT_SECRET must be replaced with a strong production secret of at least 32 characters.");
  }

  if (isMockSmsEnabled()) {
    errors.push("MOCK_SMS must be set to false in production.");
  }

  if (!getRedisUrl()) {
    errors.push("REDIS_URL must be configured in production for rate limiting.");
  }

  if (errors.length > 0) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
  };
}

export function assertProductionRuntimeConfig() {
  const result = validateProductionRuntimeConfig();

  if (!result.ok) {
    throw new Error(result.errors.join(" "));
  }
}
