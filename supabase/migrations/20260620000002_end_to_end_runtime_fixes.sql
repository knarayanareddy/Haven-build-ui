-- HAVEN end-to-end runtime fixes.
-- Closes local PostgREST privilege drift and SQL function/schema drift found by
-- live Supabase reset + lint.

BEGIN;

-- The export RPC included this vNext key before the backing table existed.
CREATE TABLE IF NOT EXISTS daily_checkin_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning','midday','evening')),
  scheduled_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (elder_id, checkin_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkin_schedule_elder
  ON daily_checkin_schedule(elder_id, enabled, scheduled_time);

ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS elder_id UUID GENERATED ALWAYS AS (owner_profile_id) STORED;

ALTER TABLE daily_checkin_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkin_schedule FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_checkin_schedule_self ON daily_checkin_schedule;
CREATE POLICY daily_checkin_schedule_self ON daily_checkin_schedule
  FOR ALL
  USING (elder_id = auth.uid())
  WITH CHECK (elder_id = auth.uid());

DROP POLICY IF EXISTS daily_checkin_schedule_family_read ON daily_checkin_schedule;
CREATE POLICY daily_checkin_schedule_family_read ON daily_checkin_schedule
  FOR SELECT
  USING (public.family_can(elder_id, 'alerts'));

CREATE OR REPLACE FUNCTION compute_daily_status_digests_batch()
RETURNS TABLE (
  elder_id UUID,
  computed_status TEXT,
  computed_reasons TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS elder_id,
    CASE
      WHEN coalesce(f_agg.no_resp_falls, 0) > 0
        OR coalesce(s_agg.scams, 0) > 0
        OR (coalesce(m_agg.total_m, 0) > 0 AND coalesce(m_agg.missed_m, 0)::NUMERIC / coalesce(m_agg.total_m, 1) > 0.5)
        THEN 'red'::TEXT
      WHEN coalesce(f_agg.pend_falls, 0) > 0
        OR coalesce(m_agg.missed_m, 0) > 0
        OR coalesce(d_agg.stale_h, 0) > 24
        THEN 'amber'::TEXT
      ELSE 'green'::TEXT
    END AS computed_status,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN coalesce(f_agg.no_resp_falls, 0) > 0 THEN 'Possible fall without response.'::TEXT ELSE NULL END,
      CASE WHEN coalesce(f_agg.pend_falls, 0) > 0 THEN 'Possible fall awaiting confirmation.'::TEXT ELSE NULL END,
      CASE WHEN coalesce(s_agg.scams, 0) > 0 THEN 'High-confidence scam detected.'::TEXT ELSE NULL END,
      CASE WHEN coalesce(m_agg.total_m, 0) > 0 AND coalesce(m_agg.missed_m, 0)::NUMERIC / coalesce(m_agg.total_m, 1) > 0.5 THEN 'More than half of today medications missed.'::TEXT ELSE NULL END,
      CASE WHEN coalesce(m_agg.missed_m, 0) > 0 THEN 'Some medications not confirmed today.'::TEXT ELSE NULL END,
      CASE WHEN coalesce(d_agg.stale_h, 0) > 24 THEN 'Device has not checked in for over 24 hours.'::TEXT ELSE NULL END
    ], NULL) AS computed_reasons
  FROM profiles p
  LEFT JOIN (
    SELECT fe.elder_id,
           COUNT(*) FILTER (WHERE status = 'no_response') AS no_resp_falls,
           COUNT(*) FILTER (WHERE status = 'possible') AS pend_falls
    FROM fall_events fe
    GROUP BY fe.elder_id
  ) f_agg ON f_agg.elder_id = p.id
  LEFT JOIN (
    SELECT se.elder_id, COUNT(*) AS scams
    FROM scam_events se
    WHERE se.created_at >= now()::DATE AND se.alert_level IN ('rood', 'zwart')
    GROUP BY se.elder_id
  ) s_agg ON s_agg.elder_id = p.id
  LEFT JOIN (
    SELECT mr.elder_id,
           COUNT(*) AS total_m,
           COUNT(*) FILTER (WHERE status IN ('gemist', 'overgeslagen')) AS missed_m
    FROM medication_reminders mr
    WHERE mr.scheduled_time >= now()::DATE
    GROUP BY mr.elder_id
  ) m_agg ON m_agg.elder_id = p.id
  LEFT JOIN (
    SELECT ds.profile_id, EXTRACT(EPOCH FROM (now() - MAX(ds.last_seen_at))) / 3600 AS stale_h
    FROM device_sessions ds
    WHERE ds.revoked_at IS NULL
    GROUP BY ds.profile_id
  ) d_agg ON d_agg.profile_id = p.id
  WHERE p.role = 'elder' AND p.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION get_stale_device_sessions_batch()
