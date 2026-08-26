import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { getAdminFirestore } from "../firebaseAdmin.js";

/**
 * Middleware: Requires Admin role/claim
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.user.uid) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required to access administrative resources.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  // 1. Check custom claim on decoded token
  if (req.user.admin === true || req.user.role === "admin") {
    next();
    return;
  }

  // 2. Check Firestore /admins/{uid} collection as persistent authorization fallback
  try {
    const db = getAdminFirestore();
    const adminDoc = await db.collection("admins").doc(req.user.uid).get();
    if (adminDoc.exists && adminDoc.data()?.active !== false) {
      req.user.admin = true;
      req.user.role = "admin";
      next();
      return;
    }
  } catch (err) {
    console.warn("Error checking admin collection:", err);
  }

  // 3. Reject with HTTP 403 Forbidden
  res.status(403).json({
    error: "Forbidden",
    message: "User does not have administrative privileges.",
    code: "ADMIN_ACCESS_DENIED",
  });
}
