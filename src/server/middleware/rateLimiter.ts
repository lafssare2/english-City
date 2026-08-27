import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired keys periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyPrefix?: string;
}

/**
 * Creates a rate limiter middleware for endpoints
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60000,
    maxRequests = 60,
    message = "Too many requests. Please slow down.",
    keyPrefix = "general",
  } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const identifier = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown_client";
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSec = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSec);

    if (record.count > maxRequests) {
      res.status(429).json({
        error: "Too Many Requests",
        message,
        retryAfterSec: resetSec,
        code: "RATE_LIMIT_EXCEEDED",
      });
      return;
    }

    next();
  };
}

export const generalRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 120,
  keyPrefix: "gen",
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  keyPrefix: "ai",
  message: "AI conversational quota reached for this minute. Please wait a moment before sending another message.",
});

export const authSensitiveLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 20,
  keyPrefix: "auth",
});
