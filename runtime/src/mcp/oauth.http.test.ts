import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { loadOauthHttpConfig } from "./auth/oauth-config.js";
import { createHttpMcpApp, clearSessionsForTests } from "./http/app.js";

const ISSUER = "http://127.0.0.1:3021";
const RESOURCE = `${ISSUER}/mcp`;
const ADMIN_PASSWORD = "test-admin-password";
const SESSION_SECRET = "test-session-secret-at-least-32-characters-long";

function pkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function extractCookies(response: Response): string {
  const headers = response.headers.getSetCookie?.() ?? [];
  if (headers.length === 0) {
    const single = response.headers.get("set-cookie");
    return single ?? "";
  }
  return headers.map((value) => value.split(";")[0]).join("; ");
}

function mergeCookies(existing: string, incoming: string): string {
  const jar = new Map<string, string>();
  for (const source of [existing, incoming]) {
    if (!source) continue;
    for (const part of source.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [name, ...rest] = trimmed.split("=");
      jar.set(name, rest.join("="));
    }
  }
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function registerPublicClient(baseUrl: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "test-client",
      redirect_uris: ["http://127.0.0.1:8765/callback"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    }),
  });
  assert.equal(response.status, 201);
  return (await response.json()) as { client_id: string };
}

function buildAuthorizeUrl(baseUrl: string, clientId: string, challenge: string) {
  const authorizeUrl = new URL(`${baseUrl}/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", "http://127.0.0.1:8765/callback");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("resource", RESOURCE);
  return authorizeUrl;
}

async function completeAuthorizedFlow(
  baseUrl: string,
  fetchImpl: typeof fetch,
  password = ADMIN_PASSWORD
) {
  const { client_id } = await registerPublicClient(baseUrl, fetchImpl);
  const { verifier, challenge } = pkcePair();
  const redirectUri = "http://127.0.0.1:8765/callback";

  const authorizeResponse = await fetchImpl(buildAuthorizeUrl(baseUrl, client_id, challenge), {
    redirect: "manual",
  });
  assert.equal(authorizeResponse.status, 302);
  assert.equal(new URL(authorizeResponse.headers.get("location")!, baseUrl).pathname, "/oauth/login");

  let cookies = extractCookies(authorizeResponse);
  const loginResponse = await fetchImpl(`${baseUrl}/oauth/login`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: new URLSearchParams({ password }),
  });

  cookies = mergeCookies(cookies, extractCookies(loginResponse));
  assert.equal(loginResponse.status, 302);
  const loginLocation = loginResponse.headers.get("location");
  assert.ok(loginLocation);
  const code = new URL(loginLocation!, baseUrl).searchParams.get("code");
  assert.ok(code);

  const tokenResponse = await fetchImpl(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id,
      code: code!,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      resource: RESOURCE,
    }),
  });
  assert.equal(tokenResponse.status, 200);
  return {
    client_id,
    verifier,
    redirectUri,
    cookies,
    tokenBody: (await tokenResponse.json()) as { access_token: string; token_type: string },
  };
}

async function withServer(
  run: (baseUrl: string, fetchImpl: typeof fetch) => Promise<void>,
  configOverrides: Parameters<typeof createHttpMcpApp>[0] = {}
): Promise<void> {
  clearSessionsForTests();
  const { app } = createHttpMcpApp({
    oauthEnabled: true,
    issuerUrl: new URL(ISSUER),
    resourceUrl: new URL(RESOURCE),
    disableRateLimit: true,
    adminPassword: ADMIN_PASSWORD,
    sessionSecret: SESSION_SECRET,
    ...configOverrides,
  });

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl, fetch);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("protected resource metadata is served at /.well-known/oauth-protected-resource/mcp", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/.well-known/oauth-protected-resource/mcp`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      resource: string;
      authorization_servers: string[];
    };
    assert.equal(body.resource, RESOURCE);
    assert.equal(new URL(body.authorization_servers[0]).href, new URL(ISSUER).href);
  });
});

