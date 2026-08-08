import assert from "node:assert/strict";
import test from "node:test";
import {
  attachApexosRequestIdToLatestCall,
  clearConnectorActivityForTests,
  getRecentConnectorActivity,
  recordConnectorActivity,
} from "./adapters/connector-activity.js";
import {
  CHATGPT_FACING_TOOL_NAMES,
  INGEST_TOOL_NAME,
  PRIMARY_TOOL_NAME,
} from "./connector-guidance.js";
import { listRegisteredChatgptToolNames } from "./tools/register-tools.js";
import {
  getServerIdentity,
  overrideTunnelIdentityForTests,
} from "./server-identity.js";

test("connector activity records initialize, tools/list, and tools/call without bodies", () => {
  clearConnectorActivityForTests();
  recordConnectorActivity({
    httpMethod: "POST",
    sessionId: "sess-1",
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t" } },
    },
  });
  recordConnectorActivity({
    httpMethod: "POST",
    sessionId: "sess-1",
    body: { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
  });
  recordConnectorActivity({
    httpMethod: "POST",
    sessionId: "sess-1",
    body: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "apexos_conversation",
        arguments: { message: "SECRET_SHOULD_NOT_APPEAR" },
      },
    },
  });

  const events = getRecentConnectorActivity(10);
  assert.equal(events.length, 3);
  assert.equal(events[2].method, "initialize");
  assert.equal(events[1].method, "tools/list");
  assert.equal(events[0].method, "tools/call");
  assert.equal(events[0].toolName, "apexos_conversation");
  assert.equal(events[0].arrivedViaHttpTunnelFacingTransport, true);
  assert.ok(events[0].instanceId);
  assert.ok(events[0].serverVersion);

  const blob = JSON.stringify(events);
  assert.equal(blob.includes("SECRET_SHOULD_NOT_APPEAR"), false);
});

test("tools/call can be linked to apexos_conversation requestId", () => {
  clearConnectorActivityForTests();
  recordConnectorActivity({
    httpMethod: "POST",
    sessionId: null,
    body: {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: { name: "apexos_conversation", arguments: { message: "x" } },
    },
  });
  attachApexosRequestIdToLatestCall("apexos_conversation", "req-abc");
  assert.equal(getRecentConnectorActivity(1)[0].apexosConversationRequestId, "req-abc");
});

test("server identity exposes version, startedAt, instanceId, tunnel fingerprint", () => {
  overrideTunnelIdentityForTests({
    tunnelId: "tunnel_test_abc",
    localUpstream: "http://127.0.0.1:3021/mcp",
    tunnelName: "ApexOS",
    source: "env",
  });
  const id = getServerIdentity();
  assert.equal(id.service, "apexos-mcp");
  assert.match(id.version, /^\d+\.\d+\.\d+/);
  assert.ok(id.instanceId.length >= 8);
  assert.ok(id.startedAt);
  assert.ok(id.tunnel.publicEndpointFingerprint);
  assert.equal(id.tunnel.publicEndpointFingerprint?.length, 16);
  assert.equal(id.tunnel.localUpstream, "http://127.0.0.1:3021/mcp");
});

test("connector activity diagnostics are not ChatGPT-facing tools", () => {
  assert.deepEqual(
    [...listRegisteredChatgptToolNames()],
    [PRIMARY_TOOL_NAME, INGEST_TOOL_NAME]
  );
  assert.ok(!CHATGPT_FACING_TOOL_NAMES.includes("connector_activity" as never));
  assert.ok(!listRegisteredChatgptToolNames().includes("runtime_health"));
});
