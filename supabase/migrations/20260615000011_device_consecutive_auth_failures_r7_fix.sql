-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION DEVICE AUTO-REVOKE PATCH (FINDING R7 COMPLETE CLOSURE)
-- Governed by NEN 7510, Wet Wkkgz
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE device_sessions ADD COLUMN IF NOT EXISTS consecutive_auth_failures INTEGER NOT NULL DEFAULT 0;

COMMIT;

-- Rollback
/*
BEGIN;
ALTER TABLE device_sessions DROP COLUMN IF EXISTS consecutive_auth_failures;
COMMIT;
*/
