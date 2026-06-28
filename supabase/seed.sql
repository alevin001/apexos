-- ApexOS Build 09 — Optional foundation seed
-- Enable in supabase/config.toml: [db.seed] enabled = true

INSERT INTO executives (external_id, slug, display_name, summary, status)
VALUES ('EXE-001', 'primary-executive', 'Primary Executive', 'ApexOS system operator', 'active')
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO persons (external_id, slug, display_name, status)
VALUES ('PER-001', 'jane-smith', 'Jane Smith', 'active')
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO relationships (external_id, slug, title, status)
VALUES ('REL-001', 'exec-jane', 'Executive — Jane Smith', 'active')
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO relationship_participants (relationship_id, person_id)
SELECT r.id, p.id
FROM relationships r, persons p
WHERE r.slug = 'exec-jane' AND p.slug = 'jane-smith'
ON CONFLICT DO NOTHING;

INSERT INTO situations (external_id, slug, title, situation_type, situation_summary, status)
VALUES (
  'SIT-001',
  'leadership-conflict-q2',
  'Q2 Leadership Conflict',
  'leadership-conflict',
  'Recurring leadership alignment challenge in Q2 planning cycle',
  'active'
)
ON CONFLICT (external_id) DO NOTHING;
