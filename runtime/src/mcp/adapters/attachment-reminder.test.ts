import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTACHMENT_REMINDER,
  clearAttachmentRemindersForTests,
  consumeAttachmentReminder,
  hasUsableFileReference,
} from "./attachment-reminder.js";

test("reminder appears only when a file reference is received", () => {
  clearAttachmentRemindersForTests();
  assert.equal(consumeAttachmentReminder("s1", null), null);
  assert.equal(consumeAttachmentReminder("s1", {}), null);
  assert.equal(hasUsableFileReference(null), false);

  const once = consumeAttachmentReminder("s1", {
    file_id: "file_abc",
    download_url: "https://example.com/a.txt",
  });
  assert.equal(once, ATTACHMENT_REMINDER);
  assert.match(once!, /Add this file to ApexOS/);
});

test("reminder is emitted only once per new attachment in a session", () => {
  clearAttachmentRemindersForTests();
  const file = { file_id: "file_1", download_url: "https://example.com/1.txt" };
  assert.equal(consumeAttachmentReminder("sess", file), ATTACHMENT_REMINDER);
  assert.equal(consumeAttachmentReminder("sess", file), null);
  assert.equal(
    consumeAttachmentReminder("sess", {
      file_id: "file_2",
      download_url: "https://example.com/2.txt",
    }),
    ATTACHMENT_REMINDER
  );
});

test("file_id string coercion still counts as a received reference", () => {
  clearAttachmentRemindersForTests();
  assert.equal(hasUsableFileReference("file_only"), true);
  assert.equal(consumeAttachmentReminder("s2", "file_only"), ATTACHMENT_REMINDER);
  assert.equal(consumeAttachmentReminder("s2", "file_only"), null);
});
