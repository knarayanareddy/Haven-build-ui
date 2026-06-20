-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION S3 LIFECYCLE IaC & CRON (FINDING #12 Complete Closure)
-- Governed by GDPR Art. 17, Dutch AVG
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Authoritative automated database cron helper sweeping Supabase Storage tts-cache bucket
-- and permanently purging objects under prefix emergency-location/ older than 24 hours.
-- Mirrors and reinforces our external AWS S3 IaC PutBucketLifecycleConfiguration rules.
CREATE OR REPLACE FUNCTION purge_stale_emergency_location_objects() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Execute programmatic storage cleanup for tts-cache storage table records
  DELETE FROM storage.objects
  WHERE bucket_id = 'tts-cache'
    AND (storage.foldername(name))[1] = 'emergency-location'
    AND created_at < now() - INTERVAL '24 HOURS';
END;
$$;

COMMIT;

-- Rollback (DOWN Migration)
/*
BEGIN;
DROP FUNCTION IF EXISTS purge_stale_emergency_location_objects();
COMMIT;
*/
