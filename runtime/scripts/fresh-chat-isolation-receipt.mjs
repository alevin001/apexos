/**
 * Tunnel-facing fresh-chat isolation receipt (operator-only).
 * Raw TCP client — MCP Streamable HTTP SSE responses currently break
 * strict chunked parsers (Node undici / curl); ChatGPT tunnel tolerates them.
 */
import net from "node:net";
import http from "node:http";
import { writeFileSync } from "node:fs";

const STALE_CONV = "243d90a7-116c-4be4-bd43-d2548eb6ec5b";
const STALE_SLUG = "runtime-cb668167-leadership-conflict";

function httpJsonGet(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ hostname: "127.0.0.1", port: 3021, path }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
      })
      .on("error", reject);
  });
}

function bodyLooksComplete(rawBody) {
  if (!rawBody || rawBody.length < 20) return false;
  // initialize
  if (/protocolVersion/.test(rawBody) && /serverInfo/.test(rawBody)) return true;
  // tools/call final payload includes lifecycle near the end (after body text).
  if (/\\"lifecycle\\"/.test(rawBody) || /"lifecycle"\s*:/.test(rawBody)) return true;
  if (/mcp_response_sent/.test(rawBody)) return true;
  return false;
}

/** POST /mcp via raw socket; wait until a complete JSON-RPC SSE payload arrives. */
function mcpRawPost(bodyObj, sessionId, idleMs = 8000, hardMs = 180_000) {
  const body = JSON.stringify(bodyObj);
  return new Promise((resolve, reject) => {
    const sock = net.connect(3021, "127.0.0.1");
    let buf = Buffer.alloc(0);
    let settled = false;
    let idleTimer;
    const hardTimer = setTimeout(() => finish(new Error("hard timeout")), hardMs);

    function snapshot() {
      const text = buf.toString("utf8");
      const sep = text.indexOf("\r\n\r\n");
      const headerText = sep >= 0 ? text.slice(0, sep) : "";
      const rawBody = sep >= 0 ? text.slice(sep + 4) : text;
      const sessionMatch = headerText.match(/mcp-session-id:\s*([^\r\n]+)/i);
      return {
        headerText,
        sessionId: sessionMatch?.[1]?.trim() ?? sessionId,
        rawBody,
        text,
      };
    }

    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
      sock.destroy();
      if (err) reject(err);
      else resolve(snapshot());
    }

    function bumpIdle() {
      clearTimeout(idleTimer);
      const snap = snapshot();
      if (bodyLooksComplete(snap.rawBody)) {
        // Brief settle window so trailing chunk bytes can arrive.
        idleTimer = setTimeout(() => finish(), 400);
        return;
      }
      idleTimer = setTimeout(() => finish(), idleMs);
    }

    sock.on("connect", () => {
      const lines = [
        "POST /mcp HTTP/1.1",
        "Host: 127.0.0.1:3021",
        "Content-Type: application/json",
        "Accept: application/json, text/event-stream",
        `Content-Length: ${Buffer.byteLength(body)}`,
        "Connection: close",
      ];
      if (sessionId) lines.push(`mcp-session-id: ${sessionId}`);
      sock.write(lines.join("\r\n") + "\r\n\r\n" + body);
      bumpIdle();
    });
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      bumpIdle();
    });
    sock.on("end", () => finish());
    sock.on("error", (err) => finish(err));
  });
}

