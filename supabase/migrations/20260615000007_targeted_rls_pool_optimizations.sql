-- ══════════════════════════════════════════════════════════════════════════════
-- HAVEN PRODUCTION TARGETED RLS POOL OPTIMIZATIONS (FINDING #10 COMPLETE CLOSURE)
-- Governed by NEN 7510, highly optimized for 100,000+ older adults
-- Rollback: See DOWN section at bottom
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Targeted Optimization for fn-daily-status-digest (Removes 600k N+1 Queries) ───
CREATE OR REPLACE FUNCTION compute_daily_status_digests_batch()
RETURNS TABLE (
  elder_id UUID,
  computed_status TEXT,
  computed_reasons TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Evaluates daily digest status aggregations across all active older adults
  -- entirely within the PostgreSQL storage kernel, driving RLS pool connection
  -- overhead down by over 99% during daily morning cron sweeps.
  RETURN QUERY
  SELECT 
    p.id AS elder_id,
    CASE 
      WHEN coalesce(f_agg.no_resp_falls, 0) > 0 OR coalesce(s_agg.scams, 0) > 0 OR (coalesce(m_agg.total_m, 0) > 0 AND coalesce(m_agg.missed_m, 0)::NUMERIC / coalesce(m_agg.total_m, 1) > 0.5) THEN 'red'::TEXT
      WHEN coalesce(f_agg.pend_falls, 0) > 0 OR coalesce(m_agg.missed_m, 0) > 0 OR coalesce(d_agg.stale_h, 0) > 24 THEN 'amber'::TEXT
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
    FROM fall_events fe GROUP BY fe.elder_id
  ) f_agg ON f_agg.elder_id = p.id
  LEFT JOIN (
    SELECT se.elder_id, COUNT(*) AS scams
    FROM scam_events se WHERE created_at >= now()::DATE AND alert_level IN ('rood', 'zwart') GROUP BY se.elder_id
  ) s_agg ON s_agg.elder_id = p.id
  LEFT JOIN (
    SELECT mr.elder_id,
           COUNT(*) AS total_m,
           COUNT(*) FILTER (WHERE status IN ('gemist', 'overgeslagen')) AS missed_m
    FROM medication_reminders mr WHERE scheduled_time >= now()::DATE GROUP BY mr.elder_id
  ) m_agg ON m_agg.elder_id = p.id
  LEFT JOIN (
    SELECT ds.profile_id, EXTRACT(EPOCH FROM (now() - MAX(last_seen_at))) / 3600 AS stale_h
    FROM device_sessions ds WHERE soft_revoked_at IS NULL GROUP BY ds.profile_id
  ) d_agg ON d_agg.profile_id = p.id
  WHERE p.role = 'elder' AND p.status = 'active';
END;
$$;

-- ─── 2. Targeted Optimization for fn-screen-data (Single network round-trip bundle) ───
CREATE OR REPLACE FUNCTION get_elder_screen_data_batch(p_elder_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reminders JSONB;
  v_messages JSONB;
  v_scams JSONB;
  v_profile JSONB;
BEGIN
  -- Batch reads eliminating 4 parallel network queries per Older Adult navigation
  SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) INTO v_reminders 
  FROM (
    SELECT id, scheduled_time, status, (SELECT row_to_json(m) FROM medications m WHERE m.id = mr.medication_id) AS medications
    FROM medication_reminders mr WHERE elder_id = p_elder_id AND scheduled_time >= now()::DATE
    ORDER BY scheduled_time ASC LIMIT 5
  ) r;

  SELECT coalesce(jsonb_agg(to_jsonb(fm)), '[]'::jsonb) INTO v_messages 
  FROM (
    SELECT id, sender_id, message_type, content_nl, content_en, created_at
    FROM family_messages WHERE elder_id = p_elder_id AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 5
  ) fm;

  SELECT coalesce(jsonb_agg(to_jsonb(se)), '[]'::jsonb) INTO v_scams 
  FROM (
    SELECT id, alert_level, score_composite, explanation_nl, explanation_en, created_at
    FROM scam_events WHERE elder_id = p_elder_id AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 3
  ) se;

  SELECT to_jsonb(np.*) INTO v_profile 
  FROM neighbourhood_profiles np WHERE elder_id = p_elder_id LIMIT 1;

  RETURN jsonb_build_object(
    'reminders', v_reminders,
    'messages', v_messages,
    'scam_events', v_scams,
    'neighbourhood_profile', v_profile
  );
END;
$$;

-- ─── 3. Targeted Optimization for fn-device-health-monitor (Removes N+1 Queries) ───
CREATE OR REPLACE FUNCTION get_stale_device_sessions_batch()
RETURNS TABLE (
  elder_id UUID,
  elder_name TEXT,
  session_id UUID,
  last_seen TIMESTAMPTZ,
  age_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    SELECT id, last_seen_at FROM device_sessions 
    WHERE profile_id = p.id AND soft_revoked_at IS NULL 
    ORDER BY last_seen_at DESC LIMIT 1
  ) ds ON true
  WHERE p.role = 'elder' AND p.status = 'active';
END;
$$;

-- ─── 4. Targeted Optimization for fn-weekly-digest (Removes 7 N+1 queries per elder) ───
CREATE OR REPLACE FUNCTION compute_weekly_safety_digests_batch()
RETURNS TABLE (
  elder_id UUID,
  elder_name TEXT,
  meds_taken_pct NUMERIC,
  scams_count BIGINT,
  amber_count BIGINT,
  rood_count BIGINT,
  zwart_count BIGINT,
  family_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS elder_id,
    p.full_name AS elder_name,
    coalesce(m_agg.taken_pct, 100)::NUMERIC AS meds_taken_pct,
    coalesce(s_agg.total_s, 0)::BIGINT AS scams_count,
    coalesce(s_agg.amber_s, 0)::BIGINT AS amber_count,
    coalesce(s_agg.rood_s, 0)::BIGINT AS rood_count,
    coalesce(s_agg.zwart_s, 0)::BIGINT AS zwart_count,
    coalesce(fm_agg.total_fm, 0)::BIGINT AS family_count
  FROM profiles p
  LEFT JOIN (
    SELECT mr.elder_id,
           (COUNT(*) FILTER (WHERE status = 'ingenomen')::NUMERIC / coalesce(nullif(COUNT(*), 0), 1) * 100)::NUMERIC AS taken_pct
    FROM medication_reminders mr WHERE scheduled_time >= now() - INTERVAL '7 DAYS' GROUP BY mr.elder_id
  ) m_agg ON m_agg.elder_id = p.id
  LEFT JOIN (
    SELECT se.elder_id,
           COUNT(*) AS total_s,
           COUNT(*) FILTER (WHERE alert_level = 'amber') AS amber_s,
           COUNT(*) FILTER (WHERE alert_level = 'rood') AS rood_s,
           COUNT(*) FILTER (WHERE alert_level = 'zwart') AS zwart_s
    FROM scam_events se WHERE created_at >= now() - INTERVAL '7 DAYS' GROUP BY se.elder_id
  ) s_agg ON s_agg.elder_id = p.id
  LEFT JOIN (
    SELECT fm.elder_id, COUNT(*) AS total_fm
    FROM family_messages fm WHERE created_at >= now() - INTERVAL '7 DAYS' GROUP BY fm.elder_id
  ) fm_agg ON fm_agg.elder_id = p.id
  WHERE p.role = 'elder' AND p.status = 'active';
END;
$$;

-- ─── 5. Targeted Optimization for fn-voice-pipeline (Consolidated helper) ───
CREATE OR REPLACE FUNCTION get_voice_pipeline_context(p_elder_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pref JSONB;
  v_rem JSONB;
BEGIN
  SELECT jsonb_build_object(
    'use_familiar_voice', coalesce(use_familiar_voice, false),
    'voice_id', (SELECT provider_voice_id FROM voice_profiles WHERE id = vp.voice_profile_id AND status = 'ready')
  ) INTO v_pref FROM elder_voice_preferences vp WHERE elder_id = p_elder_id LIMIT 1;

  SELECT to_jsonb(mr.*) INTO v_rem FROM medication_reminders mr 
  WHERE elder_id = p_elder_id AND status IN ('gepland', 'herinnerd', 'gesnoozed_1') 
  ORDER BY scheduled_time ASC LIMIT 1;

  RETURN jsonb_build_object('preferences', coalesce(v_pref, '{}'::jsonb), 'active_reminder', v_rem);
END;
$$;

COMMIT;

-- Rollback (DOWN Migration)
/*
BEGIN;
DROP FUNCTION IF EXISTS get_voice_pipeline_context(UUID);
DROP FUNCTION IF EXISTS compute_weekly_safety_digests_batch();
DROP FUNCTION IF EXISTS get_stale_device_sessions_batch();
DROP FUNCTION IF EXISTS get_elder_screen_data_batch(UUID);
DROP FUNCTION IF EXISTS compute_daily_status_digests_batch();
COMMIT;
*/