test("authorization server metadata is served at /.well-known/oauth-authorization-server", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/.well-known/oauth-authorization-server`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      issuer: string;
      authorization_endpoint: string;
      token_endpoint: string;
      registration_endpoint: string;
      code_challenge_methods_supported: string[];
    };
    assert.equal(new URL(body.issuer).href, new URL(ISSUER).href);
    assert.match(body.authorization_endpoint, /\/authorize$/);
    assert.match(body.token_endpoint, /\/token$/);
    assert.match(body.registration_endpoint, /\/register$/);
    assert.deepEqual(body.code_challenge_methods_supported, ["S256"]);
  });
});

test("dynamic client registration accepts public clients", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const body = await registerPublicClient(baseUrl, fetchImpl);
    assert.ok(body.client_id);
  });
});

test("unauthenticated /authorize cannot issue a code", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const { client_id } = await registerPublicClient(baseUrl, fetchImpl);
    const { challenge } = pkcePair();

    const response = await fetchImpl(buildAuthorizeUrl(baseUrl, client_id, challenge), {
      redirect: "manual",
    });

    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get("location")!, baseUrl).pathname, "/oauth/login");
    assert.equal(response.headers.get("location")!.includes("code="), false);
  });
});

test("wrong password cannot issue a code", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const { client_id } = await registerPublicClient(baseUrl, fetchImpl);
    const { challenge } = pkcePair();

    const authorizeResponse = await fetchImpl(buildAuthorizeUrl(baseUrl, client_id, challenge), {
      redirect: "manual",
    });
    const cookies = extractCookies(authorizeResponse);

    const loginResponse = await fetchImpl(`${baseUrl}/oauth/login`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
      body: new URLSearchParams({ password: "wrong-password" }),
    });

    assert.equal(loginResponse.status, 401);
    assert.match(await loginResponse.text(), /Invalid credentials/);
    assert.equal(loginResponse.headers.get("location"), null);
  });
});

test("correct password completes authorization and token exchange works afterward", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const { tokenBody } = await completeAuthorizedFlow(baseUrl, fetchImpl);
    assert.equal(tokenBody.token_type, "Bearer");
    assert.ok(tokenBody.access_token);
  });
});

test("oauth parameters cannot be tampered with during login", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const firstClient = await registerPublicClient(baseUrl, fetchImpl);
    const secondClient = await registerPublicClient(baseUrl, fetchImpl);
    const { verifier, challenge } = pkcePair();

    const authorizeResponse = await fetchImpl(
      buildAuthorizeUrl(baseUrl, firstClient.client_id, challenge),
      { redirect: "manual" }
    );
    const cookies = extractCookies(authorizeResponse);

    const loginResponse = await fetchImpl(`${baseUrl}/oauth/login`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
      body: new URLSearchParams({ password: ADMIN_PASSWORD }),
    });

    assert.equal(loginResponse.status, 302);
    const location = new URL(loginResponse.headers.get("location")!, baseUrl);
    const code = location.searchParams.get("code");
    assert.ok(code);

    const wrongClientToken = await fetchImpl(`${baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: secondClient.client_id,
        code: code!,
        code_verifier: verifier,
        redirect_uri: "http://127.0.0.1:8765/callback",
        resource: RESOURCE,
      }),
    });
    assert.notEqual(wrongClientToken.status, 200);

    const validToken = await fetchImpl(`${baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: firstClient.client_id,
        code: code!,
        code_verifier: verifier,
        redirect_uri: "http://127.0.0.1:8765/callback",
        resource: RESOURCE,
      }),
    });
    assert.equal(validToken.status, 200);
  });
});

test("unauthenticated MCP requests return 401 with WWW-Authenticate metadata", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    assert.equal(response.status, 401);
    const wwwAuth = response.headers.get("www-authenticate");
    assert.ok(wwwAuth);
    assert.match(wwwAuth!, /resource_metadata="/);
  });
});

test("authenticated MCP initialize succeeds", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const { tokenBody } = await completeAuthorizedFlow(baseUrl, fetchImpl);

    const mcpResponse = await fetchImpl(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${tokenBody.access_token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    assert.equal(mcpResponse.status, 200);
    assert.match(mcpResponse.headers.get("content-type") ?? "", /text\/event-stream/);
  });
});

test("health remains public when OAuth is enabled", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; oauthEnabled: boolean };
    assert.equal(body.status, "ok");
    assert.equal(body.oauthEnabled, true);
  });
});

test("missing OAuth secrets fail startup", () => {
  assert.throws(
    () =>
      loadOauthHttpConfig({
        oauthEnabled: true,
        issuerUrl: new URL(ISSUER),
        resourceUrl: new URL(RESOURCE),
        adminPassword: null,
        sessionSecret: SESSION_SECRET,
      }),
    /APEXOS_MCP_ADMIN_PASSWORD is required/
  );

  assert.throws(
    () =>
      loadOauthHttpConfig({
        oauthEnabled: true,
        issuerUrl: new URL(ISSUER),
        resourceUrl: new URL(RESOURCE),
        adminPassword: ADMIN_PASSWORD,
        sessionSecret: null,
      }),
    /APEXOS_MCP_SESSION_SECRET is required/
  );
});
