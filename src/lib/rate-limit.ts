import Redis from "ioredis";
import { createHash } from "node:crypto";
import { getRedisUrl, isProduction } from "@/lib/runtime-config";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = getRedisUrl();
  if (!url) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  redisClient.on("error", (error) => {
    if (isProduction()) {
      console.error("Redis rate limiter error", error);
    }
  });

  return redisClient;
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export function buildRateLimitKey(parts: Array<string | number | undefined | null>) {
  return parts
    .filter((part) => part !== undefined && part !== null && String(part).length > 0)
    .map((part) => hashKey(String(part)))
    .join(":");
}

async function memoryRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + options.windowSeconds * 1000;
  const current = memoryStore.get(options.key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(options.key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, options.limit - 1), resetSeconds: options.windowSeconds };
  }

  current.count += 1;
  const remaining = Math.max(0, options.limit - current.count);
  return {
    allowed: current.count <= options.limit,
    remaining,
    resetSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return memoryRateLimit(options);
  }

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    const count = await redis.incr(options.key);
    if (count === 1) {
      await redis.expire(options.key, options.windowSeconds);
    }

    const ttl = await redis.ttl(options.key);
    return {
      allowed: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      resetSeconds: ttl > 0 ? ttl : options.windowSeconds,
    };
  } catch (error) {
    if (isProduction()) {
      throw error;
    }

    return memoryRateLimit(options);
  }
}
