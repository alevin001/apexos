import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

export const ADMIN_SESSION_COOKIE = "apexos_mcp_admin";
const DEFAULT_TTL_SECONDS = 900;

export interface AdminSessionConfig {
  secret: string;
  ttlSeconds: number;
  secureCookie: boolean;
}

interface SessionPayload {
  sub: "admin";
  iat: number;
  exp: number;
}

export function verifyAdminPassword(
  provided: string,
  expected: string
): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function createAdminSessionToken(config: AdminSessionConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + config.ttlSeconds,
  };
  return signPayload(payload, config.secret);
}

export function parseAdminSession(
  req: Request,
  config: AdminSessionConfig
): SessionPayload | null {
  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) return null;
  return verifySignedPayload<SessionPayload>(token, config.secret, (payload) => {
    if (payload.sub !== "admin") return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  });
}

export function setAdminSessionCookie(
  res: Response,
  config: AdminSessionConfig
): void {
  const token = createAdminSessionToken(config);
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: "lax",
    maxAge: config.ttlSeconds * 1000,
    path: "/",
  });
}

export function createAdminSessionConfig(
  secret: string,
  issuerUsesHttps: boolean,
  ttlSeconds = DEFAULT_TTL_SECONDS
): AdminSessionConfig {
  return {
    secret,
    ttlSeconds,
    secureCookie: issuerUsesHttps,
  };
}

export function signValue(value: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function verifySignedValue(value: string, secret: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  return payload;
}

function signPayload(payload: SessionPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return signValue(encoded, secret);
}

function verifySignedPayload<T>(
  token: string,
  secret: string,
  validate: (payload: T) => T | null
): T | null {
  const encoded = verifySignedValue(token, secret);
  if (!encoded) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as T;
    return validate(payload);
  } catch {
    return null;
  }
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

export function createPendingId(): string {
  return randomBytes(16).toString("base64url");
}
