-- Build 19 Checkpoint C — add PPTX MIME to knowledge-source-material allowlist.
-- Additive only. Do not treat as hosted deployment from this checkpoint.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/vtt',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'message/rfc822',
  'application/vnd.ms-outlook',
  'application/vnd.ms-outlook-pst',
  'application/vnd.ms-outlook-ost',
  'application/octet-stream'
]
WHERE id = 'knowledge-source-material';
