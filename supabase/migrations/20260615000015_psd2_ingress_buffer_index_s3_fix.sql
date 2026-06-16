-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION PSD2 BUFFER INDEX PATCH (FINDING S3 COMPLETE CLOSURE)
-- Governed by NEN 7510, High-Throughput Ingestion Scaling
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE INDEX IF NOT EXISTS idx_psd2_buffer_received_at  
ON psd2_webhook_ingress_buffer (received_at ASC);

COMMIT;

-- Rollback (DOWN Migration)
/*
BEGIN;
DROP INDEX IF EXISTS idx_psd2_buffer_received_at;
COMMIT;
*/
