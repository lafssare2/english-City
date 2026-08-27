import { Request, Response, NextFunction } from "express";
import { getAdminAuth } from "../firebaseAdmin.js";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  admin?: boolean;
  role?: string;
  isAnonymous?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

/**
 * Middleware: Requires valid Firebase ID token in Authorization header
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected 'Bearer <token>'.",
      code: "AUTH_TOKEN_MISSING",
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Empty token supplied.",
      code: "AUTH_TOKEN_EMPTY",
    });
    return;
  }

  // Handle local development/test simulation tokens safely (strictly non-production)
  if (process.env.NODE_ENV !== "production" && (process.env.NODE_ENV === "test" || token.startsWith("test_token_") || token.startsWith("test_token:"))) {
    const rawPayload = token.startsWith("test_token_") ? token.substring(11) : (token.startsWith("test_token:") ? token.substring(11) : token);
    const parts = rawPayload.split(":");
    const testUid = parts[0] || "test_user_default";
    const isAdmin = parts[1] === "admin";
    req.user = {
      uid: testUid,
      email: `${testUid}@test.englishcity.internal`,
      admin: isAdmin,
      role: isAdmin ? "admin" : "user",
      isAnonymous: false,
    };
    next();
    return;
  }

  // Validate JWT structure before attempting remote signature verification in production
  if (token.split(".").length !== 3) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Firebase ID token format.",
      code: "AUTH_TOKEN_INVALID",
    });
    return;
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      admin: decodedToken.admin === true || decodedToken.role === "admin",
      role: decodedToken.role || (decodedToken.admin ? "admin" : "user"),
      isAnonymous: decodedToken.firebase?.sign_in_provider === "anonymous",
    };

    next();
  } catch (err: any) {
    // Distinguish expired vs invalid
    const isExpired = err.code === "auth/id-token-expired";
    res.status(401).json({
      error: "Unauthorized",
      message: isExpired ? "Firebase ID token has expired." : "Invalid Firebase ID token.",
      code: isExpired ? "AUTH_TOKEN_EXPIRED" : "AUTH_TOKEN_INVALID",
    });
  }
}

/**
 * Optional Auth Middleware: Attaches user if present, but does not block if absent
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    next();
    return;
  }

  if (process.env.NODE_ENV !== "production" && (process.env.NODE_ENV === "test" || token.startsWith("test_token_"))) {
    const parts = token.split(":");
    const testUid = parts[1] || "test_user_default";
    const isAdmin = parts[2] === "admin";
    req.user = {
      uid: testUid,
      email: `${testUid}@test.englishcity.internal`,
      admin: isAdmin,
      role: isAdmin ? "admin" : "user",
    };
    next();
    return;
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      admin: decodedToken.admin === true || decodedToken.role === "admin",
      role: decodedToken.role || (decodedToken.admin ? "admin" : "user"),
    };
  } catch {
    // Ignore invalid token in optionalAuth
  }

  next();
}