function parseSseOrJson(rawBody) {
  const payloads = [];
  for (const line of rawBody.split(/\r?\n/)) {
    const m = line.match(/^data:\s*(.+)$/);
    if (!m) continue;
    try {
      payloads.push(JSON.parse(m[1]));
    } catch {
      /* ignore partial line */
    }
  }
  if (payloads.length) return payloads.length === 1 ? payloads[0] : payloads;

  // Broken chunk framing: recover the largest JSON object that contains "result".
  const start = rawBody.indexOf('{"result"');
  if (start >= 0) {
    for (let end = rawBody.length; end > start + 20; end--) {
      try {
        return JSON.parse(rawBody.slice(start, end));
      } catch {
        /* keep shrinking */
      }
    }
  }
  // Alternate marker after chunk size prefix.
  const alt = rawBody.match(/data:\s*(\{"result":[\s\S]*)/);
  if (alt) {
    const candidate = alt[1];
    for (let end = candidate.length; end > 20; end--) {
      try {
        return JSON.parse(candidate.slice(0, end));
      } catch {
        /* keep shrinking */
      }
    }
  }
  return null;
}

function extractFieldsFromRaw(rawBody) {
  if (!rawBody) return {};
  const pick = (re) => {
    const m = rawBody.match(re);
    return m?.[1];
  };
  // Prefer unescaped JSON field forms inside the tool text payload.
  const situationId =
    pick(/\\"situationId\\":\\s*\\"([0-9a-f-]{36})\\"/i) ||
    pick(/"situationId"\s*:\s*"([0-9a-f-]{36})"/i);
  const situationSlug =
    pick(/\\"situationSlug\\":\\s*\\"([^\\"]+)\\"/i) ||
    pick(/"situationSlug"\s*:\s*"([^"]+)"/i);
  const conversationId =
    pick(/\\"conversationId\\":\\s*\\"([0-9a-f-]{36})\\"/i) ||
    pick(/"conversationId"\s*:\s*"([0-9a-f-]{36})"/i);
  const runtimeId =
    pick(/\\"runtimeId\\":\\s*\\"([0-9a-f-]{36})\\"/i) ||
    pick(/"runtimeId"\s*:\s*"([0-9a-f-]{36})"/i);
  const continuitySource =
    pick(/\\"continuitySource\\":\\s*\\"([a-z_]+)\\"/i) ||
    pick(/"continuitySource"\s*:\s*"([a-z_]+)"/i);
  const glassBoxRequest =
    /\\"glassBoxRequest\\":\\s*true/.test(rawBody) || /"glassBoxRequest"\s*:\s*true/.test(rawBody);
  const glassRuntime =
    pick(/\\"glassBox\\"[\s\S]*?\\"runtimeId\\":\\s*\\"([0-9a-f-]{36})\\"/i) ||
    pick(/"glassBox"[\s\S]*?"runtimeId"\s*:\s*"([0-9a-f-]{36})"/i);
  return {
    metadata: situationId ? { situationId } : undefined,
    situationSlug,
    conversationId,
    runtimeId,
    executionMetadata: continuitySource ? { continuitySource } : undefined,
    glassBoxRequest: glassBoxRequest || undefined,
    glassBox: glassRuntime ? { runtimeId: glassRuntime } : undefined,
  };
}

function extractToolPayload(rpc, rawBody) {
  const messages = Array.isArray(rpc) ? rpc : [rpc];
  for (const msg of messages) {
    if (!msg) continue;
    if (msg.result?.structuredContent) return msg.result.structuredContent;
    const content = msg.result?.content;
    if (Array.isArray(content)) {
      const text = content.find((c) => c.type === "text")?.text;
      if (text) {
        try {
          return JSON.parse(text);
        } catch {
          return { ...extractFieldsFromRaw(text), rawText: text.slice(0, 200) };
        }
      }
    }
  }
  return extractFieldsFromRaw(rawBody);
}

async function callConversation(sessionId, args, id, idleMs = 90_000) {
  const res = await mcpRawPost(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: "apexos_conversation", arguments: args },
    },
    sessionId,
    idleMs
  );
  const parsed = parseSseOrJson(res.rawBody);
  return { ...res, parsed, payload: extractToolPayload(parsed, res.rawBody) };
}

const health = await httpJsonGet("/health");
console.log(
  JSON.stringify(
    {
      phase: "preflight",
      instanceId: health.instanceId,
      startedAt: health.startedAt,
      version: health.version,
      tunnel: health.tunnel,
    },
    null,
    2
  )
);

