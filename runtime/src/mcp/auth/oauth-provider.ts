import { randomUUID } from "node:crypto";
import type { Response } from "express";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { InvalidRequestError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { checkResourceAllowed } from "@modelcontextprotocol/sdk/shared/auth-utils.js";

interface AuthorizationCodeRecord {
  client: OAuthClientInformationFull;
  params: AuthorizationParams;
}

interface AccessTokenRecord {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt: number;
  resource?: URL;
}

export class ApexOsOAuthClientsStore implements OAuthRegisteredClientsStore {
  private readonly clients = new Map<string, OAuthClientInformationFull>();

  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    return this.clients.get(clientId);
  }

  async registerClient(client: OAuthClientInformationFull): Promise<OAuthClientInformationFull> {
    this.clients.set(client.client_id, client);
    return client;
  }
}

export class ApexOsOAuthProvider implements OAuthServerProvider {
  readonly clientsStore = new ApexOsOAuthClientsStore();
  private readonly codes = new Map<string, AuthorizationCodeRecord>();
  private readonly tokens = new Map<string, AccessTokenRecord>();

  constructor(private readonly configuredResourceUrl: URL) {}

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    if (!client.redirect_uris.some((uri) => redirectUriMatches(params.redirectUri, uri))) {
      throw new InvalidRequestError("Unregistered redirect_uri");
    }

    if (
      params.resource &&
      !checkResourceAllowed({
        requestedResource: params.resource,
        configuredResource: this.configuredResourceUrl,
      })
    ) {
      throw new InvalidRequestError("Invalid resource parameter");
    }

    const code = randomUUID();
    this.codes.set(code, { client, params });

    const targetUrl = new URL(params.redirectUri);
    targetUrl.searchParams.set("code", code);
    if (params.state !== undefined) {
      targetUrl.searchParams.set("state", params.state);
    }

    res.redirect(targetUrl.toString());
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const codeData = this.codes.get(authorizationCode);
    if (!codeData) {
      throw new Error("Invalid authorization code");
    }
    return codeData.params.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const codeData = this.codes.get(authorizationCode);
    if (!codeData) {
      throw new Error("Invalid authorization code");
    }
    if (codeData.client.client_id !== client.client_id) {
      throw new Error("Authorization code was not issued to this client");
    }
    if (
      resource &&
      !checkResourceAllowed({
        requestedResource: resource,
        configuredResource: this.configuredResourceUrl,
      })
    ) {
      throw new Error("Invalid resource parameter");
    }

    this.codes.delete(authorizationCode);

    const token = randomUUID();
    const scopes = codeData.params.scopes ?? [];
    const expiresAt = Date.now() + 3600 * 1000;

    this.tokens.set(token, {
      token,
      clientId: client.client_id,
      scopes,
      expiresAt,
      resource: resource ?? codeData.params.resource,
    });

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
      scope: scopes.join(" "),
    };
  }

  async exchangeRefreshToken(): Promise<OAuthTokens> {
    throw new Error("Refresh tokens are not supported");
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const tokenData = this.tokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token");
    }

    return {
      token,
      clientId: tokenData.clientId,
      scopes: tokenData.scopes,
      expiresAt: Math.floor(tokenData.expiresAt / 1000),
      resource: tokenData.resource,
    };
  }
}

function redirectUriMatches(requested: string, registered: string): boolean {
  if (requested === registered) return true;

  try {
    const req = new URL(requested);
    const reg = new URL(registered);
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (!loopback.has(req.hostname) || !loopback.has(reg.hostname)) {
      return false;
    }
    return (
      req.protocol === reg.protocol &&
      req.hostname === reg.hostname &&
      req.pathname === reg.pathname &&
      req.search === reg.search
    );
  } catch {
    return false;
  }
}
