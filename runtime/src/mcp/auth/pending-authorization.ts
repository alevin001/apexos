import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { Request, Response } from "express";
import {
  createPendingId,
  readCookie,
  signValue,
  verifySignedValue,
  type AdminSessionConfig,
} from "./admin-session.js";

export const PENDING_AUTH_COOKIE = "apexos_mcp_pending";

export interface PendingAuthorization {
  pendingId: string;
  clientId: string;
  redirectUri: string;
  params: AuthorizationParams;
  expiresAt: number;
}

const pendingAuthorizations = new Map<string, PendingAuthorization>();

const DEFAULT_PENDING_TTL_MS = 10 * 60 * 1000;

export function storePendingAuthorization(
  client: OAuthClientInformationFull,
  params: AuthorizationParams,
  ttlMs = DEFAULT_PENDING_TTL_MS
): PendingAuthorization {
  const pendingId = createPendingId();
  const record: PendingAuthorization = {
    pendingId,
    clientId: client.client_id,
    redirectUri: params.redirectUri,
    params,
    expiresAt: Date.now() + ttlMs,
  };
  pendingAuthorizations.set(pendingId, record);
  pruneExpiredPending();
  return record;
}

export function setPendingAuthorizationCookie(
  res: Response,
  pendingId: string,
  config: AdminSessionConfig
): void {
  const signed = signValue(pendingId, config.secret);
  res.cookie(PENDING_AUTH_COOKIE, signed, {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
}

export function consumePendingAuthorization(
  req: Request,
  config: AdminSessionConfig
): PendingAuthorization | null {
  const signed = readCookie(req, PENDING_AUTH_COOKIE);
  if (!signed) return null;

  const pendingId = verifySignedValue(signed, config.secret);
  if (!pendingId) return null;

  const record = pendingAuthorizations.get(pendingId);
  pendingAuthorizations.delete(pendingId);
  if (!record || record.expiresAt < Date.now()) {
    return null;
  }
  return record;
}

export function clearPendingAuthorizationCookie(res: Response, secure: boolean): void {
  res.clearCookie(PENDING_AUTH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
}

export function clearPendingAuthorizationsForTests(): void {
  pendingAuthorizations.clear();
}

function pruneExpiredPending(): void {
  const now = Date.now();
  for (const [id, record] of pendingAuthorizations) {
    if (record.expiresAt < now) {
      pendingAuthorizations.delete(id);
    }
  }
}