RETURNS TABLE (
  elder_id UUID,
  elder_name TEXT,
  session_id UUID,
  last_seen TIMESTAMPTZ,
  age_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS elder_id,
    p.full_name AS elder_name,
    ds.id AS session_id,
    ds.last_seen_at,
    (EXTRACT(EPOCH FROM (now() - ds.last_seen_at)) / 3600)::NUMERIC AS age_hours
  FROM profiles p
  JOIN LATERAL (
    SELECT id, last_seen_at
    FROM device_sessions
    WHERE profile_id = p.id AND revoked_at IS NULL
    ORDER BY last_seen_at DESC
    LIMIT 1
  ) ds ON true
  WHERE p.role = 'elder' AND p.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION promote_fhir_medication_staging(p_staging_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staging RECORD;
  v_role TEXT;
  v_crit_count INTEGER := 0;
  v_med_id UUID;
  v_clinician_id UUID := auth.uid();
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = v_clinician_id;
  IF (v_role NOT IN ('system', 'admin', 'carer')) THEN
    RAISE EXCEPTION '403 Forbidden: Direct activation attempt without authorized clinical approval is strictly rejected';
  END IF;

  SELECT id, elder_id, extracted_name_nl, extracted_dosage_nl, proposed_schedule_times, status
  INTO v_staging
  FROM fhir_medication_staging
  WHERE id = p_staging_id
  FOR UPDATE;

  IF (v_staging IS NULL) THEN RAISE EXCEPTION '404: Staging record non-existent'; END IF;
  IF (v_staging.status <> 'pending_review') THEN
    RAISE EXCEPTION '400: Prescription is already resolved or promoted';
  END IF;

  SELECT count(*) INTO v_crit_count
  FROM check_medication_interactions_sql(v_staging.elder_id, v_staging.extracted_name_nl)
  WHERE severity = 'critical';

  IF (v_crit_count > 0) THEN
    INSERT INTO medication_interaction_alerts (elder_id, severity, summary_nl, source)
    VALUES (
      v_staging.elder_id,
      'critical',
      'CRITICAL FHIR INTERACTION: Voorgesteld medicijn ' || v_staging.extracted_name_nl || ' heeft een ernstige wisselwerking met huidige medicatie.',
      'promote_fhir_medication_staging'
    );

    UPDATE fhir_medication_staging
    SET status = 'rejected', reviewed_by_id = v_clinician_id, reviewed_at = now()
    WHERE id = p_staging_id;

    RAISE EXCEPTION '409 Conflict: Lethal contraindication detected. Prescription automatically flagged and promotion blocked.';
  END IF;

  INSERT INTO medications (
    elder_id, name_nl, name_en, dose_description_nl, dose_description_en, frequency, schedule_times,
    instructions_nl, instructions_en, is_active, start_date
  ) VALUES (
    v_staging.elder_id,
    v_staging.extracted_name_nl,
    v_staging.extracted_name_nl,
    v_staging.extracted_dosage_nl,
    v_staging.extracted_dosage_nl,
    'dagelijks',
    v_staging.proposed_schedule_times::TIME[],
    'Geïmporteerd uit MedMij en medisch goedgekeurd.',
    'Imported from MedMij and clinically approved.',
    true,
    now()::DATE
  ) RETURNING id INTO v_med_id;

  UPDATE fhir_medication_staging
  SET status = 'approved', reviewed_by_id = v_clinician_id, reviewed_at = now(), created_medication_id = v_med_id
  WHERE id = p_staging_id;

  INSERT INTO audit_log (actor_id, actor_role, action, table_name, record_id, elder_id, extra)
  VALUES (
    v_clinician_id,
    v_role::user_role,
    'FHIR_STAGING_PROMOTION',
    'medications',
    v_med_id,
    v_staging.elder_id,
    jsonb_build_object('staging_id', p_staging_id, 'med_name', v_staging.extracted_name_nl)
  );

  RETURN jsonb_build_object('ok', true, 'status', 'approved', 'medication_id', v_med_id);
END;
$$;

CREATE OR REPLACE FUNCTION execute_haven_database_retention_sweeps()
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.device_health_events WHERE created_at < now() - INTERVAL '90 DAYS';
  DELETE FROM public.vital_signs WHERE recorded_at < now() - INTERVAL '20 YEARS';
  DELETE FROM public.audit_log WHERE created_at < now() - INTERVAL '7 YEARS';
  DELETE FROM public.webhook_receipts WHERE received_at < now() - INTERVAL '90 DAYS';
  DELETE FROM public.notifications WHERE created_at < now() - INTERVAL '30 DAYS';
  DELETE FROM public.app_events WHERE occurred_at < now() - INTERVAL '90 DAYS';
  DELETE FROM public.perf_metrics WHERE recorded_at < now() - INTERVAL '90 DAYS';
  DELETE FROM public.push_tokens WHERE is_active = false AND updated_at < now() - INTERVAL '60 DAYS';

  UPDATE public.voice_interactions
  SET transcript_nl = NULL,
      transcript_en = NULL,
      response_text_nl = '[ERASED]',
      response_text_en = '[ERASED]'
  WHERE created_at < now() - INTERVAL '30 DAYS' AND transcript_nl IS NOT NULL;

  DELETE FROM public.voice_interactions WHERE created_at < now() - INTERVAL '90 DAYS';
  DELETE FROM public.slo_alerts WHERE opened_at < now() - INTERVAL '1 YEAR';
  SELECT NULL::void;
$$;

CREATE OR REPLACE FUNCTION soft_purge_profile(p_target_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_already_erased BOOLEAN;
BEGIN
  SELECT (status = 'erased') INTO v_already_erased
  FROM profiles
  WHERE id = p_target_id
  FOR UPDATE;

  IF (v_already_erased IS TRUE) THEN RETURN; END IF;

  UPDATE profiles
  SET status = 'erased',
      full_name = '[ERASED - AVG Art. 17 / GDPR Art. 17]',
      preferred_name = NULL,
      phone_nl = NULL,
      deleted_at = coalesce(deleted_at, now())
  WHERE id = p_target_id;

  UPDATE carer_handover_notes SET notes_nl = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE life_stories SET transcript_nl = '[ERASED]', transcript_en = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE companion_memory SET embedding = NULL, content_nl = '[ERASED]', content_en = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE financial_transactions SET description = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE device_sessions SET revoked_at = now() WHERE profile_id = p_target_id AND revoked_at IS NULL;
  UPDATE medication_ocr_reviews SET notes = NULL WHERE elder_id = p_target_id;
  UPDATE scam_coaching_sessions SET assistant_summary_nl = '[ERASED]', assistant_summary_en = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE voice_interactions SET transcript_nl = NULL, transcript_en = NULL, response_text_nl = '[ERASED]', response_text_en = '[ERASED]' WHERE elder_id = p_target_id;
  UPDATE vital_signs SET context_notes_nl = NULL WHERE elder_id = p_target_id;
  UPDATE documents SET label_nl = '[ERASED]', label_en = '[ERASED]', summary_nl = NULL, summary_en = NULL WHERE elder_id = p_target_id;
  UPDATE deletion_requests SET status = 'completed', completed_at = now() WHERE elder_id = p_target_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_active_emergency_falls()
RETURNS TABLE (
  fall_id UUID,
  elder_id UUID,
  detection_source TEXT,
  confidence NUMERIC,
  status TEXT,
  detected_at TIMESTAMPTZ,
  device_label TEXT,
  device_platform TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS fall_id,
    f.elder_id,
    f.detection_source,
    f.confidence,
    f.status::TEXT,
    f.detected_at,
    d.device_label,
    d.platform
  FROM fall_events f
  LEFT JOIN device_sessions d ON f.device_session_id = d.id
  WHERE f.status IN ('possible', 'no_response')
    AND (d.revoked_at IS NULL OR f.created_at <= d.revoked_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_emergency_profile(p_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_hash TEXT;
  v_token emergency_access_tokens%ROWTYPE;
  v_profile JSONB;
BEGIN
  SELECT encode(digest(p_token, 'sha256'), 'hex') INTO v_hash;
  SELECT * INTO v_token
  FROM emergency_access_tokens
  WHERE token_hash = v_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_token.id IS NULL THEN
    RAISE EXCEPTION '404: Emergency profile non-existent or token invalid';
  END IF;

  UPDATE emergency_access_tokens SET last_used_at = now() WHERE id = v_token.id;
  INSERT INTO emergency_profile_access_log (elder_id, token_id) VALUES (v_token.elder_id, v_token.id);

  SELECT jsonb_build_object(
    'elder_id', ep.elder_id,
    'preferred_name', p.preferred_name,
    'medical_summary_nl', ep.medical_summary_nl,
    'huisarts_name', ep.huisarts_name,
    'huisarts_phone', ep.huisarts_phone,
    'allergies_nl', ep.allergies_nl,
    'conditions_nl', ep.conditions_nl,
    'emergency_contacts', ep.emergency_contacts,
    'medications', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'name_nl', m.name_nl,
        'dose_description_nl', m.dose_description_nl,
        'schedule_times', m.schedule_times,
        'instructions_nl', m.instructions_nl
      )), '[]'::jsonb)
      FROM medications m
      WHERE m.elder_id = ep.elder_id
        AND m.is_active = true
        AND m.deleted_at IS NULL
    )
  ) INTO v_profile
  FROM elder_profiles ep
  JOIN profiles p ON p.id = ep.elder_id
  WHERE ep.elder_id = v_token.elder_id
    AND coalesce(p.status::TEXT, 'active') <> 'erased';

  IF v_profile IS NULL THEN
    RAISE EXCEPTION '404: Emergency profile non-existent or token invalid';
  END IF;

  RETURN v_profile;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Preserve intentionally narrow trust boundaries after the broad PostgREST grant.
REVOKE ALL ON notification_templates FROM anon, authenticated;
GRANT SELECT ON notification_templates TO service_role;

REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM anon, authenticated, service_role;
REVOKE UPDATE, DELETE ON profiles FROM anon, authenticated;
GRANT INSERT ON profiles TO authenticated;
GRANT UPDATE (preferred_name, phone_nl, locale, high_contrast, font_size_multiplier) ON profiles TO authenticated;

GRANT SELECT ON family_location_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_emergency_profile(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_elder_data(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION compute_daily_status_digests_batch() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_stale_device_sessions_batch() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION promote_fhir_medication_staging(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION execute_haven_database_retention_sweeps() TO service_role;
GRANT EXECUTE ON FUNCTION soft_purge_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_active_emergency_falls() TO service_role;

COMMIT;
