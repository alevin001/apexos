import assert from "node:assert/strict";
import test from "node:test";
import {
  CHATGPT_FACING_TOOL_NAMES,
  CONNECTOR_EXCLUDED_DIAGNOSTIC_TOOLS,
  LEADERSHIP_LIVE_TEST_MESSAGE,
  PRIMARY_TOOL_DESCRIPTION,
  PRIMARY_TOOL_NAME,
  PRIMARY_TOOL_TITLE,
  SERVER_INSTRUCTIONS,
  classifyLiveInvocation,
  messageRequiresApexosRuntime,
  selectToolForExecutiveMessage,
  buildInvokedContract,
  buildFailedContract,
} from "./connector-guidance.js";
import { listRegisteredChatgptToolNames } from "./tools/register-tools.js";
import {
  formatInterfaceStatusBlock,
  buildApexosBasis,
  buildUnavailableBasis,
} from "./adapters/apexos-basis.js";

test("ChatGPT catalog exposes only apexos_conversation", () => {
  assert.deepEqual([...CHATGPT_FACING_TOOL_NAMES], [PRIMARY_TOOL_NAME]);
  assert.deepEqual([...listRegisteredChatgptToolNames()], [PRIMARY_TOOL_NAME]);
  for (const name of CONNECTOR_EXCLUDED_DIAGNOSTIC_TOOLS) {
    assert.ok(
      !CHATGPT_FACING_TOOL_NAMES.includes(name as (typeof CHATGPT_FACING_TOOL_NAMES)[number]),
      `diagnostic tool must not be ChatGPT-facing: ${name}`
    );
  }
});

test("leadership-meeting request selects apexos_conversation, not health/status", () => {
  const selected = selectToolForExecutiveMessage(LEADERSHIP_LIVE_TEST_MESSAGE);
  assert.equal(selected, PRIMARY_TOOL_NAME);
  assert.notEqual(selected, "runtime_health");
  assert.notEqual(selected, "health");
  assert.ok(messageRequiresApexosRuntime(LEADERSHIP_LIVE_TEST_MESSAGE));
});

test("health tools are unavailable for normal executive routing", () => {
  assert.equal(
    CONNECTOR_EXCLUDED_DIAGNOSTIC_TOOLS.includes("runtime_health"),
    true
  );
  assert.ok(!listRegisteredChatgptToolNames().includes("runtime_health"));
  assert.ok(!listRegisteredChatgptToolNames().includes("build_context"));
  assert.ok(!listRegisteredChatgptToolNames().includes("runtime_trace"));
  assert.ok(!listRegisteredChatgptToolNames().includes("execute_runtime"));
  assert.match(SERVER_INSTRUCTIONS, /Do NOT perform a health check/i);
  assert.match(PRIMARY_TOOL_DESCRIPTION, /Do NOT call any health/i);
  assert.ok(!SERVER_INSTRUCTIONS.includes("runtime_health —"));
});

test("primary tool metadata is the sole conversational entry point", () => {
  assert.equal(PRIMARY_TOOL_NAME, "apexos_conversation");
  assert.match(PRIMARY_TOOL_TITLE, /Executive Conversation/i);
  assert.match(PRIMARY_TOOL_DESCRIPTION, /ONLY ApexOS TOOL/i);
  assert.match(PRIMARY_TOOL_DESCRIPTION, /MUST call this tool BEFORE answering/i);
  assert.match(PRIMARY_TOOL_DESCRIPTION, /no separate preflight/i);
  assert.match(SERVER_INSTRUCTIONS, /sole conversational entry point/i);
});

test("runtime-unavailable degraded status is returned via apexos_conversation contract", () => {
  const basis = buildUnavailableBasis("unavailable");
  const display = formatInterfaceStatusBlock(basis, { glassBoxAvailable: false });
  assert.match(basis.status, /runtime was not available/i);
  assert.match(display, /^ApexOS Basis:/m);
  assert.match(display, /Glass Box: Not available/);
  // Simulated tool failure payload shape from apexos_conversation
  const failedPayload = {
    invocation: buildFailedContract(PRIMARY_TOOL_NAME),
    apexosBasis: basis,
    apexosBasisDisplay: display,
  };
  assert.equal(classifyLiveInvocation(failedPayload), "failed");
  assert.equal(failedPayload.invocation.tool, PRIMARY_TOOL_NAME);
  assert.notEqual(failedPayload.invocation.tool, "runtime_health");
});

test("two-line status remains present on successful invocation", () => {
  const basis = buildApexosBasis({
    conversationId: "c1",
    continuitySource: "new",
    persistenceStatus: "persisted",
    recordsCreated: [{ table: "situations", id: "s1" }],
    recordsRetrieved: [],
    stages: [
      { stage: "continuity-retrieval", status: "skipped", durationMs: 1 },
      { stage: "interaction-capture", status: "success", durationMs: 1 },
    ],
    runtimeAvailable: true,
  });
  const display = formatInterfaceStatusBlock(basis, { glassBoxAvailable: true });
  const lines = display.split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^ApexOS Basis:/);
  assert.match(lines[1], /^Glass Box: Available/);
  assert.equal(
    classifyLiveInvocation({
      invocation: buildInvokedContract(PRIMARY_TOOL_NAME, "rt-1"),
      apexosBasisDisplay: display,
    }),
    "invoked"
  );
});

test("connector instructions require runtime for executive work when ApexOS is selected", () => {
  assert.match(SERVER_INSTRUCTIONS, /MUST call `apexos_conversation` before answering/i);
  assert.match(SERVER_INSTRUCTIONS, /NOT an ApexOS answer/i);
  assert.match(SERVER_INSTRUCTIONS, /never a health check/i);
});