const init = await mcpRawPost(
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "fresh-chat-isolation-receipt", version: "1.0.0" },
    },
  },
  undefined,
  1500
);
const sessionId = init.sessionId;
if (!sessionId) throw new Error("initialize missing mcp-session-id");
await mcpRawPost({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionId, 800);

console.error("session", sessionId, "calling msg1...");
const msg1 = await callConversation(
  sessionId,
  {
    message:
      "Capture this as a new executive situation. I need to prepare for a leadership meeting with Drew and Jesse about healthy conflict and execution speed. Do not reuse the prior leadership-conflict situation.",
    conversationId: STALE_CONV,
    situationSlug: STALE_SLUG,
  },
  2
);

function situationFrom(payload) {
  return {
    situationId:
      payload?.executionMetadata?.situationId ?? payload?.metadata?.situationId,
    situationSlug:
      payload?.executionMetadata?.situationSlug ?? payload?.situationSlug,
    conversationId: payload?.conversationId,
    runtimeId: payload?.runtimeId,
    continuitySource: payload?.executionMetadata?.continuitySource,
  };
}

const s1 = situationFrom(msg1.payload);
const sit1 = s1.situationId;
const slug1 = s1.situationSlug;
const conv1 = s1.conversationId;
const rt1 = s1.runtimeId;
const cont1 = s1.continuitySource;

console.error("msg1 done", { sit1, slug1, conv1, rt1, cont1 });
const msg2 = await callConversation(
  sessionId,
  {
    message:
      "What should I say first in that meeting to set the right tone on healthy conflict?",
    conversationId: STALE_CONV,
  },
  3
);

const s2 = situationFrom(msg2.payload);
const sit2 = s2.situationId;
const slug2 = s2.situationSlug;
const conv2 = s2.conversationId;
const rt2 = s2.runtimeId;
const cont2 = s2.continuitySource;

console.error("msg2 done", { sit2, slug2, conv2, rt2, cont2 });
const msg3 = await callConversation(sessionId, { message: "Show the Glass Box" }, 4);
const glassRuntime = msg3.payload?.glassBox?.runtimeId ?? msg3.payload?.runtimeId;
const glassOk = Boolean(msg3.payload?.glassBox);

const healthAfter = await httpJsonGet("/health");
const lifecycle = await httpJsonGet("/lifecycle/recent?limit=10");

const receipt = {
  instanceId: healthAfter.instanceId,
  startedAt: healthAfter.startedAt,
  version: healthAfter.version,
  tunnelUpstream: healthAfter.tunnel?.localUpstream,
  tunnelId: healthAfter.tunnel?.tunnelId,
  mcpSessionId: sessionId,
  staleIdsIgnored: { conversationId: STALE_CONV, situationSlug: STALE_SLUG },
  message1: {
    continuitySource: cont1,
    conversationId: conv1,
    situationId: sit1,
    situationSlug: slug1,
    runtimeId: rt1,
  },
  message2: {
    continuitySource: cont2,
    conversationId: conv2,
    situationId: sit2,
    situationSlug: slug2,
    runtimeId: rt2,
  },
  message3: {
    glassBoxRequest: msg3.payload?.glassBoxRequest === true,
    glassBoxRuntimeId: glassRuntime,
    glassBoxPresent: glassOk,
  },
  assertions: {
    msg1NewSituation: Boolean(sit1) && slug1 !== STALE_SLUG && conv1 !== STALE_CONV,
    msg2SameSituation: sit2 === sit1 && conv2 === conv1 && slug2 === slug1,
    msg3SameRuntime: glassRuntime === rt2,
  },
  recentLifecycle: (lifecycle.requests ?? []).slice(0, 6).map((r) => ({
    requestId: r.requestId,
    continuitySource: r.continuitySource,
    runtimeId: r.runtimeId,
    conversationId: r.conversationId,
    glassBoxRequest: r.glassBoxRequest,
    outcome: r.outcome,
  })),
};

writeFileSync(
  new URL("../.tmp-fresh-chat-receipt.json", import.meta.url),
  JSON.stringify(
    {
      receipt,
      msg1: msg1.payload,
      msg2: msg2.payload,
      msg3: msg3.payload,
      rawLens: {
        msg1: msg1.rawBody?.length,
        msg2: msg2.rawBody?.length,
        msg3: msg3.rawBody?.length,
      },
    },
    null,
    2
  )
);
console.log(JSON.stringify(receipt, null, 2));

const ok =
  receipt.assertions.msg1NewSituation &&
  receipt.assertions.msg2SameSituation &&
  receipt.assertions.msg3SameRuntime &&
  glassOk;
if (!ok) {
  console.error("RECEIPT ASSERTIONS FAILED");
  console.error(
    JSON.stringify(
      {
        sit1,
        sit2,
        slug1,
        slug2,
        conv1,
        conv2,
        rt1,
        rt2,
        glassRuntime,
        cont1,
        cont2,
        msg1Keys: Object.keys(msg1.payload ?? {}),
        msg1Sample: msg1.rawBody?.slice(0, 400),
        msg2Sample: msg2.rawBody?.slice(0, 400),
        msg3Sample: msg3.rawBody?.slice(0, 400),
      },
      null,
      2
    )
  );
  process.exit(1);
}
console.error("RECEIPT OK");
