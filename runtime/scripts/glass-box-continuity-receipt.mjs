/**
 * Tunnel-facing Glass Box continuity receipt.
 * Simulates ChatGPT: new MCP session each turn; host replays conversationId.
 */
import net from "node:net";
import http from "node:http";
import { writeFileSync } from "node:fs";

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
  if (/protocolVersion/.test(rawBody) && /serverInfo/.test(rawBody)) return true;
  if (/\\"lifecycle\\"/.test(rawBody) || /"lifecycle"\s*:/.test(rawBody)) return true;
  if (/mcp_response_sent/.test(rawBody)) return true;
  return false;
}

function mcpRawPost(bodyObj, sessionId, idleMs = 90_000, hardMs = 180_000) {
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
      if (bodyLooksComplete(snapshot().rawBody)) {
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
  for (const line of rawBody.split(/\r?\n/)) {
    const m = line.match(/^data:\s*(.+)$/);
    if (!m) continue;
    try {
      return JSON.parse(m[1]);
    } catch {
      /* ignore */
    }
  }
  const start = rawBody.indexOf('{"result"');
  if (start >= 0) {
    for (let end = rawBody.length; end > start + 20; end--) {
      try {
        return JSON.parse(rawBody.slice(start, end));
      } catch {
        /* shrink */
      }
    }
  }
  return null;
}

function extractToolPayload(rpc) {
  if (rpc?.result?.structuredContent) return rpc.result.structuredContent;
  const text = rpc?.result?.content?.find?.((c) => c.type === "text")?.text;
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }
  return {};
}

async function newMcpSession() {
  const init = await mcpRawPost(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "glass-box-continuity-receipt", version: "1.0.0" },
      },
    },
    undefined,
    2000
  );
  if (!init.sessionId) throw new Error("initialize missing session id");
  await mcpRawPost({ jsonrpc: "2.0", method: "notifications/initialized" }, init.sessionId, 800);
  return init.sessionId;
}

async function callConversation(sessionId, args, id) {
  const res = await mcpRawPost(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: "apexos_conversation", arguments: args },
    },
    sessionId,
    90_000
  );
  return extractToolPayload(parseSseOrJson(res.rawBody));
}

const health = await httpJsonGet("/health");
console.error("instance", health.instanceId, "started", health.startedAt);

const sess1 = await newMcpSession();
const msg1 = await callConversation(
  sess1,
  {
    message:
      "Capture this as a new executive situation. I need to prepare for a leadership meeting with Drew about healthy conflict and execution speed.",
  },
  2
);

const convId = msg1.conversationId;
const sit1 = msg1.executionMetadata?.situationId;
const slug1 = msg1.executionMetadata?.situationSlug ?? msg1.situationSlug;
const rt1 = msg1.runtimeId;
console.error("msg1", { convId, sit1, slug1, rt1, cont: msg1.executionMetadata?.continuitySource });

const sess2 = await newMcpSession();
const msg2 = await callConversation(
  sess2,
  {
    message:
      "I'm leaning toward speaking with Drew first. What should I recommend as the opening for healthy conflict?",
    conversationId: convId,
  },
  3
);
const sit2 = msg2.executionMetadata?.situationId;
const slug2 = msg2.executionMetadata?.situationSlug ?? msg2.situationSlug;
const rt2 = msg2.runtimeId;
console.error("msg2", {
  conv: msg2.conversationId,
  sit2,
  slug2,
  rt2,
  cont: msg2.executionMetadata?.continuitySource,
});

const sess3 = await newMcpSession();
const msg3 = await callConversation(
  sess3,
  {
    message:
      "@ApexOS show the glass box. Prior context: Drew, recommendation about speaking with Drew, pending proposed decision, outcome to track.",
    conversationId: convId,
  },
  4
);

const glassRt = msg3.glassBox?.runtimeId ?? msg3.runtimeId;
const byStage = Object.fromEntries((msg3.glassBox?.stages ?? []).map((s) => [s.stage, s]));
const lifecycle = await httpJsonGet("/lifecycle/recent?limit=6");

const receipt = {
  instanceId: health.instanceId,
  startedAt: health.startedAt,
  tunnelId: health.tunnel?.tunnelId,
  tunnelUpstream: health.tunnel?.localUpstream,
  chatgptSessionBinding: {
    note: "Fresh MCP session per ChatGPT tools/call (matches live connector)",
    message1SessionId: sess1,
    message2SessionId: sess2,
    message3SessionId: sess3,
  },
  message1: {
    continuitySource: msg1.executionMetadata?.continuitySource,
    conversationId: convId,
    situationId: sit1,
    situationSlug: slug1,
    runtimeId: rt1,
    glassBoxRequest: msg1.glassBoxRequest === true,
  },
  message2: {
    continuitySource: msg2.executionMetadata?.continuitySource,
    conversationId: msg2.conversationId,
    situationId: sit2,
    situationSlug: slug2,
    runtimeId: rt2,
    glassBoxRequest: msg2.glassBoxRequest === true,
  },
  message3: {
    continuitySource: msg3.executionMetadata?.continuitySource,
    conversationId: msg3.conversationId,
    situationId: sit2,
    runtimeId: glassRt,
    glassBoxRequest: msg3.glassBoxRequest === true,
    glassBoxSource: msg3.executionMetadata?.glassBoxSource,
    readOnly: msg3.executionMetadata?.readOnly === true,
    recordsCreatedCount: msg3.executionMetadata?.recordsCreated?.length ?? 0,
    recommendationCaptured: byStage.recommendation?.status === "captured",
    proposedDecisionInRecommendation: (byStage.recommendation?.ids ?? []).some((id) =>
      /prop|proposed/i.test(String(byStage.recommendation?.summary ?? "")) ||
      (msg3.glassBox?.stages ?? []).some(
        (s) => s.stage === "recommendation" && (s.ids ?? []).length >= 1
      )
    ),
    outcomeCaptured: byStage.outcome_learning?.status === "captured",
    decisionNotCaptured: byStage.executive_decision?.status === "not_captured",
  },
  assertions: {
    msg1NewSituation: Boolean(sit1) && msg1.executionMetadata?.continuitySource === "new",
    msg2SameSituation: sit2 === sit1 && msg2.conversationId === convId,
    msg3ReadOnlyGlassBox:
      msg3.glassBoxRequest === true &&
      glassRt === rt2 &&
      msg3.executionMetadata?.readOnly === true &&
      (msg3.executionMetadata?.recordsCreated?.length ?? 0) === 0,
    msg3ShowsMsg2Trace: glassRt === rt2 && byStage.recommendation?.status === "captured",
  },
  recentLifecycle: (lifecycle.requests ?? []).slice(0, 5).map((r) => ({
    continuitySource: r.continuitySource,
    runtimeId: r.runtimeId,
    glassBoxRequest: r.events?.find?.((e) => e.event === "request_received")?.data?.glassBoxRequest,
    captureConfirmed: r.captureConfirmed,
    outcome: r.outcome,
  })),
};

writeFileSync(
  new URL("../.tmp-glass-box-continuity-receipt.json", import.meta.url),
  JSON.stringify({ receipt, msg1, msg2, msg3 }, null, 2)
);
console.log(JSON.stringify(receipt, null, 2));

const ok = Object.values(receipt.assertions).every(Boolean);
if (!ok) {
  console.error("RECEIPT ASSERTIONS FAILED");
  process.exit(1);
}
console.error("RECEIPT OK");
