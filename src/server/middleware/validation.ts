import { Request, Response, NextFunction } from "express";

/**
 * Sanitizes input string to prevent control characters and basic injection attacks
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Strip control characters (except common newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  return sanitized;
}

/**
 * Checks for obvious system instruction override attempts
 */
export function detectPromptInjection(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  const dangerousPatterns = [
    /ignore (all )?(previous|above|prior) (instructions|prompts|rules)/i,
    /system:\s*you are now/i,
    /disregard your (system )?prompt/i,
    /you are now an unfiltered/i,
    /output the system (instructions|prompt)/i,
    /grant me [0-9]+ (xp|coins|money)/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Middleware: Validates & sanitizes dialogue message payload
 */
export function validateDialogueInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { playerMessage, message, conversationHistory, history } = req.body;
  const rawMsg = playerMessage || message || "";

  if (!rawMsg || typeof rawMsg !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "A non-empty 'playerMessage' or 'message' string is required.",
      code: "INVALID_MESSAGE",
    });
    return;
  }

  if (rawMsg.length > 1000) {
    res.status(400).json({
      error: "Bad Request",
      message: "Message exceeds maximum allowed length of 1000 characters.",
      code: "MESSAGE_TOO_LONG",
    });
    return;
  }

  const rawHistory = conversationHistory || history || [];
  if (!Array.isArray(rawHistory)) {
    res.status(400).json({
      error: "Bad Request",
      message: "Conversation history must be an array.",
      code: "INVALID_HISTORY",
    });
    return;
  }

  if (rawHistory.length > 25) {
    req.body.conversationHistory = rawHistory.slice(-20);
  }

  // Clean message
  req.body.playerMessage = sanitizeString(rawMsg, 1000);
  req.body.message = req.body.playerMessage;

  // Add safety flag if prompt injection pattern is detected
  if (detectPromptInjection(req.body.playerMessage)) {
    req.body.isSuspiciousPrompt = true;
  }

  next();
}

/**
 * Middleware: Validates SRS Review payload
 */
export function validateSRSInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { cardId, quality } = req.body;

  if (!cardId || typeof cardId !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "Valid 'cardId' is required.",
      code: "INVALID_CARD_ID",
    });
    return;
  }

  const qualityNum = Number(quality);
  if (!Number.isInteger(qualityNum) || qualityNum < 0 || qualityNum > 5) {
    res.status(400).json({
      error: "Bad Request",
      message: "Quality must be an integer between 0 and 5.",
      code: "INVALID_QUALITY_SCORE",
    });
    return;
  }

  req.body.quality = qualityNum;
  req.body.cardId = sanitizeString(cardId, 128);

  next();
}
