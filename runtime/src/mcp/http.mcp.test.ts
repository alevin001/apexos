import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { MCP_VERSION } from "./config/mcp-config.js";
import { createHttpMcpApp, clearSessionsForTests } from "./http/app.js";
import {
  assertLoopbackHost,
  isLoopbackHost,
  MCP_HTTP_HOST,
} from "./http/loopback-host.js";

async function withServer(
  run: (baseUrl: string, fetchImpl: typeof fetch) => Promise<void>
): Promise<void> {
  clearSessionsForTests();
  const { app, host } = createHttpMcpApp();
  assert.equal(host, MCP_HTTP_HOST);

  const server = createServer(app);
  server.listen(0, host);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }

  const baseUrl = `http://${host}:${address.port}`;
  try {
    await run(baseUrl, fetch);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("assertLoopbackHost accepts 127.0.0.1", () => {
  assert.equal(assertLoopbackHost("127.0.0.1"), "127.0.0.1");
  assert.equal(isLoopbackHost("127.0.0.1"), true);
  assert.equal(MCP_HTTP_HOST, "127.0.0.1");
});

test("assertLoopbackHost rejects 0.0.0.0", () => {
  assert.equal(isLoopbackHost("0.0.0.0"), false);
  assert.throws(
    () => assertLoopbackHost("0.0.0.0"),
    /must bind exclusively to loopback|Refusing non-loopback host/
  );
});

test("assertLoopbackHost rejects other non-loopback addresses", () => {
  for (const host of ["192.168.1.1", "10.0.0.5", "8.8.8.8", "example.com"]) {
    assert.equal(isLoopbackHost(host), false);
    assert.throws(
      () => assertLoopbackHost(host),
      /must bind exclusively to loopback|Refusing non-loopback host/
    );
  }
});

test("createHttpMcpApp rejects non-loopback host", () => {
  assert.throws(
    () => createHttpMcpApp("0.0.0.0"),
    /must bind exclusively to loopback|Refusing non-loopback host/
  );
  assert.throws(
    () => createHttpMcpApp("192.168.0.10"),
    /must bind exclusively to loopback|Refusing non-loopback host/
  );
});

test("/health reports authentication disabled and server identity", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      status: string;
      service: string;
      version: string;
      transport: string;
      oauthEnabled: boolean;
      authRequired: boolean;
      instanceId: string;
      startedAt: string;
      tunnel: { publicEndpointFingerprint: string | null };
    };
    assert.equal(body.status, "ok");
    assert.equal(body.service, "apexos-mcp");
    assert.equal(body.version, MCP_VERSION);
    assert.equal(body.transport, "streamable-http");
    assert.equal(body.oauthEnabled, false);
    assert.equal(body.authRequired, false);
    assert.ok(body.instanceId);
    assert.ok(body.startedAt);
    assert.ok("publicEndpointFingerprint" in (body.tunnel ?? {}));
  });
});

test("/connector-activity/recent is operator-only and records MCP methods", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const before = await fetchImpl(`${baseUrl}/connector-activity/recent`);
    assert.equal(before.status, 200);
    const baseline = (await before.json()) as { count: number; instanceId: string };
    assert.ok(baseline.instanceId);

    await fetchImpl(`${baseUrl}/mcp`, {
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
          clientInfo: { name: "apexos-test", version: "0.0.0" },
        },
      }),
    });

    const after = await fetchImpl(`${baseUrl}/connector-activity/recent`);
    const body = (await after.json()) as {
      count: number;
      events: Array<{ method: string }>;
    };
    assert.ok(body.count >= 1);
    assert.ok(body.events.some((e) => e.method === "initialize"));
  });
});

test("/mcp remains reachable without an Authorization header", async () => {
  await withServer(async (baseUrl, fetchImpl) => {
    const response = await fetchImpl(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "apexos-test", version: "0.0.0" },
        },
      }),
    });

    assert.notEqual(response.status, 401);
    assert.notEqual(response.status, 403);
    assert.ok(response.status === 200 || response.status === 202);
  });
});
