import type { RequestHandler } from "express";
import { mcpConfig } from "../config/mcp-config.js";
import { AuthError } from "./local-auth.js";

/** Static Bearer auth for local development when OAuth is disabled. */
export function createStaticBearerMiddleware(token?: string | null): RequestHandler | null {
  const expected = token ?? mcpConfig.authToken;
  if (!expected) return null;

  return (req, res, next) => {
    try {
      validateStaticBearer(req.headers.authorization, expected);
      next();
    } catch (err) {
      const message = err instanceof AuthError ? err.message : "Unauthorized";
      res.status(401).json({ error: "Unauthorized", message });
    }
  };
}

export function validateStaticBearer(authHeader: string | undefined, expected: string): void {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing Bearer token");
  }

  const token = authHeader.slice("Bearer ".length);
  if (token !== expected) {
    throw new AuthError("Invalid Bearer token");
  }
}
