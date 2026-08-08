import assert from "node:assert/strict";
import test from "node:test";
import { contentPhraseBoost, filenameBoost } from "./retrieve.js";

test("filenameBoost prefers Test.txt over bare extension ties", () => {
  const q = "What does Test.txt say?";
  assert.ok(filenameBoost(q, "Test", "Test.txt") >= 0.75);
  assert.equal(filenameBoost(q, "build18-ingestion-smoke.txt", "build18-ingestion-smoke.txt"), 0);
});

test("contentPhraseBoost finds HELLO in short sources", () => {
  assert.ok(contentPhraseBoost("What about HELLO?", "HELLO!") >= 0.65);
  assert.equal(contentPhraseBoost("What does Test.txt say?", "HELLO!"), 0);
});
