-- ─── Round 2 Hardening Migration ───
-- P0-9: Add UNIQUE constraint on idempotency_keys.key_hash for atomic upsert
-- P0-10: Add ratelimit_check RPC for Supabase-backed rate limiting

-- P0-9: Ensure idempotency_keys.key_hash is unique for atomic INSERT ... ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_key_hash_unique'
  ) THEN
    ALTER TABLE idempotency_keys ADD CONSTRAINT idempotency_keys_key_hash_unique UNIQUE (key_hash);
  END IF;
END $$;

-- Add status, claimed_at, error_message columns for the new idempotency state machine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idempotency_keys' AND column_name = 'status'
  ) THEN
    ALTER TABLE idempotency_keys ADD COLUMN status text NOT NULL DEFAULT 'completed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idempotency_keys' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE idempotency_keys ADD COLUMN claimed_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idempotency_keys' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE idempotency_keys ADD COLUMN error_message text;
  END IF;
END $$;

-- P0-10: Supabase-backed atomic rate limiter function
CREATE OR REPLACE FUNCTION ratelimit_check(
  p_key_hash text,
  p_window_start timestamptz,
  p_max_requests int
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
BEGIN
  -- Count requests in the current window for this key
  SELECT COUNT(*) INTO v_count
  FROM perf_metrics
  WHERE fn_name = 'ratelimit'
    AND recorded_at >= p_window_start
    AND status = p_key_hash;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Record this request
  INSERT INTO perf_metrics (fn_name, duration_ms, status, env, recorded_at)
  VALUES ('ratelimit', 0, p_key_hash, 'system', now());

  RETURN true;
END $$;
