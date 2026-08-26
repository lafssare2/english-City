import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import crypto from "crypto";

/**
 * Structured request logger that sanitizes headers and logs metrics cleanly
 */
export function requestLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers["x-request-id"]?.toString() || `req_${crypto.randomUUID().slice(0, 8)}`;
  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const uid = req.user?.uid || "anonymous";

    // Format structured log entry
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs,
      uid,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"] ? req.headers["user-agent"].slice(0, 100) : undefined,
    };

    if (statusCode >= 500) {
      console.error(JSON.stringify({ level: "ERROR", ...logData }));
    } else if (statusCode >= 400) {
      console.warn(JSON.stringify({ level: "WARN", ...logData }));
    } else {
      console.log(JSON.stringify({ level: "INFO", ...logData }));
    }
  });

  next();
}
