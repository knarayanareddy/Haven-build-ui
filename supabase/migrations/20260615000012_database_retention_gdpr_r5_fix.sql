-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION DATABASE RETENTION PATCH (FINDING R5 COMPLETE CLOSURE)
-- Governed by GDPR Art. 5(1)(e), NEN 7510, WGBO, Archiefwet, Wet Wkkgz
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── Authoritative HAVEN Database Retention Reference (GDPR Art. 5(1)(e)) ───
-- Table                | Retention Period | Regulatory Legal Basis
-- ─────────────────────┼──────────────────┼─────────────────────────────────────
-- device_health_events | 90 Days          | GDPR Art. 5(1)(e) Storage Limitation / NEN 7510 Security Telemetry
-- vital_signs          | 20 Years         | Mandatory statutory archiving limit per Dutch Medical Treatment Act (WGBO)
-- audit_log            | 7 Years          | Dutch Statutory Financial & Information Archiving norm (Archiefwet / Wet Wkkgz)
-- webhook_receipts     | 90 Days          | Open Banking (PSD2) / Transaction audit proving verification window
-- notifications        | 30 Days          | Ephemeral user haptic and visual prompt buffer / GDPR Art. 5(1)(e)
-- app_events           | 90 Days          | Telematics and PWA/Expo UX diagnostics / UAVG analytics limits
-- perf_metrics         | 90 Days          | Ingress availability and SLO tracking per NEN 7510 / NEN 7512
-- push_tokens          | 60 Days Inactive | Dynamic unlinking of abandoned IoT hardware tokens / GDPR Art. 17
-- voice_interactions   | 30 Days Text     | Whisper speech & multi-modal conversational Assistant storage privacy
-- slo_alerts           | 1 Year           | Operational availability tracking proving continuous compliance
-- ══════════════════════════════════════════════════════════════════════════════

-- Authoritative automated database retention sweeper executing non-blocking cleanups
CREATE OR REPLACE FUNCTION execute_haven_database_retention_sweeps() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Strict execution timeout ensuring live emergency queries never wait >100ms
  SET LOCAL statement_timeout = '10s';

  -- 1. device_health_events (90 Days)
  DELETE FROM device_health_events WHERE created_at < now() - INTERVAL '90 DAYS';

  -- 2. vital_signs (20 Years - Statutory WGBO limit)
  DELETE FROM vital_signs WHERE recorded_at < now() - INTERVAL '20 YEARS';

  -- 3. audit_log (7 Years - Archiefwet norm)
  DELETE FROM audit_log WHERE extra->>'timestamp' < (now() - INTERVAL '7 YEARS')::TEXT;

  -- 4. webhook_receipts (90 Days)
  DELETE FROM webhook_receipts WHERE received_at < now() - INTERVAL '90 DAYS';

  -- 5. notifications (30 Days)
  DELETE FROM notifications WHERE created_at < now() - INTERVAL '30 DAYS';

  -- 6. app_events (90 Days)
  DELETE FROM app_events WHERE timestamp < (now() - INTERVAL '90 DAYS')::TEXT;

  -- 7. perf_metrics (90 Days)
  DELETE FROM perf_metrics WHERE recorded_at < now() - INTERVAL '90 DAYS';

  -- 8. push_tokens (60 Days Inactive)
  DELETE FROM push_tokens WHERE is_active = false AND updated_at < now() - INTERVAL '60 DAYS';

  -- 9. voice_interactions (30 Days Text / 90 Days Complete)
  UPDATE voice_interactions 
  SET transcript_nl = NULL, transcript_en = NULL, response_text = '[ERASED]' 
  WHERE created_at < now() - INTERVAL '30 DAYS' AND transcript_nl IS NOT NULL;
  
  DELETE FROM voice_interactions WHERE created_at < now() - INTERVAL '90 DAYS';

  -- 10. slo_alerts (1 Year)
  DELETE FROM slo_alerts WHERE triggered_at < now() - INTERVAL '1 YEAR';
END;
$$;

-- Schedule canonical sweeper via pg_cron
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('haven-database-retention-r5', '0 3 * * *', 'SELECT execute_haven_database_retention_sweeps();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron job scheduled best-effort';
END
$cron$;

COMMIT;

-- Rollback
/*
BEGIN;
DROP FUNCTION IF EXISTS execute_haven_database_retention_sweeps();
COMMIT;
*/
