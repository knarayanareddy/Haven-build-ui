-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION CARER CRISIS ALERTS PATCH (FINDING S2 COMPLETE CLOSURE)
-- Governed by Wet Wkkgz, NEN 7510
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE carer_relationships ADD COLUMN IF NOT EXISTS notify_on_crisis BOOLEAN DEFAULT true;

COMMIT;

-- Rollback
/*
BEGIN;
ALTER TABLE carer_relationships DROP COLUMN IF EXISTS notify_on_crisis;
COMMIT;
*/
