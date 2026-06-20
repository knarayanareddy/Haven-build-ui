🗄️ SECTION 1 — Full Database Schema (Supabase / PostgreSQL)
Design Principles
All tables use UUID primary keys
Row-Level Security (RLS) on every table — elder owns their data
created_at / updated_at on every table (auto via triggers)
Soft deletes (deleted_at) everywhere — never hard delete elder data
pgvector extension enabled for semantic search (scam patterns, life story retrieval)
postgis extension for location features
Extensions
SQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for semantic similarity
CREATE EXTENSION IF NOT EXISTS "postgis";       -- geospatial features
CREATE EXTENSION IF NOT EXISTS "pg_cron";       -- scheduled jobs (digest generation)
ENUM Types
SQL

-- ─────────────────────────────────────────────
-- GLOBAL ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'elder',
  'family_primary',    -- full dashboard access
  'family_secondary',  -- read-only, limited alerts
  'carer_professional',
  'system'
);

CREATE TYPE alert_level AS ENUM (
  'amber',
  'red',
  'black'
);

CREATE TYPE threat_type AS ENUM (
  'impersonation',
  'urgency_pressure',
  'unusual_payment',
  'fear_reward',
  'government_lookalike',
  'romance_grooming',
  'tech_support',
  'lottery_prize',
  'investment',
  'grandparent_scam',
  'unknown'
);

CREATE TYPE channel AS ENUM (
  'phone_call',
  'sms',
  'email',
  'web',
  'app',
  'in_person'
);

CREATE TYPE medication_frequency AS ENUM (
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'every_other_day',
  'weekly',
  'as_needed',
  'custom'
);

CREATE TYPE reminder_status AS ENUM (
  'pending',
  'taken',
  'snoozed',
  'missed',
  'skipped'
);

CREATE TYPE wellness_score AS ENUM (
  'great',
  'okay',
  'not_great'
);

CREATE TYPE notification_type AS ENUM (
  'scam_alert',
  'medication_missed',
  'medication_refill',
  'wellness_concern',
  'location_alert',
  'financial_anomaly',
  'document_sensitive',
  'check_in_missed',
  'family_message',
  'story_archived',
  'carer_log',
  'safeguarding_flag',
  'cognitive_change',
  'night_alert',
  'driving_anomaly'
);

CREATE TYPE relationship_type AS ENUM (
  'spouse',
  'child',
  'grandchild',
  'sibling',
  'friend',
  'neighbour',
  'carer',
  'other'
);

CREATE TYPE document_category AS ENUM (
  'will',
  'power_of_attorney',
  'deed',
  'trust',
  'medical_directive',
  'insurance',
  'tax',
  'bank_statement',
  'medical_letter',
  'prescription',
  'general',
  'care_plan',
  'emergency_medical_profile'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'completed',
  'snoozed',
  'cancelled'
);

CREATE TYPE story_status AS ENUM (
  'recording',
  'transcribed',
  'reviewed',
  'archived',
  'printed'
);

CREATE TYPE connection_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'blocked'
);

CREATE TYPE cognitive_response_type AS ENUM (
  'correct',
  'incorrect',
  'skipped',
  'declined'
);

CREATE TYPE transport_status AS ENUM (
  'not_needed',
  'family_arranging',
  'booked',
  'confirmed',
  'completed'
);

CREATE TYPE vital_type AS ENUM (
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'blood_oxygen',
  'blood_glucose',
  'weight',
  'temperature'
);

CREATE TYPE incident_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE safeguarding_category AS ENUM (
  'financial_abuse',
  'physical_abuse',
  'emotional_abuse',
  'neglect',
  'self_neglect',
  'domestic_abuse',
  'modern_slavery',
  'discriminatory_abuse',
  'organisational_abuse'
);
Core Identity & Auth
SQL

-- ─────────────────────────────────────────────
-- 1. PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  user_role NOT NULL DEFAULT 'elder',
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  preferred_name        TEXT,                          -- "Margaret" vs "Mrs. Thompson"
  date_of_birth         DATE,
  phone_e164            TEXT,                          -- E.164 format: +447700900000
  country_code          CHAR(2) NOT NULL DEFAULT 'GB', -- ISO 3166-1 alpha-2
  locale                TEXT NOT NULL DEFAULT 'en-GB', -- BCP 47 language tag
  timezone              TEXT NOT NULL DEFAULT 'Europe/London',
  avatar_url            TEXT,
  onboarding_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  tts_voice_id          TEXT,                          -- ElevenLabs voice ID
  high_contrast_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  font_size_multiplier  NUMERIC(3,2) NOT NULL DEFAULT 1.0, -- 1.0–2.0
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 2. ELDER PROFILES (elder-specific extension)
-- ─────────────────────────────────────────────

CREATE TABLE elder_profiles (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Medical baseline
  nhs_number                TEXT,                      -- UK; SSN equivalent field for US
  gp_name                   TEXT,
  gp_practice               TEXT,
  gp_phone                  TEXT,
  allergies                 TEXT[],
  medical_conditions        TEXT[],
  blood_type                TEXT,
  
  -- Emergency contact (pre-app fallback)
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,
  emergency_contact_relation relationship_type,
  
  -- Cognition & mobility flags (set by family, not displayed to elder)
  cognitive_support_level   SMALLINT DEFAULT 0 CHECK (cognitive_support_level BETWEEN 0 AND 3),
  -- 0=none, 1=light prompts, 2=frequent prompts, 3=full cognitive support
  mobility_flag             BOOLEAN DEFAULT FALSE,
  fall_risk_flag            BOOLEAN DEFAULT FALSE,
  driving_monitor_enabled   BOOLEAN DEFAULT FALSE,
  
  -- Night safety
  night_mode_enabled        BOOLEAN DEFAULT FALSE,
  night_mode_start          TIME DEFAULT '22:00',
  night_mode_end            TIME DEFAULT '07:00',
  
  -- Safe zone for COMPASS
  safe_zone_centre          GEOGRAPHY(POINT, 4326),
  safe_zone_radius_metres   INTEGER DEFAULT 2000,
  safe_zone_active          BOOLEAN DEFAULT FALSE,
  safe_zone_hours_only      BOOLEAN DEFAULT TRUE,      -- only monitor outside safe_zone_hours
  safe_zone_start           TIME DEFAULT '22:00',
  safe_zone_end             TIME DEFAULT '07:00',
  
  -- Language / cultural
  primary_language          TEXT DEFAULT 'en',
  secondary_language        TEXT,
  cultural_profile          TEXT,                      -- free text for carer notes
  
  -- Bereavement
  bereavement_active        BOOLEAN DEFAULT FALSE,
  bereavement_start_date    DATE,
  bereavement_end_date      DATE,                      -- auto: 30 days after start
  
  -- Legacy / digital estate
  legacy_setup_complete     BOOLEAN DEFAULT FALSE,
  legacy_last_reviewed      DATE,
  
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. FAMILY RELATIONSHIPS
-- ─────────────────────────────────────────────

CREATE TABLE family_relationships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type     relationship_type NOT NULL,
  is_primary_contact    BOOLEAN NOT NULL DEFAULT FALSE,  -- receives all alerts
  can_add_tasks         BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_location     BOOLEAN NOT NULL DEFAULT FALSE,  -- elder must consent
  can_view_financials   BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_messages     BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_medications  BOOLEAN NOT NULL DEFAULT TRUE,
  alert_scam            BOOLEAN NOT NULL DEFAULT TRUE,
  alert_medication      BOOLEAN NOT NULL DEFAULT TRUE,
  alert_wellness        BOOLEAN NOT NULL DEFAULT TRUE,
  alert_location        BOOLEAN NOT NULL DEFAULT FALSE,
  alert_financial       BOOLEAN NOT NULL DEFAULT FALSE,
  notification_method   TEXT[] DEFAULT ARRAY['push', 'email'],
  elder_consented       BOOLEAN NOT NULL DEFAULT FALSE,  -- elder must approve each relationship
  elder_consented_at    TIMESTAMPTZ,
  invite_token          TEXT UNIQUE,                    -- for onboarding invite flow
  invite_expires_at     TIMESTAMPTZ,
  status                connection_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (elder_id, family_member_id)
);

-- ─────────────────────────────────────────────
-- 4. CARER RELATIONSHIPS
-- ─────────────────────────────────────────────

CREATE TABLE carer_relationships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carer_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agency_name           TEXT,
  start_date            DATE,
  end_date              DATE,
  scheduled_days        TEXT[],                        -- ['monday','wednesday','friday']
  scheduled_time_start  TIME,
  scheduled_time_end    TIME,
  permissions           JSONB NOT NULL DEFAULT '{}',
  status                connection_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
PILLAR 1 — SHIELD Schema
SQL

-- ─────────────────────────────────────────────
-- 5. SCAM EVENTS
-- The core audit log of every threat HAVEN detects
-- ─────────────────────────────────────────────

CREATE TABLE scam_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Signal metadata
  channel                 channel NOT NULL,
  raw_signal_hash         TEXT,                        -- SHA-256 of raw content (not stored in full for privacy)
  sender_identifier       TEXT,                        -- phone number, email, domain (hashed if sensitive)
  sender_identifier_type  TEXT,                        -- 'phone','email','domain','app'
  contact_id              UUID REFERENCES contacts(id),-- if known contact
  
  -- Classification
  threat_types            threat_type[],
  alert_level             alert_level NOT NULL,
  confidence_score        NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Pipeline scores (for auditability)
  heuristic_score         NUMERIC(4,3),
  context_score           NUMERIC(4,3),
  llm_score               NUMERIC(4,3),
  
  -- Plain-English explanation (generated by LLM)
  explanation             TEXT,                        -- shown to elder
  explanation_family      TEXT,                        -- shown in family digest
  matched_patterns        TEXT[],                      -- e.g. ['urgency_words','gift_card_payment']
  
  -- Transcript / content analysis
  transcript_snippet      TEXT,                        -- first 500 chars only
  transcript_vector       vector(1536),                -- for semantic similarity search
  
  -- Response
  elder_dismissed         BOOLEAN DEFAULT FALSE,
  elder_dismissed_at      TIMESTAMPTZ,
  elder_trusted_contact   BOOLEAN DEFAULT FALSE,
  family_notified         BOOLEAN DEFAULT FALSE,
  family_notified_at      TIMESTAMPTZ,
  
  -- Transaction intercept (if PILLAR 1.1 Black level)
  transaction_intercepted BOOLEAN DEFAULT FALSE,
  transaction_amount      NUMERIC(12,2),
  transaction_currency    CHAR(3),
  transaction_type        TEXT,                        -- 'wire','gift_card','crypto','bank_transfer'
  
  -- Post-event
  confirmed_scam          BOOLEAN,                     -- set by family review
  reported_to_ftc         BOOLEAN DEFAULT FALSE,
  reported_to_ic3         BOOLEAN DEFAULT FALSE,
  
  -- Call coaching (1.2)
  coaching_card_shown     BOOLEAN DEFAULT FALSE,
  coaching_card_duration  INTEGER,                     -- seconds visible
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. CONTACTS
-- Known contacts for relationship graph & scam context
-- ─────────────────────────────────────────────

CREATE TABLE contacts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name            TEXT NOT NULL,
  phone_numbers           TEXT[],
  email_addresses         TEXT[],
  relationship_label      TEXT,
  is_trusted              BOOLEAN NOT NULL DEFAULT FALSE,
  trust_set_by            TEXT,                        -- 'elder','family','system'
  trust_set_at            TIMESTAMPTZ,
  
  -- Social engineering pattern tracking (1.9)
  contact_frequency_7d    INTEGER DEFAULT 0,
  contact_frequency_30d   INTEGER DEFAULT 0,
  financial_request_count INTEGER DEFAULT 0,
  last_financial_request  TIMESTAMPTZ,
  grooming_risk_score     NUMERIC(4,3) DEFAULT 0,
  grooming_risk_updated   TIMESTAMPTZ,
  
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. DOMAIN REPUTATION CACHE
-- ─────────────────────────────────────────────

CREATE TABLE domain_reputation_cache (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain              TEXT NOT NULL UNIQUE,
  registration_date   DATE,
  domain_age_days     INTEGER,
  is_gov_lookalike    BOOLEAN DEFAULT FALSE,
  is_known_scam       BOOLEAN DEFAULT FALSE,
  reputation_score    NUMERIC(4,3),                    -- 0=very suspicious, 1=trusted
  data_source         TEXT,
  cached_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ─────────────────────────────────────────────
-- 8. PHONE REPUTATION CACHE
-- ─────────────────────────────────────────────

CREATE TABLE phone_reputation_cache (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_e164          TEXT NOT NULL UNIQUE,
  report_count        INTEGER DEFAULT 0,
  last_reported       TIMESTAMPTZ,
  categories          TEXT[],
  is_known_scam       BOOLEAN DEFAULT FALSE,
  reputation_score    NUMERIC(4,3),
  data_source         TEXT,                            -- 'hiya','truecaller','ftc','internal'
  cached_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours')
);

-- ─────────────────────────────────────────────
-- 9. DOCUMENTS & VAULT (1.5)
-- ─────────────────────────────────────────────

CREATE TABLE documents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by             UUID NOT NULL REFERENCES profiles(id),
  category                document_category NOT NULL,
  title                   TEXT NOT NULL,
  
  -- Storage
  storage_path            TEXT NOT NULL,               -- Supabase Storage path (AES-256 encrypted bucket)
  file_hash               TEXT NOT NULL,               -- SHA-256 for integrity verification
  file_size_bytes         INTEGER,
  mime_type               TEXT,
  
  -- OCR / AI processing
  plain_text_summary      TEXT,                        -- GPT-4o Vision output
  plain_text_summary_3pts TEXT[],                      -- 3 key points for elder
  questions_for_doctor    TEXT[],                      -- if medical doc
  is_sensitive_legal      BOOLEAN DEFAULT FALSE,       -- triggers 24h family notification
  
  -- Cooling off (for sensitive legal docs)
  family_notified         BOOLEAN DEFAULT FALSE,
  family_notified_at      TIMESTAMPTZ,
  cooling_off_expires     TIMESTAMPTZ,                 -- 24h after upload
  elder_confirmed         BOOLEAN DEFAULT FALSE,
  elder_confirmed_at      TIMESTAMPTZ,
  
  -- NFC / emergency profile
  in_emergency_profile    BOOLEAN DEFAULT FALSE,       -- included in NFC/QR view
  
  -- Metadata
  document_date           DATE,
  notes                   TEXT,
  tags                    TEXT[],
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 10. FINANCIAL GUARDIAN (1.7)
-- ─────────────────────────────────────────────

CREATE TABLE financial_accounts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider                TEXT NOT NULL,               -- 'plaid','truelayer','manual'
  institution_name        TEXT NOT NULL,
  account_type            TEXT,                        -- 'current','savings','credit'
  account_mask            TEXT,                        -- last 4 digits only
  plaid_item_id           TEXT,
  plaid_access_token      TEXT,                        -- encrypted at rest
  truelayer_consent_id    TEXT,
  alert_threshold         NUMERIC(12,2) DEFAULT 200.00,
  is_active               BOOLEAN DEFAULT TRUE,
  last_synced             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE financial_transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id              UUID NOT NULL REFERENCES financial_accounts(id),
  external_tx_id          TEXT UNIQUE,
  amount                  NUMERIC(12,2) NOT NULL,
  currency                CHAR(3) NOT NULL DEFAULT 'GBP',
  direction               TEXT CHECK (direction IN ('credit','debit')),
  merchant_name           TEXT,
  merchant_category       TEXT,
  is_new_payee            BOOLEAN DEFAULT FALSE,
  is_anomalous            BOOLEAN DEFAULT FALSE,
  anomaly_reason          TEXT,
  anomaly_score           NUMERIC(4,3),
  scam_event_id           UUID REFERENCES scam_events(id),
  family_alerted          BOOLEAN DEFAULT FALSE,
  family_alerted_at       TIMESTAMPTZ,
  elder_confirmed         BOOLEAN,
  elder_confirmed_at      TIMESTAMPTZ,
  transaction_date        TIMESTAMPTZ NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. WEEKLY SAFETY DIGEST
-- ─────────────────────────────────────────────

CREATE TABLE safety_digests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id        UUID NOT NULL REFERENCES profiles(id),
  week_start              DATE NOT NULL,
  week_end                DATE NOT NULL,
  scams_intercepted       INTEGER DEFAULT 0,
  suspicious_calls        INTEGER DEFAULT 0,
  safe_activity_summary   TEXT,
  one_thing_to_discuss    TEXT,
  digest_html             TEXT,
  sent_at                 TIMESTAMPTZ,
  opened_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (elder_id, family_member_id, week_start)
);
PILLAR 2 — ANCHOR Schema
SQL

-- ─────────────────────────────────────────────
-- 12. MEDICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE medications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_by                UUID NOT NULL REFERENCES profiles(id),
  
  -- Drug identity
  drug_name               TEXT NOT NULL,               -- generic name
  brand_name              TEXT,
  drug_rxcui              TEXT,                        -- RxNorm CUI for US
  drug_snomed_code        TEXT,                        -- SNOMED CT for UK
  ndc_code                TEXT,                        -- National Drug Code (US)
  
  -- Dosage
  dosage_value            NUMERIC(8,3),
  dosage_unit             TEXT,                        -- 'mg','mcg','ml','IU'
  form                    TEXT,                        -- 'tablet','capsule','liquid','patch','inhaler'
  colour                  TEXT,
  shape                   TEXT,
  plain_description       TEXT NOT NULL,               -- "Your white oval pill for your heart"
  
  -- Schedule
  frequency               medication_frequency NOT NULL,
  custom_schedule         JSONB,                       -- for 'custom' frequency
  times_of_day            TIME[],
  take_with_food          BOOLEAN DEFAULT FALSE,
  take_with_water         BOOLEAN DEFAULT TRUE,
  special_instructions    TEXT,
  
  -- Supply management
  quantity_on_hand        INTEGER,
  days_supply             INTEGER,
  refill_reminder_days    INTEGER DEFAULT 5,
  last_refill_date        DATE,
  next_refill_date        DATE,
  pharmacy_name           TEXT,
  pharmacy_phone          TEXT,
  
  -- Prescriber
  prescribing_gp          TEXT,
  prescription_date       DATE,
  fhir_medication_id      TEXT,                        -- if synced from EHR
  
  -- Interaction monitoring
  interaction_flags       TEXT[],
  interaction_checked_at  TIMESTAMPTZ,
  
  -- OCR source
  source_image_path       TEXT,
  ocr_confidence          NUMERIC(4,3),
  ocr_verified_by_family  BOOLEAN DEFAULT FALSE,
  
  is_active               BOOLEAN DEFAULT TRUE,
  started_at              DATE,
  ended_at                DATE,
  end_reason              TEXT,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 13. MEDICATION REMINDERS
-- Individual scheduled reminder instances
-- ─────────────────────────────────────────────

CREATE TABLE medication_reminders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id           UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_at            TIMESTAMPTZ NOT NULL,
  status                  reminder_status NOT NULL DEFAULT 'pending',
  
  -- Interaction tracking
  first_reminded_at       TIMESTAMPTZ,
  snooze_count            INTEGER DEFAULT 0,
  last_snoozed_at         TIMESTAMPTZ,
  snooze_duration_minutes INTEGER DEFAULT 15,
  confirmed_at            TIMESTAMPTZ,
  confirmation_method     TEXT,                        -- 'tap','voice','auto'
  
  -- Escalation
  family_alerted          BOOLEAN DEFAULT FALSE,
  family_alerted_at       TIMESTAMPTZ,
  alert_trigger           TEXT,                        -- 'missed_2x','missed_consecutive'
  
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 14. TASKS
-- ─────────────────────────────────────────────

CREATE TABLE tasks (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by              UUID NOT NULL REFERENCES profiles(id),
  created_by_role         user_role NOT NULL,
  
  title                   TEXT NOT NULL,
  spoken_title            TEXT,                        -- how HAVEN reads it aloud
  due_at                  TIMESTAMPTZ,
  all_day                 BOOLEAN DEFAULT FALSE,
  recurrence_rule         TEXT,                        -- iCal RRULE string
  
  status                  task_status NOT NULL DEFAULT 'pending',
  completed_at            TIMESTAMPTZ,
  completed_by            UUID REFERENCES profiles(id),
  
  -- Family-added tasks show attribution
  family_attribution      TEXT,                        -- "A reminder from Sarah:"
  
  -- Appointment-specific fields
  is_medical_appointment  BOOLEAN DEFAULT FALSE,
  location                TEXT,
  transport_status        transport_status DEFAULT 'not_needed',
  transport_booked_by     UUID REFERENCES profiles(id),
  transport_provider      TEXT,
  transport_booking_ref   TEXT,
  
  -- Reminders
  reminder_minutes_before INTEGER[] DEFAULT ARRAY[1440, 60], -- 24h, 1h before
  
  voice_input_raw         TEXT,                        -- original spoken phrase
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 15. WELLNESS CHECK-INS
-- ─────────────────────────────────────────────

CREATE TABLE wellness_checkins (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score                   wellness_score NOT NULL,
  notes                   TEXT,                        -- optional elder voice note
  
  -- Derived context
  consecutive_not_great   INTEGER DEFAULT 0,           -- computed by trigger
  family_alerted          BOOLEAN DEFAULT FALSE,
  family_alerted_at       TIMESTAMPTZ,
  
  -- Hydration / nutrition links
  hydration_logged        BOOLEAN DEFAULT FALSE,
  nutrition_log           TEXT,                        -- brief voice log
  
  -- Passive check-in context
  is_passive_checkin      BOOLEAN DEFAULT FALSE,       -- triggered by inactivity sensor
  phone_inactive_minutes  INTEGER,
  
  checked_in_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 16. VITAL SIGNS
-- ─────────────────────────────────────────────

CREATE TABLE vital_signs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vital_type              vital_type NOT NULL,
  value                   NUMERIC(10,3) NOT NULL,
  unit                    TEXT NOT NULL,
  reading_source          TEXT,                        -- 'manual','bluetooth','healthkit','google_health'
  device_name             TEXT,
  context_notes           TEXT,
  
  -- Threshold alerting
  above_threshold         BOOLEAN DEFAULT FALSE,
  threshold_value         NUMERIC(10,3),
  family_alerted          BOOLEAN DEFAULT FALSE,
  gp_alert_suggested      BOOLEAN DEFAULT FALSE,
  
  recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 17. HYDRATION LOGS
-- ─────────────────────────────────────────────

CREATE TABLE hydration_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_ml               INTEGER,
  nudge_acknowledged      BOOLEAN DEFAULT FALSE,
  logged_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
PILLAR 3 — CIRCLE Schema
SQL

-- ─────────────────────────────────────────────
-- 18. FAMILY MESSAGES
-- ─────────────────────────────────────────────

CREATE TABLE family_messages (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id               UUID NOT NULL REFERENCES profiles(id),
  recipient_id            UUID NOT NULL REFERENCES profiles(id),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  
  message_type            TEXT NOT NULL CHECK (message_type IN (
                            'text','voice_note','thinking_of_you','photo',
                            'video_hello','drawing','life_story_share'
                          )),
  text_content            TEXT,
  media_path              TEXT,                        -- Supabase Storage
  duration_seconds        INTEGER,                     -- for voice/video
  
  -- Grandchild messages
  is_from_grandchild      BOOLEAN DEFAULT FALSE,
  grandchild_age          INTEGER,
  
  read_at                 TIMESTAMPTZ,
  read_by_elder           BOOLEAN DEFAULT FALSE,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 19. LIFE STORIES (Archive)
-- ─────────────────────────────────────────────

CREATE TABLE life_story_prompts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text             TEXT NOT NULL,
  prompt_category         TEXT,                        -- 'childhood','family','work','wisdom','place'
  locale                  TEXT NOT NULL DEFAULT 'en',
  week_number             INTEGER,                     -- 1–52 rotation
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE life_stories (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id               UUID REFERENCES life_story_prompts(id),
  
  -- Content
  audio_path              TEXT,                        -- original recording
  transcript              TEXT,                        -- Whisper transcription
  transcript_vector       vector(1536),                -- for story search/recall
  edited_transcript       TEXT,                        -- family-edited version
  plain_title             TEXT,                        -- auto-generated short title
  
  status                  story_status NOT NULL DEFAULT 'recording',
  duration_seconds        INTEGER,
  
  -- Archival / book generation
  included_in_book        BOOLEAN DEFAULT FALSE,
  book_page_number        INTEGER,
  book_generated_at       TIMESTAMPTZ,
  book_pdf_path           TEXT,
  
  -- Family access
  shared_with_family      BOOLEAN DEFAULT TRUE,
  family_reacted          JSONB DEFAULT '{}',          -- {family_id: 'heart'|'smile'|'tearful'}
  
  recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 20. MEMORY LANE (3.7)
-- ─────────────────────────────────────────────

CREATE TABLE memory_lane_photos (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by             UUID NOT NULL REFERENCES profiles(id),
  
  photo_path              TEXT NOT NULL,
  caption                 TEXT,
  photo_date              DATE,
  photo_year              INTEGER,
  location_label          TEXT,
  people_in_photo         TEXT[],
  
  -- Anniversary / date surfacing
  anniversary_month       INTEGER CHECK (anniversary_month BETWEEN 1 AND 12),
  anniversary_day         INTEGER CHECK (anniversary_day BETWEEN 1 AND 31),
  surface_on_anniversary  BOOLEAN DEFAULT FALSE,
  
  -- Deceased loved ones
  is_memorial             BOOLEAN DEFAULT FALSE,
  memorial_person_name    TEXT,
  memorial_person_birthday DATE,
  
  last_surfaced_at        TIMESTAMPTZ,
  surface_count           INTEGER DEFAULT 0,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 21. NEIGHBOURHOOD CONNECTIONS (3.1)
-- ─────────────────────────────────────────────

CREATE TABLE elder_interests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_tag            TEXT NOT NULL,               -- 'gardening','chess','music'
  interest_emoji          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (elder_id, interest_tag)
);

CREATE TABLE neighbourhood_connections (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id            UUID NOT NULL REFERENCES profiles(id),
  recipient_id            UUID NOT NULL REFERENCES profiles(id),
  
  status                  connection_status NOT NULL DEFAULT 'pending',
  match_reason            TEXT,                        -- shared interest tags
  shared_interests        TEXT[],
  
  initiator_consented     BOOLEAN DEFAULT FALSE,
  recipient_consented     BOOLEAN DEFAULT FALSE,
  
  -- Fuzzy location at time of match (not stored precisely)
  match_distance_metres   INTEGER,
  match_neighbourhood     TEXT,                        -- e.g. "Islington" — not address
  
  first_met_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 22. COMMUNITY EVENTS (3.5)
-- ─────────────────────────────────────────────

CREATE TABLE community_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  description             TEXT,
  organiser               TEXT,
  event_source            TEXT,                        -- 'eventbrite','age_uk','aarp','council','manual'
  external_event_id       TEXT,
  
  start_at                TIMESTAMPTZ NOT NULL,
  end_at                  TIMESTAMPTZ,
  is_free                 BOOLEAN DEFAULT FALSE,
  is_accessible           BOOLEAN,
  is_daytime              BOOLEAN,                     -- computed: 08:00–18:00
  
  venue_name              TEXT,
  venue_address           TEXT,
  location                GEOGRAPHY(POINT, 4326),
  
  categories              TEXT[],
  interest_tags           TEXT[],
  
  url                     TEXT,
  phone_contact           TEXT,
  
  is_verified             BOOLEAN DEFAULT FALSE,
  is_active               BOOLEAN DEFAULT TRUE,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_interests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id                UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  marked_by               UUID REFERENCES profiles(id),  -- elder or family
  status                  TEXT CHECK (status IN ('interested','attending','attended','declined')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (elder_id, event_id)
);

-- ─────────────────────────────────────────────
-- 23. INTERGENERATIONAL SKILL EXCHANGE (3.6)
-- ─────────────────────────────────────────────

CREATE TABLE skill_offerings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name              TEXT NOT NULL,
  skill_description       TEXT,
  skill_category          TEXT,
  available_times         TEXT,
  format                  TEXT CHECK (format IN ('in_person','video_call','phone')),
  max_participants        INTEGER DEFAULT 1,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
PILLAR 4 — COMPASS Schema
SQL

-- ─────────────────────────────────────────────
-- 24. LOCATION EVENTS
-- ─────────────────────────────────────────────

CREATE TABLE location_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  event_type              TEXT CHECK (event_type IN (
                            'safe_zone_exit','safe_zone_entry',
                            'check_in_prompted','check_in_responded',
                            'check_in_no_response','family_alerted',
                            'night_exit','tracker_alert'
                          )),
  
  -- Fuzzy location (neighbourhood-level, not precise)
  neighbourhood           TEXT,
  approximate_location    GEOGRAPHY(POINT, 4326),      -- fuzzed to ~500m
  
  -- Safe zone context
  safe_zone_active        BOOLEAN,
  distance_from_home_m    INTEGER,
  
  -- Response tracking
  elder_responded         BOOLEAN DEFAULT FALSE,
  elder_responded_at      TIMESTAMPTZ,
  response_method         TEXT,
  family_alerted          BOOLEAN DEFAULT FALSE,
  family_alerted_at       TIMESTAMPTZ,
  resolved                BOOLEAN DEFAULT FALSE,
  resolved_at             TIMESTAMPTZ,
  
  -- AirTag / Tile integration
  tracker_id              TEXT,
  tracker_type            TEXT,                        -- 'airtag','tile'
  
  occurred_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 25. COGNITIVE CHECK-INS
-- ─────────────────────────────────────────────

CREATE TABLE cognitive_checkins (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  question_type           TEXT NOT NULL,               -- 'day_of_week','month','season','recent_event'
  question_text           TEXT NOT NULL,
  correct_answer          TEXT NOT NULL,
  elder_response          TEXT,
  response_type           cognitive_response_type NOT NULL,
  response_latency_ms     INTEGER,                     -- how long to respond
  
  -- Longitudinal tracking
  rolling_score_7d        NUMERIC(4,3),                -- computed
  rolling_score_30d       NUMERIC(4,3),
  significant_change      BOOLEAN DEFAULT FALSE,
  family_alerted          BOOLEAN DEFAULT FALSE,
  
  asked_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 26. DRIVING EVENTS (4.8)
-- ─────────────────────────────────────────────

CREATE TABLE driving_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  event_type              TEXT CHECK (event_type IN (
                            'hard_braking','sharp_turn','unusual_hour',
                            'long_journey','wrong_way_suspected',
                            'trip_summary'
                          )),
  trip_start              TIMESTAMPTZ,
  trip_end                TIMESTAMPTZ,
  trip_duration_minutes   INTEGER,
  anomaly_score           NUMERIC(4,3),
  anomaly_description     TEXT,
  
  -- Always presented to elder first
  elder_reviewed          BOOLEAN DEFAULT FALSE,
  elder_reviewed_at       TIMESTAMPTZ,
  elder_shared_with_family BOOLEAN DEFAULT FALSE,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 27. GRIEF & BEREAVEMENT MODULE (4.4)
-- ─────────────────────────────────────────────

CREATE TABLE bereavement_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by               UUID NOT NULL REFERENCES profiles(id),
  
  deceased_name           TEXT NOT NULL,
  relationship_to_elder   relationship_type,
  date_of_death           DATE,
  
  -- HAVEN tone adjustment
  tone_adjustment_active  BOOLEAN DEFAULT TRUE,
  tone_adjustment_until   DATE,
  
  -- Resource surfacing
  resources_offered       BOOLEAN DEFAULT FALSE,
  resources_offered_at    TIMESTAMPTZ,
  
  -- Wellness monitoring
  sustained_decline_alert BOOLEAN DEFAULT FALSE,
  alert_sent_at           TIMESTAMPTZ,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
PILLAR 5 — VOICE Schema
SQL

-- ─────────────────────────────────────────────
-- 28. VOICE INTERACTIONS
-- ─────────────────────────────────────────────

CREATE TABLE voice_interactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  direction               TEXT CHECK (direction IN ('elder_to_haven','haven_to_elder')),
  intent                  TEXT,                        -- 'medication_confirm','task_create','story','query','check_in','distress','companion'
  
  -- STT
  raw_transcript          TEXT,
  transcript_confidence   NUMERIC(4,3),
  language_detected       TEXT,
  
  -- Response
  response_text           TEXT,
  response_audio_path     TEXT,                        -- cached ElevenLabs output
  tts_voice_id            TEXT,
  
  -- Vector for companion memory
  interaction_vector      vector(1536),
  
  -- Crisis detection
  distress_detected       BOOLEAN DEFAULT FALSE,
  distress_phrases        TEXT[],
  crisis_escalated        BOOLEAN DEFAULT FALSE,
  crisis_escalated_at     TIMESTAMPTZ,
  
  -- Offline flag
  was_offline             BOOLEAN DEFAULT FALSE,
  offline_model_used      TEXT,                        -- 'phi3_mini','gemma_2b'
  synced_at               TIMESTAMPTZ,
  
  duration_ms             INTEGER,
  occurred_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 29. COMPANION MEMORY
-- Persistent context for the companion voice
-- ─────────────────────────────────────────────

CREATE TABLE companion_memory (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  memory_type             TEXT CHECK (memory_type IN (
                            'preference','family_fact','life_event',
                            'health_context','interest','routine','milestone'
                          )),
  content                 TEXT NOT NULL,
  content_vector          vector(1536),
  source_interaction_id   UUID REFERENCES voice_interactions(id),
  source_story_id         UUID REFERENCES life_stories(id),
  
  last_referenced_at      TIMESTAMPTZ,
  reference_count         INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT TRUE,
  confidence              NUMERIC(4,3) DEFAULT 1.0,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
PILLAR 6 — GUARDIAN Schema
SQL

-- ─────────────────────────────────────────────
-- 30. CARER VISIT LOGS
-- ─────────────────────────────────────────────

CREATE TABLE carer_visit_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carer_id                UUID NOT NULL REFERENCES profiles(id),
  carer_relationship_id   UUID NOT NULL REFERENCES carer_relationships(id),
  
  arrived_at              TIMESTAMPTZ NOT NULL,
  departed_at             TIMESTAMPTZ,
  duration_minutes        INTEGER,
  
  elder_condition         wellness_score,
  medications_administered BOOLEAN DEFAULT FALSE,
  medications_notes       TEXT,
  activities_completed    TEXT[],
  handoff_notes           TEXT,
  
  -- Care plan compliance
  care_plan_followed      BOOLEAN,
  care_plan_deviation     TEXT,
  
  -- Incident recording
  incident_occurred       BOOLEAN DEFAULT FALSE,
  incident_id             UUID,                        -- references incidents table
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 31. INCIDENTS
-- ─────────────────────────────────────────────

CREATE TABLE incidents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_by             UUID NOT NULL REFERENCES profiles(id),
  
  severity                incident_severity NOT NULL,
  incident_type           TEXT NOT NULL,               -- 'fall','medication_error','behavioural','medical','safeguarding'
  description             TEXT NOT NULL,
  occurred_at             TIMESTAMPTZ NOT NULL,
  location_description    TEXT,
  
  -- Safeguarding
  safeguarding_concern    BOOLEAN DEFAULT FALSE,
  safeguarding_category   safeguarding_category,
  safeguarding_reported   BOOLEAN DEFAULT FALSE,
  safeguarding_authority  TEXT,
  safeguarding_reference  TEXT,
  
  -- Follow-up
  family_notified         BOOLEAN DEFAULT FALSE,
  family_notified_at      TIMESTAMPTZ,
  gp_notified             BOOLEAN DEFAULT FALSE,
  follow_up_required      BOOLEAN DEFAULT FALSE,
  follow_up_completed     BOOLEAN DEFAULT FALSE,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 32. LEGACY DIGITAL ESTATE (1.8)
-- ─────────────────────────────────────────────

CREATE TABLE legacy_accounts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  service_name            TEXT NOT NULL,               -- 'Gmail','Facebook','HSBC Online'
  service_url             TEXT,
  account_identifier      TEXT,                        -- username/email (not password)
  encrypted_credentials   BYTEA,                       -- AES-256-GCM, key in Supabase Vault
  
  category                TEXT CHECK (category IN (
                            'email','social','banking','investment',
                            'subscription','government','utility','other'
                          )),
  intended_recipient_id   UUID REFERENCES profiles(id),
  action_on_death         TEXT CHECK (action_on_death IN (
                            'delete','transfer','memorialize','no_action'
                          )),
  notes                   TEXT,
  
  last_updated            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
Notifications & System
SQL

-- ─────────────────────────────────────────────
-- 33. NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE notifications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  elder_id                UUID REFERENCES profiles(id),
  
  notification_type       notification_type NOT NULL,
  title                   TEXT NOT NULL,
  body                    TEXT NOT NULL,
  
  -- Deep-link metadata
  action_url              TEXT,
  related_entity_type     TEXT,
  related_entity_id       UUID,
  
  -- Delivery
  channel                 TEXT[] DEFAULT ARRAY['push'],-- 'push','email','sms'
  push_token              TEXT,
  expo_push_ticket_id     TEXT,
  
  sent_at                 TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  read_at                 TIMESTAMPTZ,
  actioned_at             TIMESTAMPTZ,
  
  -- Silent family notifications (never shown to elder)
  is_silent_family_alert  BOOLEAN DEFAULT FALSE,
  
  priority                TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 34. PUSH TOKENS
-- ─────────────────────────────────────────────

CREATE TABLE push_tokens (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token                   TEXT NOT NULL UNIQUE,
  platform                TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  is_active               BOOLEAN DEFAULT TRUE,
  last_used               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 35. AUDIT LOG (immutable)
-- ─────────────────────────────────────────────

CREATE TABLE audit_log (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id                UUID REFERENCES profiles(id),
  actor_role              user_role,
  action                  TEXT NOT NULL,
  entity_type             TEXT NOT NULL,
  entity_id               UUID,
  old_values              JSONB,
  new_values              JSONB,
  ip_address              INET,
  user_agent              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Audit log is INSERT-only (no UPDATE, no DELETE) — enforced by RLS
Indexes
SQL

-- ─────────────────────────────────────────────
-- PERFORMANCE INDEXES
-- ─────────────────────────────────────────────

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_deleted ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Family relationships
CREATE INDEX idx_family_rel_elder ON family_relationships(elder_id);
CREATE INDEX idx_family_rel_member ON family_relationships(family_member_id);
CREATE INDEX idx_family_rel_status ON family_relationships(status);

-- Scam events
CREATE INDEX idx_scam_events_elder ON scam_events(elder_id);
CREATE INDEX idx_scam_events_level ON scam_events(alert_level);
CREATE INDEX idx_scam_events_created ON scam_events(created_at DESC);
CREATE INDEX idx_scam_events_vector ON scam_events USING ivfflat (transcript_vector vector_cosine_ops);

-- Medications
CREATE INDEX idx_medications_elder ON medications(elder_id);
CREATE INDEX idx_medications_active ON medications(elder_id, is_active) WHERE is_active = TRUE;

-- Medication reminders
CREATE INDEX idx_med_reminders_scheduled ON medication_reminders(elder_id, scheduled_at);
CREATE INDEX idx_med_reminders_pending ON medication_reminders(status) WHERE status = 'pending';

-- Tasks
CREATE INDEX idx_tasks_elder_due ON tasks(elder_id, due_at);
CREATE INDEX idx_tasks_pending ON tasks(elder_id, status) WHERE status = 'pending';

-- Wellness
CREATE INDEX idx_wellness_elder_date ON wellness_checkins(elder_id, checked_in_at DESC);

-- Voice interactions
CREATE INDEX idx_voice_elder ON voice_interactions(elder_id, occurred_at DESC);
CREATE INDEX idx_voice_vector ON voice_interactions USING ivfflat (interaction_vector vector_cosine_ops);

-- Companion memory
CREATE INDEX idx_companion_elder ON companion_memory(elder_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_companion_vector ON companion_memory USING ivfflat (content_vector vector_cosine_ops);

-- Life stories
CREATE INDEX idx_stories_elder ON life_stories(elder_id, status);
CREATE INDEX idx_stories_vector ON life_stories USING ivfflat (transcript_vector vector_cosine_ops);

-- Community events (geospatial)
CREATE INDEX idx_events_location ON community_events USING GIST (location);
CREATE INDEX idx_events_start ON community_events(start_at);

-- Location events
CREATE INDEX idx_location_elder ON location_events(elder_id, occurred_at DESC);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE read_at IS NULL;

-- Financial transactions
CREATE INDEX idx_financial_tx_elder ON financial_transactions(elder_id, transaction_date DESC);
CREATE INDEX idx_financial_anomalous ON financial_transactions(elder_id) WHERE is_anomalous = TRUE;
Row-Level Security Policies
SQL

-- ─────────────────────────────────────────────
-- RLS — SAMPLE POLICIES (pattern for all tables)
-- ─────────────────────────────────────────────

ALTER TABLE scam_events ENABLE ROW LEVEL SECURITY;

-- Elder can see their own scam events
CREATE POLICY "elder_own_scam_events" ON scam_events
  FOR ALL USING (
    elder_id = auth.uid()
  );

-- Family member can see scam events for their elder (if relationship active)
CREATE POLICY "family_view_scam_events" ON scam_events
  FOR SELECT USING (
    elder_id IN (
      SELECT elder_id FROM family_relationships
      WHERE family_member_id = auth.uid()
        AND status = 'accepted'
        AND elder_consented = TRUE
    )
  );

-- System service role bypasses RLS
CREATE POLICY "service_role_bypass" ON scam_events
  FOR ALL USING (auth.role() = 'service_role');

-- Same pattern applied to: medications, tasks, wellness_checkins,
-- life_stories, family_messages, documents, vital_signs, etc.
-- Each table has: elder_own, family_scoped, carer_scoped (where applicable), service_role_bypass
Key Triggers
SQL

-- ─────────────────────────────────────────────
-- TRIGGER: Auto-update updated_at
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to all tables with updated_at:
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for all tables)

-- ─────────────────────────────────────────────
-- TRIGGER: Consecutive wellness decline counter
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_consecutive_not_great()
RETURNS TRIGGER AS $$
DECLARE
  prev_score wellness_score;
  prev_consecutive INTEGER;
BEGIN
  SELECT score, consecutive_not_great
  INTO prev_score, prev_consecutive
  FROM wellness_checkins
  WHERE elder_id = NEW.elder_id
    AND id != NEW.id
  ORDER BY checked_in_at DESC
  LIMIT 1;

  IF NEW.score = 'not_great' THEN
    NEW.consecutive_not_great = COALESCE(prev_consecutive, 0) + 1;
    IF NEW.consecutive_not_great >= 3 THEN
      NEW.family_alerted = FALSE; -- will be processed by Edge Function
    END IF;
  ELSE
    NEW.consecutive_not_great = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wellness_consecutive BEFORE INSERT ON wellness_checkins
  FOR EACH ROW EXECUTE FUNCTION compute_consecutive_not_great();

-- ─────────────────────────────────────────────
-- TRIGGER: Sensitive document → family alert flag
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION flag_sensitive_document()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category IN ('will','power_of_attorney','deed','trust') THEN
    NEW.is_sensitive_legal = TRUE;
    NEW.cooling_off_expires = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sensitive_document BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION flag_sensitive_document();

-- ─────────────────────────────────────────────
-- TRIGGER: Audit log (immutable INSERT-only)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (actor_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applied to sensitive tables: documents, financial_transactions, medications, legacy_accounts
<a name="components"></a>

🧩 SECTION 2 — Component Library Specification
Design Tokens
TypeScript

// tokens/index.ts

export const COLORS = {
  // Brand
  brand: {
    haven_blue:     '#1A4FBA',   // primary — trust, calm
    haven_light:    '#4A7FE8',   // interactive states
    haven_dark:     '#0D2D6E',   // pressed states
    haven_teal:     '#0EA5A0',   // CIRCLE pillar accent
    haven_amber:    '#F59E0B',   // Shield amber alert
    haven_red:      '#DC2626',   // Shield red alert
    haven_black:    '#0F0F0F',   // Shield black level
    haven_green:    '#16A34A',   // safe / confirmed
    haven_purple:   '#7C3AED',   // COMPASS pillar accent
    haven_rose:     '#E11D48',   // VOICE / companion accent
  },

  // Semantic
  status: {
    safe:           '#16A34A',
    amber:          '#F59E0B',
    red:            '#DC2626',
    black:          '#0F0F0F',
  },

  // Background scale
  bg: {
    primary:        '#FFFFFF',
    secondary:      '#F8FAFC',
    tertiary:       '#F1F5F9',
    inverse:        '#0F172A',
  },

  // Text scale
  text: {
    primary:        '#0F172A',   // 900
    secondary:      '#334155',   // 700
    tertiary:       '#64748B',   // 500
    disabled:       '#94A3B8',   // 400
    inverse:        '#FFFFFF',
    link:           '#1A4FBA',
  },

  // High contrast overrides (WCAG AAA — 7:1 minimum)
  hc: {
    bg_primary:     '#000000',
    bg_secondary:   '#1A1A1A',
    text_primary:   '#FFFFFF',
    text_secondary: '#F0F0F0',
    brand:          '#5B9BFF',   // adjusted for black bg
    amber:          '#FFD700',
    red:            '#FF6B6B',
    green:          '#7CFF7C',
    border:         '#FFFFFF',
  },
} as const;

export const TYPOGRAPHY = {
  // Base size: 18px (elder default, not 16px)
  // Minimum: 24px for all body text
  // Multiplied by user's font_size_multiplier (1.0–2.0)

  scale: {
    xs:     18,    // captions, helper text (never smaller)
    sm:     20,    // secondary body
    base:   24,    // primary body — MINIMUM for elders
    lg:     28,    // subheadings, card labels
    xl:     34,    // section headings
    '2xl':  40,    // screen titles
    '3xl':  48,    // greeting, hero text
    '4xl':  60,    // time display, large numerics
  },

  family: {
    sans:   'Inter',            // body, UI
    serif:  'Lora',             // life stories, memoir
    mono:   'JetBrains Mono',  // codes, references
  },

  weight: {
    regular:    '400',
    medium:     '500',
    semibold:   '600',
    bold:       '700',
    extrabold:  '800',
  },

  lineHeight: {
    tight:    1.2,
    normal:   1.5,
    relaxed:  1.75,   // preferred for elder body text
    loose:    2.0,
  },
} as const;

export const SPACING = {
  // Base unit: 8px
  0:    0,
  1:    8,
  2:    16,
  3:    24,
  4:    32,
  5:    40,
  6:    48,
  8:    64,
  10:   80,
  12:   96,
  16:   128,
} as const;

export const SIZES = {
  // Tap targets — WCAG 2.5.5 AAA: 44×44px minimum
  // HAVEN standard: 72×72px for all interactive elements
  tap_min:        44,   // absolute minimum (WCAG AA)
  tap_standard:   72,   // HAVEN standard
  tap_large:      96,   // hero buttons (home screen)
  tap_xl:         120,  // emergency button

  border_radius: {
    sm:     8,
    md:     12,
    lg:     16,
    xl:     24,
    full:   9999,
  },

  icon: {
    sm:     24,
    md:     32,
    lg:     40,
    xl:     56,
    hero:   72,
  },
} as const;

export const SHADOWS = {
  sm:   { shadowOffset: {width:0,height:1}, shadowOpacity:0.08, shadowRadius:3,  elevation:2 },
  md:   { shadowOffset: {width:0,height:4}, shadowOpacity:0.10, shadowRadius:8,  elevation:4 },
  lg:   { shadowOffset: {width:0,height:8}, shadowOpacity:0.12, shadowRadius:16, elevation:8 },
  glow_amber: { shadowColor: '#F59E0B', shadowOffset:{width:0,height:0}, shadowOpacity:0.6, shadowRadius:20, elevation:12 },
  glow_red:   { shadowColor: '#DC2626', shadowOffset:{width:0,height:0}, shadowOpacity:0.6, shadowRadius:20, elevation:12 },
} as const;

export const ANIMATION = {
  duration: {
    instant:    100,
    fast:       200,
    normal:     300,
    slow:       500,
    verySlow:   800,   // alert overlays — never rushed
  },
  easing: {
    smooth:     [0.4, 0, 0.2, 1],
    enter:      [0, 0, 0.2, 1],
    exit:       [0.4, 0, 1, 1],
    bounce:     [0.175, 0.885, 0.32, 1.275],
  },
} as const;
Component Specifications
TypeScript

// ─────────────────────────────────────────────
// ATOM COMPONENTS
// ─────────────────────────────────────────────

/**
 * HButton — Primary interactive element
 *
 * RULES:
 * - Minimum 72×72px tap target (ALWAYS — no exceptions)
 * - Icon + Label ALWAYS (never icon-only)
 * - Loading state always shows spinner + "Please wait..."
 * - Disabled state: 40% opacity, not just color change
 * - Never auto-dismiss or expire (no countdown)
 * - Haptic feedback on press (iOS: impactMedium, Android: CLICK)
 */
interface HButtonProps {
  label:              string;           // REQUIRED — always visible
  onPress:            () => void;
  variant:            'primary'         // solid brand blue fill
                    | 'secondary'       // outlined
                    | 'ghost'           // text only (rare — only in modals)
                    | 'danger'          // red — destructive actions only
                    | 'emergency'       // red, full-width, xl tap target
                    | 'safe'            // green — confirmation
                    | 'amber';          // amber — warning actions
  size:               'sm'              // 72px height
                    | 'md'             // 88px height
                    | 'lg'             // 104px height
                    | 'xl'             // 120px height (home screen heroes)
                    | 'emergency';     // 120px height + pulsing ring
  icon?:              string;           // SF Symbol / Material icon name
  iconPosition?:      'left' | 'top';  // top for hero buttons
  isLoading?:         boolean;
  isDisabled?:        boolean;
  fullWidth?:         boolean;          // default: false
  accessibilityLabel: string;           // always required
  accessibilityHint?: string;
  testID?:            string;
}

// Visual spec:
// primary:   bg=haven_blue, text=white, border=none
// secondary: bg=transparent, text=haven_blue, border=haven_blue 2px
// danger:    bg=red, text=white — requires confirmationRequired=true on wrapping component
// emergency: bg=red, text=white, border=red 3px, pulsing shadow animation
// All: border-radius=16, padding horizontal=24, font=semibold/24px

/**
 * HText — Typography component
 * Never use raw Text — always HText to enforce size rules
 */
interface HTextProps {
  variant:  'hero'        // 48px, extrabold — greetings
          | 'title'       // 40px, bold — screen titles
          | 'heading'     // 34px, semibold
          | 'subheading'  // 28px, semibold
          | 'body'        // 24px, regular — MINIMUM
          | 'bodyLarge'   // 28px, regular — preferred for instructions
          | 'label'       // 20px, medium — button labels (always paired)
          | 'caption';    // 18px, regular — absolute minimum
  color?:   keyof typeof COLORS.text;
  align?:   'left' | 'center' | 'right';
  children: React.ReactNode;
  accessibilityRole?: 'header' | 'text';
  numberOfLines?: number;
  testID?:  string;
}

/**
 * HIcon — Icon + Label compound (never icon alone)
 */
interface HIconProps {
  name:               string;
  size:               'sm' | 'md' | 'lg' | 'xl' | 'hero';
  label:              string;           // ALWAYS required — no icon-only
  labelPosition:      'right' | 'below';
  color?:             string;
  accessibilityLabel: string;
}

/**
 * HCard — Content container
 */
interface HCardProps {
  variant:  'default'     // white bg, md shadow
          | 'elevated'    // white bg, lg shadow
          | 'flat'        // bg_secondary, no shadow
          | 'alert_amber' // amber border + glow
          | 'alert_red'   // red border + glow
          | 'safe'        // green border
          | 'story'       // warm cream bg for life stories
          | 'memorial';   // soft purple for memory lane
  onPress?:           () => void;   // whole card tappable (72px min height)
  children:           React.ReactNode;
  accessibilityLabel: string;
  accessibilityRole?: 'button' | 'none';
  testID?:            string;
}

/**
 * HBadge — Status indicator (always with text label)
 */
interface HBadgeProps {
  label:    string;
  variant:  'safe' | 'amber' | 'red' | 'info' | 'neutral';
  size:     'sm' | 'md';
  icon?:    string;
}

/**
 * HAvatar — Profile image or initials
 */
interface HAvatarProps {
  name:     string;
  imageUrl?: string;
  size:     'sm' | 'md' | 'lg';   // 48, 64, 80px
  badge?:   'online' | 'alert';
}

/**
 * HToggle — Large, accessible toggle switch
 * Minimum 72px tap target area (padding applied)
 */
interface HToggleProps {
  value:              boolean;
  onValueChange:      (value: boolean) => void;
  label:              string;           // always visible
  sublabel?:          string;           // explanatory text
  isDisabled?:        boolean;
  accessibilityLabel: string;
  testID?:            string;
}

/**
 * HInput — Text input (use sparingly — voice preferred)
 */
interface HInputProps {
  label:              string;
  value:              string;
  onChangeText:       (text: string) => void;
  placeholder?:       string;
  keyboardType?:      'default' | 'numeric' | 'email-address' | 'phone-pad';
  isMultiline?:       boolean;
  numberOfLines?:     number;
  isDisabled?:        boolean;
  errorMessage?:      string;
  helperText?:        string;
  // Voice alternative
  showVoiceInput?:    boolean;          // default: true — always offer voice
  onVoiceInput?:      (transcript: string) => void;
  accessibilityLabel: string;
  testID?:            string;
}
// Input spec: font=24px, height=72px min, border-radius=12
// Error state: red border + error text in red below (24px minimum)
// Focus state: haven_blue border 2px + blue shadow

// ─────────────────────────────────────────────
// MOLECULE COMPONENTS
// ─────────────────────────────────────────────

/**
 * HMedicationCard — Single medication display
 */
interface HMedicationCardProps {
  medication:           Medication;
  showTakeButton?:      boolean;
  onTake?:              () => void;
  onSnooze?:            () => void;
  onViewDetails?:       () => void;
  reminderStatus?:      reminder_status;
  nextDoseAt?:          Date;
}
// Visual: plain_description in large text (28px), pill emoji/colour indicator,
// time displayed as "8:00 AM" in 40px bold,
// Take button: full-width, green, 88px height
// Snooze button: secondary, 72px height

/**
 * HTaskRow — Single task in the daily list
 */
interface HTaskRowProps {
  task:           Task;
  onComplete?:    () => void;
  onSnooze?:      () => void;
  onPress?:       () => void;
  showAttribution?: boolean;     // show "From Sarah:" prefix
}
// Visual: time on left (28px bold), title (24px), check circle on right (72×72)
// Family-attributed tasks: small blue chip showing sender name
// Whole row tappable (min 72px height)

/**
 * HWellnessSelector — The 3-state wellness picker
 */
interface HWellnessSelectorProps {
  value?:         wellness_score;
  onSelect:       (score: wellness_score) => void;
  showLabels?:    boolean;
}
// 3 large circular buttons (96×96px each):
// 😊 "Great" (green), 😐 "Okay" (amber), 😔 "Not great" (soft red)
// Selected state: border 3px, scale 1.05, haptic feedback
// Labels always visible below icons (24px)

/**
 * HShieldAlert — Scam alert overlay (Amber/Red/Black)
 */
interface HShieldAlertProps {
  alertLevel:         alert_level;
  explanation:        string;
  matchedPatterns:    string[];
  onDismiss?:         () => void;       // "I trust this person"
  onGetHelp?:         () => void;       // calls primary family contact
  onLearnMore?:       () => void;       // shows pattern details
  callerName?:        string;
  transactionAmount?: number;
  transactionCurrency?: string;
}
// amber: soft amber background overlay (not full screen), animated border
// red: full-screen soft overlay, pulsing haven_red glow, explanation in 28px
// black: full-screen red, LARGE text "Before you send money —", single action: "Call [Name]"
// All levels: "Dismiss" is secondary/small — "Get Help" is primary/large
// Animation: slides up from bottom, duration=slow (500ms), never startles

/**
 * HCoachingCard — Live scam coaching during flagged call
 */
interface HCoachingCardProps {
  requestType:        string;           // "Gift card payment"
  safeResponse:       string;           // Suggested phrase
  redFlags:           string[];
  isVisible:          boolean;
  onDismiss:          () => void;
}
// Silent card — no sound (elder is on the phone)
// Pin to top of screen, semi-transparent background
// Large clear text (28px), short phrases only
// Never covers more than 40% of screen

/**
 * HVoiceButton — Primary voice interaction trigger
 */
interface HVoiceButtonProps {
  onPress:            () => void;
  isListening?:       boolean;
  isProcessing?:      boolean;
  size?:              'md' | 'lg' | 'xl';
  label?:             string;           // default: "Speak to HAVEN"
  accessibilityLabel: string;
}
// Circular, 96px default, haven_blue fill
// Listening state: animated pulse ring, amber colour
// Processing state: spinner overlay
// Always labelled

/**
 * HFamilyMemberChip — Compact family member representation
 */
interface HFamilyMemberChipProps {
  member:             Profile;
  showPresence?:      boolean;
  onPress?:           () => void;
  showAlert?:         boolean;          // amber dot if unread alert
  size?:              'sm' | 'md';
}

/**
 * HDailyBriefCard — The full-screen morning brief
 */
interface HDailyBriefCardProps {
  greeting:           string;           // "Good Morning, Margaret ☀️"
  date:               Date;
  weather?:           WeatherData;
  medications:        MedicationReminder[];
  appointments:       Task[];
  messages:           FamilyMessage[];
  onSpeakBrief?:      () => void;       // triggers TTS readout
}
// Full screen height, single scroll
// Each item: minimum 80px row, full-width tap target
// Max 3 items of each category shown (not overwhelming)
// "Hear today's brief" button — large, top right

/**
 * HEmergencyButton — Always-visible safety button
 * Present on EVERY screen (bottom sheet or FAB)
 */
interface HEmergencyButtonProps {
  onPress:            () => void;
  primaryContactName: string;           // "Call Sarah"
  size?:              'standard' | 'xl';
}
// Red, circular or pill shape, 🆘 icon + "Help" label
// NO confirmation dialog — immediate call
// Must be visible on every screen without scrolling
// Position: fixed bottom-right or in tab bar

// ─────────────────────────────────────────────
// ORGANISM COMPONENTS
// ─────────────────────────────────────────────

/**
 * HHomeScreen — The 4-button home screen
 */
interface HHomeScreenProps {
  elderName:            string;
  timeOfDay:            'morning' | 'afternoon' | 'evening' | 'night';
  shieldStatus:         'safe' | 'amber' | 'red';
  pendingMedicationCount: number;
  unreadMessageCount:   number;
  onPills:              () => void;
  onToday:              () => void;
  onFamily:             () => void;
  onHelp:               () => void;
}
// Layout: 2×2 grid of HButton(xl)
// Greeting: HText(hero) at top — "Good Morning\nMargaret"
// Status bar: "🛡️ HAVEN is keeping you safe" (green) | amber/red variants
// Each quadrant: 72×72 icon above 28px label
// Background: white or soft gradient
// Font size applied to ALL text via font_size_multiplier

/**
 * HLifeStoryRecorder
 */
interface HLifeStoryRecorderProps {
  prompt:             LifeStoryPrompt;
  onRecordingComplete: (audioUri: string, duration: number) => void;
  onSkip:             () => void;
}
// Full screen, warm ivory background
// Prompt text in Lora serif, 28px, centered
// Large mic button (120px) centre screen
// Recording: animated waveform visualiser
// "Skip this week" — small, ghost variant, bottom

/**
 * HMedicationSetupWizard — Family-facing OCR setup
 */
interface HMedicationSetupWizardProps {
  elderId:            string;
  onComplete:         (medications: Medication[]) => void;
  onCancel:           () => void;
}
// Step 1: Camera/photo picker with guide overlay for bottle label
// Step 2: OCR result review — shows parsed fields for confirmation
// Step 3: Schedule setup — visual time-picker (not keyboard entry)
// Step 4: Plain description review — "Does this sound right?"
// Step 5: Confirmation + "Add another pill"

/**
 * HDocumentScanner — For vault & "What Was That?"
 */
interface HDocumentScannerProps {
  mode:               'vault' | 'explain';
  onScanComplete:     (imagePath: string, summary: DocumentSummary) => void;
  category?:          document_category;
}

/**
 * HNeighbourhoodConnector — Circle discovery
 */
interface HNeighbourhoodConnectorProps {
  elderId:            string;
  nearbyCount:        number;
  sharedInterests:    string[];
  onConnect:          (connectionId: string) => void;
  onViewEvents:       () => void;
}

/**
 * HFamilyDashboard — Family web app main view
 * (Next.js component — not React Native)
 */
interface HFamilyDashboardProps {
  elder:              ElderProfile;
  shieldStatus:       ShieldStatus;
  medicationAdherence: MedicationAdherenceData;
  recentActivity:     ActivityItem[];
  recentMessages:     FamilyMessage[];
  pendingAlerts:      Notification[];
  weeklyDigest?:      SafetyDigest;
}

// ─────────────────────────────────────────────
// SCREEN TEMPLATES
// Max items per screen: 3 (hard rule)
// Max navigation depth: 2 from home
// No modals within modals
// ─────────────────────────────────────────────

/**
 * HScreenTemplate — Base for all elder screens
 */
interface HScreenTemplateProps {
  title:              string;
  showBackButton?:    boolean;        // default: true (if not home)
  showEmergencyButton?: boolean;      // default: true (ALL screens)
  showVoiceButton?:   boolean;        // default: true
  backgroundColor?:   string;
  onBack?:            () => void;
  children:           React.ReactNode;
  accessibilityLabel: string;
}
// Header: title (34px bold), back arrow (72×72), emergency button (fixed)
// Safe area insets respected
// Scroll: always scrollable (no fixed height content that might get cut off)
// Footer: voice button (left) + emergency button (right) always visible
Accessibility Rules (Enforced via ESLint Plugin)
TypeScript

// .eslintrc - custom rules for HAVEN component library

const HAVEN_ACCESSIBILITY_RULES = {
  // 1. No icon without label
  'no-icon-without-label': 'error',

  // 2. Minimum tap target 72px — checked via StyleSheet audit
  'min-tap-target-72': 'error',

  // 3. No text below 18px (24px for body, 18px absolute minimum)
  'min-font-size-18': 'error',

  // 4. All interactive elements must have accessibilityLabel
  'react-native-a11y/has-accessibility-hint': 'warn',
  'react-native-a11y/has-valid-accessibility-role': 'error',

  // 5. No countdown timers or auto-dismiss
  'no-auto-dismiss': 'error',

  // 6. No nested navigation modals (depth > 2)
  'max-nav-depth-2': 'warn',

  // 7. Colour contrast — WCAG AAA (7:1) enforced
  'color-contrast-aaa': 'error',

  // 8. No swipe-only interactions
  'no-swipe-only': 'error',
};
Navigation Architecture
TypeScript

// navigation/types.ts

export type ElderTabParams = {
  Home:       undefined;
  Today:      undefined;
  MyPills:    undefined;
  Family:     undefined;
};

export type ElderStackParams = {
  // Depth 1 from tabs
  PillDetail:         { medicationId: string };
  TakeMyPill:         { reminderId: string };
  TodayDetail:        undefined;
  TaskDetail:         { taskId: string };
  FamilyMessages:     undefined;
  LifeStory:          { promptId: string };
  WellnessCheckIn:    undefined;
  ShieldAlert:        { scamEventId: string };
  DocumentExplainer:  undefined;
  CognitiveCheckIn:   undefined;
  // Emergency (accessible from anywhere, depth irrelevant)
  EmergencyCall:      { contactId: string };
  Settings:           undefined;
};

// Maximum depth from home: 2 levels (tab → detail)
// Emergency is always accessible regardless of current screen depth

export type FamilyDashboardParams = {
  // Web app (Next.js) — no depth restriction
  Dashboard:          { elderId: string };
  ScamAlerts:         { elderId: string };
  Medications:        { elderId: string };
  MedicationSetup:    { elderId: string };
  Messages:           { elderId: string };
  LifeStories:        { elderId: string };
  Settings:           { elderId: string };
  WeeklyDigest:       { elderId: string; weekStart: string };
  ElderProfile:       { elderId: string };
  FinancialGuardian:  { elderId: string };
  DocumentVault:      { elderId: string };
};
<a name="dataset"></a>

🤖 SECTION 3 — Scam Detection Training Dataset Structure
Overview
The HAVEN scam detection pipeline uses two model types:

Fast Heuristic Layer — Rule-based classifier (< 5ms, runs on-device)
LLM Reasoning Layer — Fine-tuned model or prompted GPT-4o (< 200ms, cloud)
The dataset structure supports both.

Dataset Schema
TypeScript

// types/scam-dataset.ts

/**
 * Top-level dataset record
 * One record = one scam signal instance (call transcript, SMS, email, web page)
 */
interface ScamDatasetRecord {
  // ── Identity ──────────────────────────────
  id:                   string;       // UUID
  dataset_version:      string;       // semver: "2.1.0"
  created_at:           string;       // ISO8601
  source:               DataSource;

  // ── Signal Metadata ───────────────────────
  signal:               SignalMetadata;

  // ── Ground Truth Labels ───────────────────
  labels:               GroundTruthLabels;

  // ── Content (multi-modal) ─────────────────
  content:              SignalContent;

  // ── Extracted Features ────────────────────
  features:             ExtractedFeatures;

  // ── Annotations ───────────────────────────
  annotations:          Annotation[];

  // ── Train/Val/Test Split ──────────────────
  split:                'train' | 'validation' | 'test' | 'holdout';
  split_version:        string;

  // ── Quality Control ───────────────────────
  quality:              QualityMetadata;
}

type DataSource =
  | 'ftc_consumer_sentinel'    // FTC Consumer Sentinel Network data
  | 'ic3_complaint_data'       // FBI IC3 annual report extracts
  | 'aarp_fraud_watch'         // AARP Fraud Watch Network reports
  | 'action_fraud_uk'          // UK Action Fraud database
  | 'age_uk_reports'
  | 'synthetic_llm_generated'  // GPT-4o synthesised examples
  | 'synthetic_rule_generated' // Template-based generation
  | 'real_redacted'            // Real cases, PII removed
  | 'expert_crafted'           // Security researchers
  | 'community_submitted'      // User-reported (future)
  | 'negative_benign';         // Legitimate communications (negative class)

interface SignalMetadata {
  channel:              'phone_call' | 'sms' | 'email' | 'web_page' | 'letter' | 'in_person';
  direction:            'inbound' | 'outbound';
  locale:               string;            // BCP 47: 'en-US', 'en-GB', 'es-US'
  year:                 number;            // for temporal drift analysis
  month?:               number;
  
  // Phone call specific
  call_duration_seconds?: number;
  caller_claimed_identity?: string;        // "IRS", "Medicare", "Bank", "Grandson"
  caller_claimed_org?:  string;
  call_number_reputation?: {
    reported_count:     number;
    is_known_scam:      boolean;
    reputation_source:  string;
  };

  // SMS specific
  sms_sender_type?:     'short_code' | 'long_number' | 'alphanumeric';
  contains_url?:        boolean;
  url_age_days?:        number;
  url_is_gov_lookalike?: boolean;

  // Email specific
  sender_domain?:       string;
  sender_domain_age_days?: number;
  spf_pass?:            boolean;
  dkim_pass?:           boolean;
  dmarc_pass?:          boolean;
  display_name_mismatch?: boolean;        // "Bank of America" but domain = bank0famerica.com
  has_attachment?:      boolean;

  // Web specific
  url?:                 string;
  page_type?:           'checkout' | 'form' | 'landing' | 'support' | 'alert' | 'popup';
  has_remote_support_download?: boolean;
  has_gift_card_flow?:  boolean;
}

interface GroundTruthLabels {
  // Primary classification
  is_scam:              boolean;
  confidence:           'certain' | 'likely' | 'possible' | 'uncertain';
  
  // Threat types (multi-label)
  threat_types:         ThreatType[];
  
  // Alert level this should trigger
  recommended_alert_level: 'none' | 'amber' | 'red' | 'black';
  
  // Scam taxonomy
  scam_subcategory:     ScamSubcategory;
  
  // Target vulnerability factors
  targets_elderly:      boolean;
  uses_authority:       boolean;
  uses_urgency:         boolean;
  uses_fear:            boolean;
  uses_reward:          boolean;
  uses_isolation:       boolean;         // "Don't tell anyone"
  uses_grooming:        boolean;         // relationship built over time
  
  // Financial risk
  financial_loss_likely: boolean;
  payment_method_requested?: PaymentMethod;
  estimated_loss_range?: '$0-100' | '$100-500' | '$500-2k' | '$2k-10k' | '$10k-50k' | '$50k+';
  
  // Verification sources
  verified_by_ftc:      boolean;
  ftc_case_ref?:        string;
  verified_by_ic3:      boolean;
  ic3_case_ref?:        string;
}

type ThreatType =
  | 'irs_impersonation'
  | 'medicare_impersonation'
  | 'social_security_impersonation'
  | 'bank_impersonation'
  | 'utility_impersonation'
  | 'law_enforcement_impersonation'
  | 'tech_support'
  | 'lottery_prize'
  | 'investment_fraud'
  | 'romance_scam'
  | 'grandparent_scam'
  | 'charity_fraud'
  | 'home_repair'
  | 'medical_device'
  | 'prescription_fraud'
  | 'medicare_advantage_fraud'
  | 'reverse_mortgage'
  | 'gift_card_demand'
  | 'wire_transfer'
  | 'crypto_atm'
  | 'overpayment'
  | 'advance_fee'
  | 'phishing_link'
  | 'smishing'
  | 'vishing'
  | 'remote_access_trojan'
  | 'account_takeover'
  | 'document_fraud'               // fake wills/POA coercion
  | 'isolation_tactic'
  | 'urgency_pressure'
  | 'benign';                      // negative class

type ScamSubcategory =
  | 'government_impersonation'
  | 'financial_services'
  | 'healthcare_benefits'
  | 'tech_support'
  | 'romance_trust'
  | 'prize_lottery'
  | 'investment'
  | 'family_emergency'
  | 'home_services'
  | 'charity'
  | 'real_estate'
  | 'insurance'
  | 'benign_commercial'            // legitimate marketing (negative class)
  | 'benign_government'            // real government communication (negative class)
  | 'benign_personal'              // real family/friend contact (negative class)
  | 'benign_healthcare';           // real medical communication (negative class)

type PaymentMethod =
  | 'gift_card_amazon'
  | 'gift_card_google_play'
  | 'gift_card_itunes'
  | 'gift_card_other'
  | 'wire_transfer'
  | 'zelle'
  | 'venmo'
  | 'cashapp'
  | 'crypto_bitcoin'
  | 'crypto_other'
  | 'crypto_atm'
  | 'western_union'
  | 'moneygram'
  | 'cash_mail'
  | 'ach_bank_transfer'
  | 'check'
  | 'credit_card';

interface SignalContent {
  // Text content (normalised)
  raw_text?:            string;      // original content (PII redacted)
  normalised_text?:     string;      // lowercased, punctuation normalised
  
  // Transcript (for calls)
  transcript?:          TranscriptSegment[];
  full_transcript?:     string;      // concatenated
  
  // HTML (for web pages)
  html_snippet?:        string;      // key div/form content only
  
  // Metadata only (no content) — for some sources
  content_summary?:     string;      // human-written description
  
  // PII handling
  pii_redacted:         boolean;
  pii_redaction_method: 'presidio' | 'manual' | 'regex' | 'llm';
  pii_types_removed?:   string[];   // ['NAME','PHONE','ADDRESS','SSN','ACCOUNT']
}

interface TranscriptSegment {
  speaker:              'scammer' | 'victim' | 'unknown';
  text:                 string;
  start_time_ms?:       number;
  end_time_ms?:         number;
  // Emotional cues (annotated)
  emotional_tone?:      'urgent' | 'threatening' | 'friendly' | 'sympathetic' | 'authoritative' | 'flattering';
}

interface ExtractedFeatures {
  // Lexical features (for fast heuristic layer)
  urgency_phrases:      string[];    // detected urgency patterns
  authority_phrases:    string[];    // impersonation phrases
  payment_phrases:      string[];    // gift card / wire transfer demands
  fear_phrases:         string[];    // "arrested", "account closed", "lawsuit"
  reward_phrases:       string[];    // "won", "prize", "congratulations"
  isolation_phrases:    string[];    // "don't tell anyone", "keep this secret"
  government_terms:     string[];    // "IRS", "SSA", "Medicare", "badge number"
  
  // Structural features
  word_count:           number;
  sentence_count:       number;
  exclamation_count:    number;
  question_count:       number;
  capital_word_ratio:   number;      // 0.0–1.0
  
  // Temporal features
  time_pressure_explicit: boolean;   // "within 24 hours", "today only"
  deadline_mentioned:   boolean;
  specific_amount_mentioned: boolean;
  specific_amount?:     number;
  
  // Relationship features (for grooming detection)
  first_contact:        boolean;     // or part of ongoing conversation?
  days_since_first_contact?: number;
  financial_request_sequence?: number; // how many contacts before financial ask
  
  // Trust exploitation
  uses_real_institution_name: boolean;
  institution_names:    string[];
  spoofed_number:       boolean;
  official_number_claimed: boolean;
  
  // NLP features (computed offline, not real-time)
  sentiment_score?:     number;      // -1.0 to 1.0
  toxicity_score?:      number;      // 0.0 to 1.0
  readability_score?:   number;      // Flesch-Kincaid
  embedding_vector?:    number[];    // 1536-dim for similarity search
}

interface Annotation {
  annotator_id:         string;
  annotator_type:       'human_expert' | 'human_crowd' | 'llm_gpt4o' | 'llm_claude' | 'rule_based';
  annotation_date:      string;
  
  // Labels assigned by this annotator
  is_scam:              boolean;
  threat_types:         ThreatType[];
  alert_level:          'none' | 'amber' | 'red' | 'black';
  confidence:           number;      // 0.0–1.0
  
  // Explanations (used for LLM fine-tuning explanation generation)
  plain_english_explanation: string; // why this is a scam, in elder-friendly language
  key_red_flags:        string[];    // 2–5 bullet points
  safe_action:          string;      // what the elder should do
  
  // Quality
  time_taken_seconds?:  number;
  annotation_notes?:    string;
}

interface QualityMetadata {
  inter_annotator_agreement?: number;   // Cohen's Kappa if multiple annotators
  annotation_count:     number;
  disagreements_resolved: boolean;
  resolution_method?:   'majority_vote' | 'expert_adjudication' | 'llm_adjudication';
  data_quality_flag:    'gold' | 'silver' | 'bronze' | 'review_needed';
  // gold: multiple human expert annotators, full agreement
  // silver: 2+ annotators, resolved disagreements
  // bronze: single annotator or LLM-only
  // review_needed: conflicting annotations, needs human review
  last_reviewed:        string;
  is_edge_case:         boolean;     // challenging/borderline examples flagged
  edge_case_type?:      string;
}
Dataset Composition Requirements
TypeScript

// dataset-config.ts

const DATASET_TARGETS = {
  total_records: 100_000,          // minimum for production

  // Class balance (is_scam distribution)
  class_balance: {
    scam:   0.50,                  // 50,000 scam examples
    benign: 0.50,                  // 50,000 benign examples
    // Note: real-world is ~5% scam, but we oversample for classifier training
    // Apply class weights during training to correct for this
  },

  // Channel distribution
  channel_distribution: {
    phone_call: 0.40,              // highest risk channel for elders
    sms:        0.25,
    email:      0.20,
    web_page:   0.10,
    in_person:  0.05,
  },

  // Threat type coverage (all must be represented)
  min_per_threat_type: 500,

  // Quality requirements
  quality_distribution: {
    gold:           0.20,          // 20% gold-standard
    silver:         0.50,
    bronze:         0.25,
    review_needed:  0.05,          // flagged for review, not used in training
  },

  // Temporal coverage
  year_range: [2019, 2025],        // scam patterns evolve rapidly — recency matters
  recency_weight: {
    '2025': 0.40,
    '2024': 0.25,
    '2023': 0.15,
    '2022': 0.10,
    '2019-2021': 0.10,
  },

  // Locale coverage
  locale_distribution: {
    'en-US': 0.50,
    'en-GB': 0.25,
    'en-AU': 0.05,
    'en-CA': 0.05,
    'es-US': 0.10,
    'other': 0.05,
  },

  // Negative class requirements (benign examples — CRITICAL to prevent over-triggering)
  benign_subtypes: {
    real_bank_communications:   0.20,   // genuine bank alerts and messages
    real_government_letters:    0.15,   // actual IRS, SSA, Medicare comms
    real_healthcare_comms:      0.15,   // GP, pharmacy, hospital
    legitimate_marketing:       0.20,   // real commercial emails/calls
    family_friend_contact:      0.20,   // real personal communications
    utility_bills_service:      0.10,   // real utility/service comms
  },
};
Synthetic Data Generation Templates
TypeScript

// data-generation/templates.ts

/**
 * Template engine for generating synthetic training examples
 * Used to ensure coverage of all threat types and combinations
 */

interface ScamTemplate {
  id:             string;
  threat_type:    ThreatType;
  channel:        SignalMetadata['channel'];
  template_text:  string;       // use {{PLACEHOLDERS}} for variable substitution
  variables:      TemplateVariable[];
  target_alert_level: 'amber' | 'red' | 'black';
  generation_weight: number;    // relative frequency of this template
}

interface TemplateVariable {
  name:           string;
  type:           'institution' | 'amount' | 'payment_method' | 'official_title' |
                  'urgency_phrase' | 'fear_phrase' | 'case_number' | 'time_pressure' |
                  'reward_phrase' | 'elder_name' | 'family_member_name';
  values:         string[];     // sample values
}

// Example templates:

const TEMPLATES: ScamTemplate[] = [
  {
    id: 'T001',
    threat_type: 'irs_impersonation',
    channel: 'phone_call',
    template_text: `
      [SCAMMER]: Hello, this is {{OFFICIAL_TITLE}} {{FAKE_NAME}} from the 
      {{INSTITUTION}}. Your Social Security number has been suspended due to 
      suspicious activity. Case number {{CASE_NUMBER}}. You must pay 
      {{AMOUNT}} in {{PAYMENT_METHOD}} within {{TIME_PRESSURE}} or a warrant 
      will be issued for your arrest. Do NOT hang up and do NOT tell anyone 
      about this call.
    `,
    variables: [
      { name: 'OFFICIAL_TITLE', type: 'official_title',
        values: ['Officer', 'Special Agent', 'Inspector', 'Supervisor', 'Deputy'] },
      { name: 'INSTITUTION', type: 'institution',
        values: ['Internal Revenue Service', 'IRS', 'Social Security Administration',
                 'Department of Treasury', 'Federal Bureau of Investigation'] },
      { name: 'CASE_NUMBER', type: 'case_number',
        values: ['IRS-2024-{{RAND:7}}', 'SSA-{{RAND:8}}', 'CASE#{{RAND:6}}'] },
      { name: 'AMOUNT', type: 'amount',
        values: ['$1,500', '$2,340', '$4,800', '$892', '$12,000'] },
      { name: 'PAYMENT_METHOD', type: 'payment_method',
        values: ['Google Play gift cards', 'Bitcoin', 'wire transfer',
                 'Amazon gift cards', 'cryptocurrency'] },
      { name: 'TIME_PRESSURE', type: 'urgency_phrase',
        values: ['2 hours', 'the next hour', 'before 5pm today', '30 minutes'] },
    ],
    target_alert_level: 'red',
    generation_weight: 8,
  },

  {
    id: 'T002',
    threat_type: 'grandparent_scam',
    channel: 'phone_call',
    template_text: `
      [SCAMMER (posing as grandchild)]: {{GRANDPARENT_NAME}}? It's me, 
      {{GRANDCHILD_NAME}}. I'm in trouble. I was in a {{INCIDENT}} and I'm 
      in jail. Please don't tell {{PARENT_NAME}} — they'll be so upset. 
      My lawyer says I need {{AMOUNT}} for bail right now. Can you send 
      {{PAYMENT_METHOD}}? Please hurry — I'm scared.
    `,
    variables: [
      { name: 'GRANDPARENT_NAME', type: 'elder_name',
        values: ['Grandma', 'Grandpa', 'Nana', 'Pop', 'Gran'] },
      { name: 'GRANDCHILD_NAME', type: 'family_member_name',
        values: ['Jake', 'Emma', 'Tyler', 'Sophie', 'Michael'] },
      { name: 'INCIDENT', type: 'fear_phrase',
        values: ['car accident', 'fight', 'drug arrest', 'border crossing incident'] },
      { name: 'PARENT_NAME', type: 'family_member_name',
        values: ['Mom', 'Dad', 'your daughter', 'your son'] },
      { name: 'AMOUNT', type: 'amount',
        values: ['$3,500', '$8,000', '$1,200', '$5,000'] },
      { name: 'PAYMENT_METHOD', type: 'payment_method',
        values: ['Western Union', 'wire it', 'Bitcoin ATM', 'Zelle'] },
    ],
    target_alert_level: 'red',
    generation_weight: 7,
  },

  {
    id: 'T003',
    threat_type: 'tech_support',
    channel: 'web_page',
    template_text: `
      ⚠️ CRITICAL SECURITY ALERT ⚠️
      
      Your {{DEVICE}} has been infected with {{VIRUS_COUNT}} viruses.
      Your personal information, banking details and passwords are at risk.
      
      DO NOT CLOSE THIS WINDOW
      
      Call Microsoft Support immediately: {{FAKE_NUMBER}}
      
      Your computer will be disabled in {{TIME_PRESSURE}} if you do not act now.
      
      Case ID: {{CASE_NUMBER}}
      Windows Defender Alert: Trojan Spyware Detected
    `,
    variables: [
      { name: 'DEVICE', type: 'institution',
        values: ['computer', 'Windows PC', 'device', 'laptop'] },
      { name: 'VIRUS_COUNT', type: 'case_number',
        values: ['5', '12', '3', '8', '27'] },
      { name: 'FAKE_NUMBER', type: 'urgency_phrase',
        values: ['+1-800-555-0147', '0800-XXX-XXXX', '1-888-555-0132'] },
      { name: 'TIME_PRESSURE', type: 'time_pressure',
        values: ['5 minutes', '2 minutes', '60 seconds', '10 minutes'] },
      { name: 'CASE_NUMBER', type: 'case_number',
        values: ['WIN-2024-{{RAND:8}}', 'ALERT-{{RAND:6}}', '#{{RAND:10}}'] },
    ],
    target_alert_level: 'red',
    generation_weight: 6,
  },

  // ─── BENIGN TEMPLATES (critical for false positive prevention) ───

  {
    id: 'B001',
    threat_type: 'benign',
    channel: 'email',
    template_text: `
      From: noreply@hsbc.co.uk
      Subject: Your HSBC statement is ready
      
      Dear {{NAME}},
      
      Your monthly statement for {{ACCOUNT_TYPE}} ending {{ACCOUNT_MASK}} 
      is now available to view online. Log in to your HSBC account at 
      hsbc.co.uk to view it.
      
      If you have any questions, please call us on the number on the back 
      of your card.
      
      HSBC UK Customer Services
    `,
    variables: [
      { name: 'NAME', type: 'elder_name', values: ['Margaret', 'John', 'Dorothy'] },
      { name: 'ACCOUNT_TYPE', type: 'institution',
        values: ['current account', 'savings account', 'credit card'] },
      { name: 'ACCOUNT_MASK', type: 'case_number', values: ['1234', '5678', '9012'] },
    ],
    target_alert_level: 'none',
    generation_weight: 5,
  },
];
Dataset Versioning & Governance
YAML

# dataset-manifest.yaml
# Stored in: s3://haven-ml-assets/datasets/scam-detection/manifest.yaml

dataset:
  name: "haven-scam-detection-v2"
  version: "2.1.0"
  created: "2025-06-10"
  record_count: 100000
  
  sources:
    - name: "FTC Consumer Sentinel"
      license: "Public domain (FOIA)"
      records: 18000
      preprocessing: "PII redacted via Presidio, verified by legal"
    - name: "IC3 Annual Reports 2021-2025"
      license: "Public domain"
      records: 12000
      preprocessing: "Structured complaint data, PII removed"
    - name: "AARP Fraud Watch Network"
      license: "Partnership agreement"
      records: 8000
    - name: "Synthetic (GPT-4o generated)"
      license: "Internal"
      records: 42000
      generation_model: "gpt-4o-2024-11-20"
      generation_prompt_version: "v3.2"
      human_review_sample_pct: 10
    - name: "Expert crafted (security researchers)"
      license: "Internal"
      records: 5000
    - name: "Benign corpus (negative class)"
      license: "Internal + CC0"
      records: 15000

  quality:
    gold_standard_count: 20000
    inter_annotator_kappa: 0.87
    human_review_count: 35000
    
  splits:
    train: 0.70
    validation: 0.15
    test: 0.10
    holdout: 0.05       # never used in training, reserved for production eval
    
  model_targets:
    - "haven-heuristic-classifier-v2"    # rule-based, on-device
    - "haven-scam-bert-v2"               # fine-tuned DistilBERT
    - "haven-llm-reasoning-prompt-v3"    # GPT-4o system prompt + few-shot

  ethics:
    bias_audit_date: "2025-05-01"
    bias_audit_findings: "See ethics/bias-report-v2.pdf"
    false_positive_target: 0.02    # <2% false positive rate (elder dignity)
    false_negative_target: 0.10    # <10% false negative rate (fraud protection)
    # Note: we accept higher false negatives than false positives
    # because over-triggering destroys elder trust in HAVEN
    
  updates:
    refresh_cadence: "monthly"    # scam patterns evolve — monthly retraining
    drift_detection: "psi_threshold_0.1"  # Population Stability Index
    human_review_trigger: "when_psi_exceeded"
Heuristic Rule Engine Spec
TypeScript

// scam-detection/heuristic-rules.ts

/**
 * Fast rule-based classifier — runs on-device, < 5ms
 * These rules are the first pass before LLM reasoning
 */

interface HeuristicRule {
  id:             string;
  name:           string;
  threat_type:    ThreatType;
  weight:         number;       // contribution to total score (0.0–1.0)
  triggers:       RuleTrigger[];
}

type RuleTrigger =
  | RegexTrigger
  | PhraseTrigger
  | StructuralTrigger
  | MetadataTrigger;

interface RegexTrigger {
  type:           'regex';
  pattern:        string;
  flags?:         string;       // 'i' for case-insensitive
  field:          'full_text' | 'subject' | 'sender' | 'url';
}

interface PhraseTrigger {
  type:           'phrase_list';
  phrases:        string[];
  match_type:     'exact' | 'contains' | 'starts_with' | 'fuzzy';
  field:          string;
}

interface StructuralTrigger {
  type:           'structural';
  condition:      'exclamation_count_gt' | 'capital_ratio_gt' |
                  'word_count_lt' | 'url_age_lt_days' |
                  'new_payee' | 'amount_gt';
  threshold:      number;
}

interface MetadataTrigger {
  type:           'metadata';
  condition:      'number_in_blocklist' | 'domain_in_blocklist' |
                  'spf_fail' | 'dkim_fail' | 'display_name_mismatch' |
                  'domain_age_lt_days';
  source?:        string;       // blocklist source
}

// ─── RULE CATALOGUE ───────────────────────────────

const HEURISTIC_RULES: HeuristicRule[] = [

  // ── URGENCY PRESSURE ─────────────────────────
  {
    id: 'H001',
    name: 'Explicit Time Pressure',
    threat_type: 'urgency_pressure',
    weight: 0.25,
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'act now', 'act immediately', 'act today',
        'within 24 hours', 'within the hour', 'within 2 hours',
        'by end of day', 'before midnight', 'expires today',
        'last chance', 'final notice', 'urgent action required',
        'do not delay', 'respond immediately', 'time sensitive',
        'your account will be', 'will be suspended', 'will be closed',
        'will be arrested', 'warrant will be issued',
      ],
    }],
  },

  // ── PAYMENT METHOD DEMANDS ────────────────────
  {
    id: 'H002',
    name: 'Gift Card Payment Request',
    threat_type: 'gift_card_demand',
    weight: 0.85,   // high weight — legitimate entities never ask for gift cards
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'gift card', 'gift cards', 'iTunes card', 'Google Play card',
        'Amazon gift card', 'Steam card', 'eBay card',
        'buy cards', 'purchase cards', 'send card numbers',
        'card numbers and pin', 'scratch the back',
      ],
    }],
  },
  {
    id: 'H003',
    name: 'Crypto/Wire Transfer Demand',
    threat_type: 'wire_transfer',
    weight: 0.70,
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'wire transfer', 'wire the money', 'bitcoin', 'cryptocurrency',
        'crypto ATM', 'bitcoin ATM', 'ethereum', 'USDT', 'tether',
        'western union', 'moneygram', 'money order',
        'cashapp', 'cash app', 'zelle', 'venmo',
      ],
    }],
  },

  // ── AUTHORITY IMPERSONATION ───────────────────
  {
    id: 'H004',
    name: 'Government Agency Impersonation',
    threat_type: 'irs_impersonation',
    weight: 0.55,
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'internal revenue service', 'IRS officer', 'IRS agent',
        'social security administration', 'your SSN has been',
        'social security number suspended', 'medicare representative',
        'department of treasury', 'federal bureau of investigation',
        'department of justice', 'immigration enforcement',
        'customs and border protection',
        'HMRC officer', 'department for work and pensions',  // UK variants
        'national crime agency',
      ],
    }],
  },
  {
    id: 'H005',
    name: 'Bank Impersonation Phrase',
    threat_type: 'bank_impersonation',
    weight: 0.45,
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'your account has been compromised',
        'suspicious activity on your account',
        'your card has been frozen',
        'we need to verify your account',
        'confirm your account details',
        'your online banking access has been',
      ],
    }],
  },

  // ── ISOLATION TACTIC ─────────────────────────
  {
    id: 'H006',
    name: 'Isolation / Secrecy Demand',
    threat_type: 'isolation_tactic',
    weight: 0.90,   // highest weight — secrecy is the #1 scam enabler
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        "don't tell anyone", "don't tell your family", "keep this confidential",
        "this is a confidential matter", "do not discuss with family",
        "do not contact your bank", "do not hang up",
        "don't mention this to", "between us only",
        "tell no one", "this is a secret",
        "your family will be charged", "they will make it worse",
      ],
    }],
  },

  // ── FEAR TRIGGERS ─────────────────────────────
  {
    id: 'H007',
    name: 'Arrest / Legal Threat',
    threat_type: 'irs_impersonation',
    weight: 0.70,
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        'arrest warrant', 'warrant for your arrest', 'will be arrested',
        'local police', 'sheriff will come', 'federal agents',
        'face criminal charges', 'criminal investigation',
        'you will be prosecuted', 'law enforcement',
      ],
    }],
  },

  // ── STRUCTURAL ANOMALIES ──────────────────────
  {
    id: 'H008',
    name: 'Excessive Capitalisation',
    threat_type: 'urgency_pressure',
    weight: 0.15,
    triggers: [{
      type: 'structural',
      condition: 'capital_ratio_gt',
      threshold: 0.35,   // >35% words fully capitalised
    }],
  },
  {
    id: 'H009',
    name: 'Very New Domain',
    threat_type: 'phishing_link',
    weight: 0.60,
    triggers: [{
      type: 'metadata',
      condition: 'domain_age_lt_days',
      source: 'whois',
    }],
  },
  {
    id: 'H010',
    name: 'Display Name / Domain Mismatch',
    threat_type: 'bank_impersonation',
    weight: 0.75,
    triggers: [{
      type: 'metadata',
      condition: 'display_name_mismatch',
    }],
  },
  {
    id: 'H011',
    name: 'Remote Access Download Detected',
    threat_type: 'tech_support',
    weight: 0.80,
    triggers: [{
      type: 'phrase_list',
      field: 'url',
      match_type: 'contains',
      phrases: [
        'anydesk', 'teamviewer', 'supremo', 'logmein',
        'screenconnect', 'showmypc', 'ultraviewer',
      ],
    }],
  },
  {
    id: 'H012',
    name: 'Romance Grooming Pattern',
    threat_type: 'romance_scam',
    weight: 0.45,   // moderate — context needed (hence LLM layer follows)
    triggers: [{
      type: 'phrase_list',
      field: 'full_text',
      match_type: 'contains',
      phrases: [
        "you're the only one", "never felt this way",
        "want to meet you", "fallen for you",
        "destiny brought us", "God sent you to me",
        "oil rig", "military deployment", "working overseas",
        "send money so I can visit", "visa application",
        "emergency surgery", "customs fees",
      ],
    }],
  },
];

/**
 * Score aggregation — combines rule weights
 * Returns: { score: 0.0–1.0, triggered_rules: string[], threat_types: ThreatType[] }
 */
function computeHeuristicScore(
  signal: SignalContent,
  metadata: SignalMetadata
): HeuristicResult {
  const triggeredRules: HeuristicRule[] = [];
  
  for (const rule of HEURISTIC_RULES) {
    if (evaluateRule(rule, signal, metadata)) {
      triggeredRules.push(rule);
    }
  }

  // Weighted combination with diminishing returns (not simple sum)
  // Formula: 1 - product(1 - weight_i) for all triggered rules
  const score = 1 - triggeredRules.reduce(
    (acc, rule) => acc * (1 - rule.weight), 1.0
  );

  const threatTypes = [...new Set(triggeredRules.map(r => r.threat_type))];

  return {
    score,
    triggered_rules: triggeredRules.map(r => r.id),
    threat_types: threatTypes,
    // Route to LLM if score > 0.35 but < 0.90 (uncertain zone)
    needs_llm_review: score > 0.35,
    // Direct amber/red if score > 0.90 (highly confident heuristic)
    direct_alert_level: score > 0.90 ? 'red' : score > 0.65 ? 'amber' : 'none',
  };
}
LLM Reasoning Layer System Prompt
TypeScript

// scam-detection/llm-prompt.ts

const SCAM_DETECTION_SYSTEM_PROMPT = `
You are HAVEN Shield, a scam detection engine protecting elderly adults from 
fraud. Your job is to analyse communications and determine if they are scams.

## YOUR PRINCIPLES
- Be accurate above all — a false alarm erodes trust; a missed scam costs money
- The elder's dignity matters: never over-alarm on ambiguous signals
- Real banks, government agencies, and reputable businesses NEVER ask for:
  → Gift cards of any kind
  → Bitcoin or cryptocurrency
  → Wire transfers to new accounts
  → Immediate payment to avoid arrest
  → Secrecy from family members
  → Remote computer access

## WHAT YOU WILL RECEIVE
- The full text/transcript of a communication (PII already redacted)
- Signal metadata (channel, sender info, heuristic scores)
- Previous interactions with this contact (if any)

## WHAT YOU MUST OUTPUT
Return a JSON object with these exact fields:
{
  "is_scam": boolean,
  "confidence": "certain" | "likely" | "possible" | "uncertain",
  "alert_level": "none" | "amber" | "red" | "black",
  "threat_types": string[],
  "explanation": string,     // Elder-friendly, max 2 sentences, warm not alarming
  "key_red_flags": string[], // Max 3 short bullets, plain English
  "safe_action": string,     // One clear action the elder can take
  "family_note": string,     // For the family digest — factual, brief
  "coaching_card": {         // For live coaching during call (if applicable)
    "what_they_asked": string,
    "safe_response": string,
    "real_X_never": string[]
  } | null
}

## ALERT LEVEL GUIDANCE
- none:   Clear legitimate communication
- amber:  Suspicious but not certain — flag and inform, don't alarm
- red:    Almost certainly a scam — full overlay, family notified silently  
- black:  Active financial transaction detected during scam — pause + family call

## TONE FOR EXPLANATIONS (elder-facing)
- Never use the word "stupid", "foolish", or "you should have"
- Never be alarming or create panic
- Warm, calm, and informative — like a trusted friend explaining something
- Example good: "This message has some patterns we often see in scam calls. 
  Real government agencies don't call and ask for gift cards."
- Example bad: "WARNING: THIS IS A CONFIRMED SCAM. DO NOT RESPOND."
`;

// Few-shot examples (3–5 pairs per threat type, included in context)
const FEW_SHOT_EXAMPLES = [
  {
    input: {
      channel: 'phone_call',
      transcript: '[Redacted IRS impersonation call transcript]',
      heuristic_score: 0.87,
      triggered_rules: ['H001', 'H002', 'H004', 'H006'],
    },
    output: {
      is_scam: true,
      confidence: 'certain',
      alert_level: 'red',
      threat_types: ['irs_impersonation', 'gift_card_demand', 'isolation_tactic'],
      explanation: "This looks like an IRS impersonation scam — a very common one. Real IRS agents never call and ask for gift cards, and they never threaten immediate arrest.",
      key_red_flags: [
        "Asking for payment in gift cards — real government agencies never do this",
        "Threatening arrest if you don't pay immediately",
        "Telling you not to tell your family"
      ],
      safe_action: "Hang up. Call your family. Report it at reportfraud.ftc.gov.",
      family_note: "A likely IRS impersonation call. Elder was told not to tell family. No payment detected yet.",
      coaching_card: {
        what_they_asked: "Gift card payment",
        safe_response: "I need to call you back. Give me your official number.",
        "real_X_never": ["calls to demand gift cards", "threatens immediate arrest", "asks you to keep it secret"]
      }
    }
  },
  // ... additional examples
];
🔬 SECTION 4 — Final Complete Gap Analysis Summary
Here is the full catalogue of every addition across both your list and the new gaps identified above:

#	Feature	Pillar	Status
1	Wills, Deeds & Document Vault	SHIELD	✅ Your list
2	Phone Reputation & Call Intercept (Enhanced)	SHIELD	✅ Your list
3	Financial Guardian Mode	SHIELD	✅ Your list
4	Social Engineering Pattern Memory	SHIELD	🆕 New
5	Legacy Contact & Digital Estate Planner	SHIELD	🆕 New
6	Telehealth Integration	ANCHOR	✅ Your list
7	Appointment Transport Coordination	ANCHOR	✅ Your list
8	Hydration & Nutrition Nudges	ANCHOR	✅ Your list
9	GP/PCP FHIR Integration & Prescription Sync	ANCHOR	🆕 New
10	Vital Signs Companion	ANCHOR	🆕 New
11	Grandchildren Bridge	CIRCLE	✅ Your list
12	Community Event Aggregator	CIRCLE	✅ Your list
13	Intergenerational Skill Exchange	CIRCLE	🆕 New
14	Memory Lane — Photo & Anniversary Reminders	CIRCLE	🆕 New
15	Grief & Bereavement Module	COMPASS	✅ Your list
16	Emergency Medical Profile (Enhanced)	COMPASS	✅ Your list
17	Night Safety Mode	COMPASS	✅ Your list
18	Wandering & Exit Detection (AirTag/Tile)	COMPASS	🆕 New
19	Driving Safety Monitor	COMPASS	🆕 New
20	The Companion Voice	VOICE	✅ Your list
21	Multilingual & Dialect Support	VOICE	🆕 New
22	Offline Companion Mode	VOICE	🆕 New
23	Professional Carer Portal	GUARDIAN (New Pillar)	🆕 New
24	Care Plan Document Hub	GUARDIAN	🆕 New
25	Incident Reporting & Safeguarding	GUARDIAN	🆕 New
🚀 Revised Hackathon Build Priority
Given the full feature set, here is the revised 45-hour build priority — focused on what will win the demo:

text

MUST SHIP (Demo Critical — Hours 0–35):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ H0–6:   Foundation + Home Screen (4 buttons, voice TTS)
✅ H6–15:  ANCHOR — Medication photo setup + Daily Brief + Reminders
✅ H15–24: SHIELD — Scam classifier + Red overlay + Silent family alert
✅ H24–30: CIRCLE — "Thinking of you" + Life Story (1 prompt)
✅ H30–35: COMPASS — "What Was That?" document explainer

STRONG TO HAVE (Hours 35–42):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ H35–38: VOICE — Morning companion ("How are your roses, Margaret?")
⭐ H38–40: Financial Guardian — anomaly alert flow
⭐ H40–42: Family Dashboard — live scam alert + medication dashboard

POLISH (Hours 42–45):
━━━━━━━━━━━━━━━━━━━━━
🎨 H42–45: Demo script + pitch rehearsal + device setup
This gives you:

35 tables with full column specs, constraints, and indexes
Complete RLS pattern for elder data ownership
50+ components with precise size/colour/interaction specs
100,000-record dataset structure with templates, rules, and governance
25 additional features — 13 from your list and 12 newly identified gaps
Good luck at the hackathon — HAVEN is genuinely one of the most important ideas in the elder-care space. Build it well. 🛡️





i am partaking in the following (https://megathon.xyz/?utm_source=luma) and would like to build the following (# 🌟 HAVEN — Your Parent's Guardian, Your Peace of Mind

One app. One mission. Make aging feel safe, connected, and dignified.

The Crisis in Numbers (Why This Has to Exist)
The scale of the problem is staggering and accelerating across every dimension:

Fraud:
Americans 60 and older reported $7.748 billion in internet-enabled fraud losses in 2025 — up 59% from 2024 and roughly 360% from 2021. Adults 60 and older also reported 3,143 AI-related complaints in 2025, with $352.5 million in losses — likely an undercount. The FTC warns that real losses are far higher due to underreporting, estimating the overall cost of fraud to older adults in 2024 was between $10.1 billion and $81.5 billion.

Loneliness:
Roughly 1 in 4 people over 65 are socially isolated, which could potentially affect the health and well-being of millions of Americans. Individuals who experience isolation have higher levels of negative cardiovascular outcomes, functional limitations, cognitive health, and a 30% increased mortality risk — a risk that has been compared to smoking 15 cigarettes a day. Social isolation leads to a 50% increased risk of dementia among older adults, according to the CDC.

Medication:
On average, older adults take 6–8 medications, typically due to multiple chronic diseases, placing them at increased risk for polypharmacy. Nearly 50% of patients do not take their medications as prescribed, leading to nearly 200,000 preventable deaths and hospitalizations annually and billions in avoidable healthcare costs.

These three crises are treated as separate problems by separate fragmented apps. HAVEN treats them as one.

🧭 The Core Philosophy
"A 5-year-old should be able to use it. A worried adult child should be able to trust it."

Every design decision flows from 3 inviolable principles:

Zero Learning Curve — If it needs a tutorial, it failed. Every action must be discoverable by touch alone.
Voice First, Screen Second — The primary interface is a calm, warm, human voice. The screen is confirmation, not navigation.
Dignity Always — HAVEN never patronises, never alarms unnecessarily, never makes an elder feel surveilled. It feels like a trusted companion, not a monitor.
🏗️ HAVEN: Full Product Architecture
🔴 PILLAR 1 — SHIELD
The Fraud & Scam Protection Layer
This is the always-on nervous system of HAVEN. It runs passively in the background on phone/tablet/browser — never getting in the way until it needs to.

1.1 — Real-Time Scam Intercept
The Problem:
Impersonation scammers exploit seniors' trust in authority — often posing as FTC officials, banks, or law enforcement to pressure older adults into quickly transferring funds. Most fraud starts with three red flags: an unexpected contact, a surge of emotion, and a sense of urgency.

What HAVEN Does:

Every incoming call, SMS, email, and web page passes through the HAVEN Shield Engine — a lightweight, local-first classifier that scores for:

🚨 Impersonation signals — "This is the IRS / Medicare / Social Security / your bank"
🚨 Urgency pressure — "Act now," "Within 24 hours," "Your account will be closed"
🚨 Unusual payment requests — Gift cards, wire transfers, cryptocurrency ATMs
🚨 Fear + reward triggers — "You've won," "You owe," "Your computer is infected"
🚨 IC3 / FTC lookalike patterns — Fake government report pages
🚨 Romance/trust grooming patterns — Relationship-first, money-second over time
UI Response (3 levels, never alarming):

Threat Level What the Elder Sees/Hears What Happens
🟡 Amber A gentle amber glow on screen + calm voice: "This looks a little unusual. Want me to check it for you?" No block. Just flags.
🔴 Red Full screen soft overlay: "HAVEN thinks this might be a scam. Here's why. You don't have to do anything right now." Family notified silently
⚫ Black (transaction) If a payment app / bank transfer is detected during a red alert: "Before you send money — let's call [Family Name] together first" Transfer pause request sent
Key Design Choices:

HAVEN never blocks anything automatically — it pauses and explains (agency preserved)
The voice is always calm and unhurried — never alarmist
One-tap "I trust this person" to dismiss and log for family review later
Because scammers actively tell victims "don't tell anyone," HAVEN's silent family alert is the critical backstop — the elder doesn't need to act for a loved one to be informed
1.2 — The Safe Conversation Coach
When a suspicious call is active, HAVEN activates a live coaching card on screen (no sound — elder can glance):

text

💬 HAVEN LIVE GUIDE

They asked for: Gift card payment
Safe response: "I need to call you back.
Give me your official number."

Real banks NEVER ask for:
✗ Gift cards ✗ Wire transfers
✗ Your PIN ✗ Urgent action
No judgment. No alarm. Just clarity — in the moment it's needed most.

1.3 — Browser & App Shield
A lightweight browser companion that:

Flags checkout pages with gift card flow during suspicious calls
Detects "remote support" download pages (TeamViewer / AnyDesk during call)
Highlights fake "IC3 complaint" portals and government impersonation domains
Shows a domain trust score — plain language, not technical (e.g., "This site is 3 days old. Real government sites are much older.")
1.4 — The Weekly Safety Digest (For Family)
Every Sunday, the designated family member receives a clean, beautiful digest:

✅ Scams intercepted this week
📞 Suspicious calls flagged
💚 Safe activity summary
⚠️ One thing to talk about this week (if anything)
Tone: Reassuring, not alarming. This is not a surveillance report — it's a peace of mind report.

💊 PILLAR 2 — ANCHOR
The Health, Medication & Daily Rhythm Layer
2.1 — The Medication Companion
The Problem:
Factors increasing the likelihood of nonadherence in the elderly include adverse drug reactions that come with polypharmacy, decreased visibility and motor dexterity, and decreased autonomy. Beyond diminished treatment effects, medication nonadherence has been associated with elevated mortality, increased healthcare utilization, and higher financial cost burden.

What HAVEN Does:

Setup is done once by a family member or caregiver — they photograph the medication bottles. HAVEN uses OCR + a pharmacy DB to:

Extract medication names, dosages, and schedules
Build a plain-English medication card (no jargon: "Your white oval pill for your heart — 8am and 8pm")
Generate a visual + voice reminder schedule
The Reminder Experience (this is where HAVEN is different from every other app):

No buzzing alarm. No clinical notification. Instead:

🗣️ "Good morning, Margaret. It's 8 o'clock — time for your heart pill, the white oval one. I'll remind you again in 10 minutes if you'd like."

Key features:

Snooze with voice — "Not yet" delays by 15 minutes, logged
Taken confirmation — one big tap, or "Done" spoken aloud
Missed dose escalation — if missed 2× in a row: quiet alert to family (not an alarm — a note)
Refill detection — tracks when a 30-day supply would run out and prompts: "Your blood pressure prescription runs out in 5 days. Want me to remind you to call the pharmacy?"
Interaction flag — if a new medication is added that commonly conflicts with existing ones, a plain-language heads-up (not medical advice — just: "Something to ask your doctor about")
The Medication Card (printed / wallet-sized):
HAVEN generates a beautiful, printable emergency med card: name, conditions, meds, dosages, allergies, doctor's name and number. Designed for the ER handoff moment.

2.2 — The Daily Rhythm Board
Every morning, HAVEN speaks a 30-second Daily Brief:

🗣️ "Good morning, Margaret. It's Tuesday, June 10th. The weather is 18 degrees and sunny — lovely for a walk. You have your doctor's appointment at 2pm today. Your medication is due at 8am. And your daughter Sarah sent you a message — want me to read it?"

This is the whole day in one breath — no navigation, no menus.

The screen version is a single, giant-text card:

text

┌─────────────────────────────────┐
│ Good Morning, Margaret ☀️ │
│ │
│ 💊 8:00am Heart pill │
│ 🏥 2:00pm Dr. Patel │
│ 💊 8:00pm Heart pill │
│ │
│ 📱 Message from Sarah │
│ 🌤️ 18° Sunny │
└─────────────────────────────────┘
Font size: enormous. Tap targets: the whole row. Zero nested menus.

2.3 — Smart Task & Todo Manager (Voice-Driven)
Adding a task is a single sentence:

"Remind me to call the plumber tomorrow morning"
"Don't forget — dentist Thursday at 11"
"I need to buy bread on Friday"

HAVEN understands natural language completely. No typing. No forms.

Tasks speak back:

🗣️ "Tomorrow morning I'll remind you to call the plumber."

Family members can also add tasks remotely ("Tell Mum to take her blood pressure reading today") — which appear with the family member's name attached ("A reminder from Sarah: take your blood pressure today").

2.4 — Gentle Fall & Wellness Check-In
Not a clinical tracker. Not surveillance. Just a daily check-in question:

🗣️ "How are you feeling today, Margaret?"

One-tap response (or spoken):

😊 Great
😐 Okay
😔 Not great today
If "not great" 3 days in a row → family member receives a warm note: "Mum has said she's not feeling her best the last few days — might be worth a check-in call."

Optional: motion-based passive check-in via phone sensors (if phone hasn't moved by 11am and no app activity) → gentle ping → if no response → family notified.

🤝 PILLAR 3 — CIRCLE
The Connection & Community Layer
This is the most emotionally resonant pillar — and the most underbuilt in every competing product.

3.1 — The Neighbourhood Connector
The Problem:
Almost 30% of elderly adults live alone, which translates to millions of seniors without daily companionship. One in three seniors reported distance from family and friends as the primary cause of loneliness. 75% of seniors who have a family wish they saw their family more, and 66% often feel forgotten about by their family.

What HAVEN Does:

A hyper-local, privacy-first "who's near me" layer for elders:

HAVEN shows other HAVEN users within a configurable radius (500m–5km)
No names, no photos until mutual opt-in — just "3 people your age nearby also use HAVEN"
Interest matching — simple tags: "🌿 Gardening," "📖 Reading," "♟️ Chess," "🎵 Music," "🚶 Walking"
Suggested meetups — "There's a free garden talk at the library 800m away Thursday. Two people nearby marked it as interesting."
The Walk Buddy — "Margaret, would you like HAVEN to find someone nearby who also goes for morning walks?"
Privacy architecture:

Location is fuzzy by default (neighbourhood-level, not address)
No direct messaging until both parties consent
Family member can see who their elder has connected with (with elder's knowledge)
Full opt-out at any time — no dark patterns
3.2 — The Family Bridge
The most common elder complaint: 66% of seniors feel forgotten about by their family.

HAVEN makes staying connected frictionless for both sides:

For the elder:

One-tap "Thinking of you" button for each family member (sends a warm notification: "Mum is thinking of you 💙")
Voice message recording: "Send a message to Sarah" → records → sends as audio note
Life Story Prompts — once a week, HAVEN gently asks: "Tell me a memory from when you were young — I'll save it for your family." Builds a private, beautiful archive of voice memories
For the family:

The Family Dashboard (web app, separate from elder's UI):
Live safety status (green/amber/red)
Medication adherence at a glance
Recent activity summary
Messages and memories the elder has shared
Ability to add reminders/tasks for their elder
Weekly digest
The "Check In" mechanic:
Family members get a gentle Monday morning nudge: "It's been 4 days since you've connected with Mum. Send her a quick message?" — One tap sends: "Thinking of you today, Mum 💙"

3.3 — The Life Story Archive
Quietly one of the most powerful features:

Every week, HAVEN asks one gentle question:

"What was your favourite thing about where you grew up?"
"Tell me about the day you got married."
"What's the best advice anyone ever gave you?"
The elder speaks. HAVEN transcribes, organises, and stores beautifully.

Over a year: 52 stories. A living memoir. Privately accessible to family. Printable as a keepsake book. Something that exists after the elder is gone.

This feature alone makes people cry in demos.

🧠 PILLAR 4 — COMPASS
The Cognitive Safety & Orientation Layer
For elders experiencing early cognitive decline — or for families who want a gentle safety net.

4.1 — Gentle Cognitive Check-In
Not a memory test. Never clinical-feeling. Just:

🗣️ "Morning, Margaret — quick question before your coffee: what day of the week is it?"

Simple, warm, conversational. Results are logged privately. Significant changes flagged to family gently over time.

4.2 — The Safe Return Feature
For elders at risk of disorientation:

Family members can set a "safe zone" (home neighbourhood)
If the elder's phone leaves the safe zone during unusual hours → gentle check-in: "Hi Margaret — just checking in. Are you okay? Tap yes or call me."
No response after 15 minutes → family alert
Dignity preserved: elder always knows this feature is on. It can be turned off by the elder.
4.3 — "What Was That?" — The Plain-Language Explainer
When an elder encounters confusing documents, forms, or letters:

Take a photo of any letter / bill / medical form
HAVEN reads it and summarises in 3 plain sentences: "This is a bill from your electricity company. You owe €34 by July 1st. Here's the phone number to call if you have questions."
Or for medical forms: plain language summary + "Here are 3 questions to ask your doctor"
This alone eliminates one of the most common vectors for fraud — confusing official-looking documents that elders misinterpret.

🛠️ Technical Architecture
The Stack
text

┌─────────────────────────────────────────────────────┐
│ HAVEN PLATFORM │
├──────────────────┬──────────────────────────────────┤
│ ELDER APP │ FAMILY DASHBOARD │
│ React Native │ Next.js + Tailwind │
│ (iOS + Android) │ (Web) │
├──────────────────┴──────────────────────────────────┤
│ API GATEWAY (Supabase Edge) │
├──────────┬───────────┬──────────────┬───────────────┤
│ SHIELD │ ANCHOR │ CIRCLE │ COMPASS │
│ Service │ Service │ Service │ Service │
├──────────┴───────────┴──────────────┴───────────────┤
│ CORE SERVICES │
│ ┌─────────────┐ ┌────────────┐ ┌─────────────┐ │
│ │ Voice TTS/ │ │ Classifier │ │ Notification│ │
│ │ STT Engine │ │ (Scam AI) │ │ Orchestrator│ │
│ └─────────────┘ └────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌────────────┐ ┌─────────────┐ │
│ │ OCR Engine │ │ Location │ │ Story │ │
│ │ (Med/Docs) │ │ Service │ │ Archive │ │
│ └─────────────┘ └────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────┤
│ Supabase (Postgres + pgvector + RLS + Auth + Edge) │
└─────────────────────────────────────────────────────┘
Key Technical Decisions
Decision Choice Why
Voice Engine ElevenLabs (hackathon) / local Coqui TTS (prod) Warm, human-sounding voice is non-negotiable
STT Whisper (OpenAI API / local) Best accuracy for elder speech patterns
Scam Classifier Fine-tuned on FTC/IC3 scam corpus + LLM reasoning layer Rules for speed, LLM for nuance
Elder UI Framework React Native + custom large-target component library Single codebase, full accessibility
Family Dashboard Next.js + Supabase realtime subscriptions Live updates without polling
Medication OCR GPT-4o Vision / Google Vision API Prescription bottle parsing
Location React Native Location + PostGIS (Supabase) Fuzzy geofencing, privacy-preserving
Notifications Supabase Edge Functions + Expo Push Reliable cross-platform delivery
Data privacy Row-Level Security (Supabase) — elder owns their data Non-negotiable for trust
Offline Critical features (meds, today's schedule) cached locally Works without internet
The Scam Detection Pipeline
text

Incoming signal (call / SMS / email / web page)
↓
[1] Fast Heuristic Layer (< 5ms)
- Regex patterns: urgency words, payment types
- Domain age check, known scam domains
- Phone number reputation API
↓
[2] Context Classifier (< 200ms)
- Is there an active suspicious call?
- Has this contact appeared before?
- Is this a known trusted contact?
↓
[3] LLM Reasoning Layer (if score > threshold)
- Full content analysis
- Plain-English explanation generated
- Confidence scored
↓
[4] Response Orchestrator
- Amber / Red / Black level determined
- Voice alert generated
- Family notification queued (if warranted)
- Everything logged with receipt
Voice Interaction Architecture
text

Elder speaks
↓
Whisper STT → transcript
↓
Intent classifier
├── Medication ("I took my pill") → log adherence
├── Task ("Remind me to...") → create task
├── Distress ("I think I've been scammed") → alert flow
├── Story ("When I was young...") → archive recording
├── Query ("When is my appointment?") → TTS response
└── Check-in ("I'm not feeling well") → log + escalate if needed
↓
Response generated
↓
ElevenLabs TTS → warm voice response
📱 The UI Design System (For Elders)
These are non-negotiable design constraints — every component must pass all of them:

Rule Specification
Minimum text size 24px — never smaller
Minimum tap target 72×72px — fingers, not fingertips
Max items per screen 3 — never more
Navigation depth Max 2 levels from home
Colour contrast WCAG AAA minimum (7:1 ratio)
No icons without labels Every icon has a text label always visible
No swipe-only actions Every action has a visible tap alternative
No time pressure UI No countdown timers, no auto-dismiss alerts
Confirmation for destructive actions Always a second step — never immediate
High-contrast mode One-tap toggle — always visible on home screen
The Home Screen — 4 buttons. That's it:

text

┌─────────────────────────────────┐
│ Good Morning 🌅 │
│ Margaret │
│ │
│ ┌─────────┐ ┌─────────┐ │
│ │ 💊 │ │ 📅 │ │
│ │ My Pills│ │ Today │ │
│ └─────────┘ └─────────┘ │
│ │
│ ┌─────────┐ ┌─────────┐ │
│ │ 👪 │ │ 🆘 │ │
│ │ Family │ │ Help │ │
│ └─────────┘ └─────────┘ │
│ │
│ 🛡️ HAVEN is keeping you safe │
└─────────────────────────────────┘
The 🆘 Help button is always visible, always one tap away. It calls the designated family member — no confirmation needed.

🚀 Hackathon Build Plan (45 Hours)
What to ship for the demo (the "golden path")
Hour 0–6: Foundation

Supabase project setup: auth, schema, RLS policies
React Native shell + the 4-button home screen
Family dashboard shell (Next.js)
Voice TTS integration (ElevenLabs) — the "Good Morning" brief
Hour 6–15: ANCHOR (most demoable)

Medication setup via photo (GPT-4o Vision)
The Daily Brief (voice + screen card)
Task creation via voice (Whisper → intent → TTS confirmation)
Medication reminder + "I took it" confirmation flow
Hour 15–26: SHIELD (most emotionally powerful)

Scam keyword/pattern classifier (rule-based MVP)
Amber/Red overlay UI
"Safe Conversation Coach" card during a flagged call
Silent family notification (Supabase realtime → dashboard)
Hour 26–34: CIRCLE (the tearjerker)

Family Bridge messaging (elder → family voice note)
The "Thinking of you" button
First Life Story prompt + recording + archive
Hour 34–40: COMPASS (polish)

"What Was That?" document explainer (photo → GPT-4o → plain language summary)
Daily check-in ("How are you feeling?") + family logging
Hour 40–45: Demo prep

End-to-end demo script
Pitch narrative
One real device, one scam simulation, one medication reminder live demo
🎤 The Pitch (3 minutes)
Minute 1 — The Story:
"My grandmother lost €12,000 to a man she thought was her bank. She didn't tell anyone for 3 months because she felt ashamed. She also missed her blood pressure medication 4 times that week because she was too distressed to remember. And when I finally called her, she said — 'I just wish someone had been there with me.'"

Minute 2 — The Demo:
Live scam call simulation → HAVEN flags it → coaching card appears → silent family alert → family dashboard lights up. Then: medication reminder fires → elder says "done" → dashboard shows green.

Minute 3 — The Numbers + Vision:
$7.7 billion stolen from elders in 2025 alone. 1 in 4 over-65s socially isolated. 200,000 preventable deaths from medication non-adherence annually. Three crises. One app. One mission: make aging feel safe.

🌍 What Makes HAVEN Different From Everything Else
Problem Existing "Solution" HAVEN
Scam detection Bank fraud alerts (too late), AARP helpline (reactive) Always-on, real-time, proactive
Medication reminders Clinical apps with tiny text and alarms Warm voice, dignity-preserving, family-connected
Loneliness Generic social media (too complex, wrong crowd) Hyper-local, interest-matched, privacy-first
Family connection WhatsApp (overwhelming), phone calls (forgotten) Structured, frictionless, memory-preserving
Cognitive safety Medical tools (stigmatising) Gentle, embedded in daily life, non-clinical
All of the above 5+ separate apps, none talking to each other One unified platform
💡 The Name
HAVEN — because that's what it is.

Not a product. Not an app. A safe place — for the people who built everything you have, and now deserve someone watching over them.

) can you produce the full schema, the component library spec, the scam detection training dataset structure, and see if there are any glaring or obvious fearures missing and add them and produce the above.... these were identified as additions to above (MISSING FEATURES ANALYSIS & ADDITIONS
Before the schemas, here are the gaps I found in the original spec, with recommended additions:

🔍 Gap Analysis & New Features
🔴 PILLAR 1 — SHIELD (Additions)
1.5 — Wills, Deeds & Document Vault (NEW)
Gap: Elders are frequently manipulated into changing wills, signing deeds, or granting power of attorney under duress. No existing layer addresses this.

Family-designated "sensitive document" list (will, POA, deed, trust)
If elder photographs or scans one of these documents → automatic 24-hour family notification + cooling off prompt: "This looks like an important legal document. Would you like to share it with [Family Member] before signing?"
Secure encrypted vault (AES-256) for storing scanned copies
Optional: solicitor/notary reminder — "Important documents like these are usually reviewed with a lawyer first."
1.6 — Phone Number Reputation & Call Intercept (ENHANCED)
Gap: The spec mentions call analysis but doesn't specify how the call audio/transcript is captured pre-answer.

Integration with Hiya / Truecaller API for real-time number reputation before the phone even rings
Pre-answer screen: "HAVEN doesn't recognise this number. It has been reported 47 times as a scam." — with a "Answer Anyway" and "Ignore" button
Call transcription via Whisper streaming (not batch) during live calls
Post-call summary auto-generated and logged to family dashboard
1.7 — Financial Guardian Mode (NEW)
Gap: The spec mentions detecting payment apps during red alerts but doesn't integrate with actual bank/financial monitoring.

Optional read-only Open Banking API integration (Plaid / TrueLayer)
Anomaly detection on transactions: unusual amounts, new payees, gift card purchases
"HAVEN noticed an unusual payment of £450 to a new payee. Was this you?"
Family alert for transactions above configurable threshold ($200 default)
💊 PILLAR 2 — ANCHOR (Additions)
2.5 — Telehealth Integration (NEW)
Gap: The spec surfaces health data (medication, wellness check-ins) but has no pathway to care.

One-tap access to NHS 111 / Medicare helpline / local GP
HAVEN can read the elder's medication card aloud before a telehealth call begins
Post-appointment reminder: "Your doctor mentioned starting a new medication — want me to add it?"
2.6 — Appointment Transport Coordination (NEW)
Gap: Elders miss medical appointments due to transport issues — a massive adherence driver.

Detect calendar appointments tagged as medical
24-hour-before prompt: "You have Dr. Patel tomorrow at 2pm. Do you need a taxi? Want me to call [Family Member]?"
Deep-link to Uber/Lyft for family members to pre-book on the elder's behalf from the Family Dashboard
Integration with local Dial-a-Ride / community transport APIs (UK: RingGo, US: RideAmigos)
2.7 — Hydration & Nutrition Nudges (NEW)
Gap: Dehydration is the #1 cause of preventable elderly hospitalisations. Zero apps address this passively.

Configurable gentle nudges: "It's been 3 hours, Margaret — have you had some water?"
Linked to wellness check-in data — if "not feeling great" + no hydration log → escalated family note
Simple food log by voice: "I had toast for breakfast" → HAVEN acknowledges, flags to family if multiple days of poor nutrition reported
🤝 PILLAR 3 — CIRCLE (Additions)
3.4 — Grandchildren Bridge (NEW)
Gap: The Family Bridge focuses on adult children but elders' deepest joy is often grandchildren. No competing app touches this.

Grandchildren get a simplified companion app (iOS/Android) — cartoon UI, one button: "Send Grandma a video hello"
Elder receives grandchild videos on the home screen — biggest possible display
Drawings/artwork upload from grandchild app → displayed as elder's "wallpaper" for the day
Voice message threading: elder → grandchild → elder (async, warm, no complexity)
3.5 — Community Event Aggregator (NEW)
Gap: The Neighbourhood Connector mentions library events but has no pipeline for finding them.

Integration with Eventbrite API + local council APIs + Age UK / AARP event feeds
Filters automatically for: free events, accessible venues, within configurable radius, daytime hours
"There's a free watercolour class at the community centre 600m away on Wednesday morning. Interested?"
Family members can also browse and suggest events from the Family Dashboard
🧠 PILLAR 4 — COMPASS (Additions)
4.4 — Grief & Bereavement Support Module (NEW)
Gap: Loss of a spouse is the single biggest predictor of rapid elder decline. Zero apps address this.

If family marks a bereavement event → HAVEN adjusts tone for 30 days
Daily gentle check-in shifts in character: "How are you doing today, Margaret? It's okay if today is hard."
Curated grief resources (Age UK, NHS, AARP) surfaced gently, never pushed
Family notified if wellness check-ins show sustained decline post-bereavement
4.5 — Emergency Medical Profile (EMP) — Digital + Physical (ENHANCED)
Gap: The spec mentions a printable med card but doesn't address the digital emergency handoff.

NFC-enabled emergency card: first responders tap phone to elder's HAVEN home screen → sees full medical profile (no unlock needed)
QR code on printable card → opens read-only emergency view
Integrates with Apple Health / Google Health for hospital systems
Auto-updates whenever medications are changed
4.6 — Night Safety Mode (NEW)
Gap: Falls predominantly happen at night (bathroom trips). No passive night monitoring exists in the spec.

Opt-in: between configurable hours (e.g. 11pm–7am), phone screen brightness auto-reduces
If phone sensor detects sudden movement followed by no movement for 3+ minutes at 3am → gentle ping → no response → family alert
"Night mode is on. Press anywhere if you're okay."
Bedside mode: screen shows large clock + emergency call button only
🆕 PILLAR 5 — VOICE (Entirely New Pillar)
The Companion Voice (NEW — Major Addition)
Gap: The biggest gap in the entire spec. The voice is described as a tool for reminders and alerts, but for isolated elders, voice companionship itself is the product. Amazon Echo's Alexa captured this market by accident. HAVEN should own it deliberately.

Daily conversation mode — not task-driven, just: "Tell me about your day, Margaret."
Powered by a fine-tuned LLM with persistent memory (elder's name, family members, life stories, preferences, health conditions)
HAVEN remembers: "You mentioned last week that your roses were blooming — how are they doing?"
Conversation topics seeded from Life Story Archive, current events (filtered — no distressing news), interests
Crisis detection: if elder says "I don't want to be here anymore" or related phrases → immediate family alert + warm signpost to Samaritans/Crisis Line
The Companion never lies, never manipulates, never up-sells — written into the system prompt and auditable
)









🎨 HAVEN — Complete UI/UX Design Specification
The Design Mandate
"It should feel like a warm hug from someone who knows exactly what you need, before you know you need it."

This is not a medical app. This is not a safety app. This is not a reminder app. This is the most trusted companion an elderly person has ever held in their hand.

Every pixel, every animation, every word, every sound must reinforce one feeling: you are safe, you are loved, and someone is watching over you.

Part 1 — Design Philosophy: The 7 Laws of HAVEN
These are inviolable. Every design decision is measured against them.

Law 1 — "The Grandmother Test"
If your grandmother with arthritis, reading glasses, and zero smartphone experience can complete a task in one attempt without asking for help — it passes. If not — it fails and gets redesigned from scratch.

Law 2 — "The 3am Rule"
Every screen must be completely usable by someone who has just woken from deep sleep, is frightened, and has not yet put on their glasses. This means: maximum contrast, minimum choices, enormous targets, immediate clarity.

Law 3 — "The No-Shame Principle"
Nothing in HAVEN should ever make a user feel:

Confused (that they lack intelligence)
Slow (that they took too long)
Surveilled (that someone is watching judgementally)
Patronised (that they are being treated as less capable)
HAVEN is a peer. A warm, knowledgeable peer. Never a guardian. Never a nanny.

Law 4 — "One Truth Per Screen"
Every screen communicates exactly one primary message. The user should be able to understand what the screen is about within 1 second of it appearing. No exceptions.

Law 5 — "The Voice is the Interface"
The visual screen is confirmation of what HAVEN has already said aloud. A user who is visually impaired, anxious, or confused should be able to navigate the entire app by voice alone.

Law 6 — "Calm is a Feature"
Speed, urgency, and busyness are hostile to elderly users. HAVEN moves with deliberate, unhurried grace. Animations are slow and smooth. Transitions are gentle. Alerts are soft. The only exception: genuine emergencies — which are designed to feel unmistakably serious without causing panic.

Law 7 — "Beauty Earns Trust"
A beautiful interface signals: someone cared about making this for you. Not clinical. Not corporate. Not "designed for old people." Warm, sophisticated, considered — the kind of design that makes someone feel respected.

Part 2 — Visual Identity System
2.1 — The HAVEN Aesthetic
The Reference World: Think warm Scandinavian interiors. Linen textures. Soft morning light through net curtains. A well-made cup of tea. The reading corner of a trusted library. Understated luxury — not a hospital, not a tech startup, not a toy.

The Anti-References (what HAVEN is explicitly NOT):

❌ Bright primary colours like a children's app
❌ Clinical blue/white sterility of medical apps
❌ Dark mode tech-bro aesthetic
❌ Generic flat icons from a free library
❌ Anything that looks like it was designed for someone "old"
2.2 — Colour System
text

HAVEN COLOUR PALETTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY PALETTE — "Morning Light"
──────────────────────────────────────────────────────

  Slate Dusk         #2C3E6B   ← Primary brand. Deep, trustworthy navy-slate.
                                 Not corporate blue. Not cold. Warm undertone.
                                 Use: Primary buttons, key headings, active states.

  Slate Light        #4A6FA5   ← Interactive / hover states
  Slate Pale         #E8EEF7   ← Tinted backgrounds, selected states
  Slate Ghost        #F4F7FC   ← Subtle section backgrounds


WARMTH PALETTE — "Hearth Tones"
──────────────────────────────────────────────────────

  Amber Glow         #E8A030   ← Shield amber alert. Warm, honey amber.
                                 NOT traffic-light yellow. Evokes candlelight.
  Amber Pale         #FDF3E0   ← Amber alert background wash
  Amber Border       #F0C060   ← Amber card borders

  Terracotta         #C96B3A   ← Accent. Grounding, warm, human.
                                 Use: Life story archive, memory features.
  Terracotta Pale    #FAF0E8   ← Memory card backgrounds

  Sage               #4A7B5A   ← Safe/confirmed state. Muted forest green.
                                 NOT traffic-light green. Natural, calming.
  Sage Pale          #EBF4EE   ← Medication taken, safe confirmations
  Sage Border        #7AAF8A   ← Confirmed/taken borders


ALERT PALETTE — "Never Alarming"
──────────────────────────────────────────────────────

  Alert Rose         #C94A4A   ← Shield red. Deep rose-red, not emergency red.
                                 Serious but not panic-inducing.
  Alert Rose Pale    #FAE8E8   ← Red alert background wash
  Emergency Red      #A83232   ← Emergency button only. Deeper, serious.
  Emergency Pale     #FDEAEA   ← Emergency button background


NEUTRAL PALETTE — "Paper and Linen"
──────────────────────────────────────────────────────

  Ink                #1A1F2E   ← Primary text. Near-black with blue undertone.
                                 Softer than pure #000000. Less harsh on eyes.
  Graphite           #3D4558   ← Secondary text
  Pewter             #6B7490   ← Tertiary text, placeholders
  Ash                #9AA0B0   ← Disabled states
  Silver             #C8CEDD   ← Borders, dividers
  Mist               #E8EBF2   ← Input backgrounds, subtle borders
  Linen              #F5F3EE   ← App background. Warm off-white.
                                 NOT pure #FFFFFF. Has warmth.
  White              #FFFFFF   ← Card surfaces, overlaid content


PILLAR ACCENT PALETTE
──────────────────────────────────────────────────────

  Shield Blue        #2C5F8A   ← SHIELD pillar. Protective, serious.
  Anchor Teal        #2A7A6F   ← ANCHOR pillar. Health, grounding.
  Circle Violet      #5E4A8A   ← CIRCLE pillar. Community, connection.
  Compass Gold       #8A6A2A   ← COMPASS pillar. Navigation, wisdom.
  Voice Rose         #8A3A5A   ← VOICE pillar. Warmth, companionship.
  Guardian Steel     #3A4A5A   ← GUARDIAN pillar. Professional, reliable.


HIGH CONTRAST MODE — "Crystal Clear"
──────────────────────────────────────────────────────
  (Activated by one tap on home screen — never hidden)

  HC Background      #0A0A0A
  HC Surface         #1A1A1A
  HC Primary Text    #F8F8F8
  HC Secondary Text  #C8C8C8
  HC Brand           #6A9FE0   ← Brand blue adjusted for dark bg
  HC Amber           #FFD060
  HC Red             #FF7070
  HC Green           #70E070
  HC Border          #3A3A3A
2.3 — Typography System
text

HAVEN TYPE SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPEFACES
──────────────────────────────────────────────────────

  PRIMARY UI FONT:     "Nunito"
  ──────────────────────────────────────────────────
  Why: Rounded terminals. Extremely legible at large sizes.
  Warm and approachable without being childish.
  Excellent at weights 400–800. Perfect for large-print UI.
  Supports full Latin extended for multilingual use.

  STORY / MEMOIR FONT: "Lora"
  ──────────────────────────────────────────────────
  Why: Elegant serif. Used ONLY for life story content,
  memory lane, and keepsake book generation.
  Evokes personal letters and handwritten memory.
  Never used for UI navigation or instructions.

  MONOSPACE (rare):    "JetBrains Mono"
  ──────────────────────────────────────────────────
  Why: Used ONLY for reference numbers, medication codes,
  case numbers. Never for reading text.


TYPE SCALE (base 18px — never below this)
──────────────────────────────────────────────────────

  Display        60px / Nunito 800 / leading 1.1
                 → Elder's name in greeting. Once per session.

  Hero           48px / Nunito 700 / leading 1.15
                 → Screen greetings: "Good Morning"
                 → Emergency states

  Title          40px / Nunito 700 / leading 1.2
                 → Screen headings (1 per screen)

  Heading        34px / Nunito 600 / leading 1.25
                 → Section titles, card headings

  Subheading     28px / Nunito 600 / leading 1.3
                 → Card labels, list headers

  Body Large     26px / Nunito 400 / leading 1.6
                 → Primary reading text. Default for instructions.

  Body           24px / Nunito 400 / leading 1.65
                 → Secondary reading text. MINIMUM for body copy.

  Label          22px / Nunito 600 / leading 1.4
                 → Button labels (always semibold)

  Caption        18px / Nunito 400 / leading 1.5
                 → Supplementary info ONLY. Never primary.
                 → ABSOLUTE MINIMUM. Never below.


LETTER SPACING
──────────────────────────────────────────────────────
  Display / Hero:   -0.5px   (tight — large sizes need this)
  Title / Heading:  0px      (neutral)
  Subheading:       0.2px    (slightly open)
  Body:             0.3px    (open — maximises legibility)
  Label:            0.5px    (buttons — tracking improves readability)
  Caption:          0.4px


FONT SIZE MULTIPLIER
──────────────────────────────────────────────────────
  1.0  Default (above scale)
  1.25 Large (all sizes × 1.25)
  1.5  Very Large (all sizes × 1.5)
  2.0  Maximum (all sizes × 2.0)

  → Multiplier set once during setup, stored in profile
  → Toggle always accessible from home screen (Aa button)
  → Entire app re-renders with new multiplier instantly
  → Never requires app restart
2.4 — Spacing & Grid System
text

SPACING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE UNIT: 8px

  4px    → Micro gaps (icon to label, tight pairs)
  8px    → XS — inline spacing
  12px   → SM — component internal padding
  16px   → MD — standard internal card padding
  20px   → LG — generous component spacing
  24px   → XL — section separation
  32px   → 2XL — major section breaks
  40px   → 3XL — screen-level breathing room
  48px   → 4XL — hero spacing
  64px   → 5XL — full-screen section spacing

SCREEN MARGINS
──────────────────────────────────────────────────────
  Phone:   24px left/right (NOT 16px — more breathing room)
  Tablet:  48px left/right (centred content max 680px wide)

TAP TARGET RULES
──────────────────────────────────────────────────────
  Absolute minimum:    44 × 44px   (WCAG 2.5.5 AA)
  HAVEN minimum:       72 × 72px   (ALL interactive elements)
  Standard buttons:    Full width × 80px height
  Hero buttons:        Full width × 96px height  
  Emergency button:    Full width × 108px height
  Home screen tiles:   (Screen width ÷ 2 - 32px) × 160px

  ╔══════════════════════════════════╗
  ║  KEY RULE: If a finger with      ║
  ║  mild arthritis cannot hit it    ║
  ║  reliably first try — it fails.  ║
  ╚══════════════════════════════════╝

BORDER RADIUS
──────────────────────────────────────────────────────
  Cards:         20px   ← Generous, friendly, not sharp
  Buttons:       16px   ← Consistent with cards
  Input fields:  14px
  Chips/tags:    999px  ← Fully rounded
  Avatar:        999px  ← Fully rounded
  Alert overlays: 28px  ← Softer, less alarming

  ╔══════════════════════════════════╗
  ║  Sharp corners = clinical/harsh  ║
  ║  Over-rounded = childish         ║
  ║  20px = warm, trusted, premium   ║
  ╚══════════════════════════════════╝
2.5 — Elevation & Shadow System
text

SHADOW SYSTEM — "Light from above, always warm"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shadow colour is NEVER pure black (#000000).
Use Slate Dusk (#2C3E6B) at low opacity for warm shadows.

  Level 0 (flat):
    No shadow. Background sections, subtle containers.

  Level 1 (lifted):
    shadowColor: #2C3E6B
    shadowOffset: { width: 0, height: 2 }
    shadowOpacity: 0.06
    shadowRadius: 8
    elevation: 2
    → Default cards, list items

  Level 2 (floating):
    shadowColor: #2C3E6B
    shadowOffset: { width: 0, height: 4 }
    shadowOpacity: 0.09
    shadowRadius: 16
    elevation: 4
    → Medication cards, today cards, active selections

  Level 3 (prominent):
    shadowColor: #2C3E6B
    shadowOffset: { width: 0, height: 8 }
    shadowOpacity: 0.12
    shadowRadius: 24
    elevation: 8
    → Home screen tiles, important modals

  Level 4 (hero):
    shadowColor: #2C3E6B
    shadowOffset: { width: 0, height: 12 }
    shadowOpacity: 0.16
    shadowRadius: 32
    elevation: 12
    → Emergency button, voice button when active

ALERT GLOW SHADOWS (unique to HAVEN)
──────────────────────────────────────────────────────
  Amber Glow:
    shadowColor: #E8A030
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0.35
    shadowRadius: 20
    → Shield amber alerts

  Rose Glow:
    shadowColor: #C94A4A
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0.35
    shadowRadius: 20
    → Shield red alerts

  Sage Glow:
    shadowColor: #4A7B5A
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0.30
    shadowRadius: 16
    → Medication confirmed, safe states

  Voice Pulse:
    shadowColor: #5E4A8A
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0.50
    shadowRadius: 28
    → Voice button when actively listening
2.6 — Iconography System
text

ICON PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT use generic icon libraries (Feather, Heroicons, Material).
They look generic. They look like every other app.

HAVEN uses a custom icon set with these characteristics:
  ● 2.5px stroke weight (heavier than standard — legible at large sizes)
  ● Rounded line caps and joins (consistent with Nunito's warmth)
  ● Slightly larger hit area (drawn to 28px in a 32px frame)
  ● Filled variants for active/selected states
  ● Outline variants for inactive states

ICON SIZE RULES
──────────────────────────────────────────────────────
  Navigation icons:    32px icon in 48px frame
  Button icons:        28px icon in 40px frame
  Card icons:          40px icon in 56px frame
  Hero icons:          56px icon in 72px frame
  Home screen tiles:   64px icon in 80px frame

ICONS ARE NEVER ALONE
──────────────────────────────────────────────────────
  Every icon must have a visible text label.
  Always. Without exception.
  Label minimum: 20px, Nunito 500

  ✅ 💊 My Pills
  ✅ 📅 Today
  ❌ 💊 (no label — fails)

CUSTOM ICON DESCRIPTIONS
──────────────────────────────────────────────────────
  Pill Cup       → stylised medicine cup (not a generic pill)
  Calendar Leaf  → calendar with a small leaf detail (warmth)
  Family Circle  → three people in a warm embrace arc
  Shield Leaf    → shield with subtle leaf motif (protection + nature)
  Voice Wave     → sound wave that curves like a human voice (not a mic)
  Memory Book    → open book with a soft heart on page
  Compass Rose   → elegant compass, simplified
  Star Path      → navigation star (used for COMPASS pillar)
  Document Fold  → paper with gentle fold (warm, not clinical)
  Heart Pulse    → pulse line ending in a small heart
Part 3 — Motion & Animation Design
text

MOTION PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HAVEN never startles. Every animation is:
  ● Intentional — it communicates something
  ● Gentle — never fast, never jarring
  ● Meaningful — motion tells a story, not just decoration
  ● Interruptible — user can always abort mid-animation

TIMING REFERENCE
──────────────────────────────────────────────────────
  Instant:       0–100ms   → Immediate feedback (tap state)
  Snap:          150ms     → State changes (toggle on/off)
  Transition:    300ms     → Screen transitions, card expand
  Reveal:        450ms     → New content appearing
  Gentle:        600ms     → Modal entry, alert overlay
  Breath:        800ms     → Hero animations, background pulses
  Story:         1200ms    → Deliberate, meaningful transitions

EASING CURVES
──────────────────────────────────────────────────────
  Enter:         cubic-bezier(0.0, 0.0, 0.2, 1.0)
                 → Content entering: starts fast, settles gently
  Exit:          cubic-bezier(0.4, 0.0, 1.0, 1.0)
                 → Content leaving: gentle start, clean exit
  Emphasise:     cubic-bezier(0.0, 0.0, 0.0, 1.0)
                 → Alert states: soft start, decisive landing
  Spring:        { damping: 18, stiffness: 180 }
                 → Touch feedback, confirmations


SPECIFIC ANIMATIONS
──────────────────────────────────────────────────────

  1. APP LAUNCH — "The Morning Light"
  ─────────────────────────────────
  Duration: 1800ms total
  
  Frame 0–400ms:
    Background fades from #F5F3EE (linen) to background
    HAVEN logo appears: scale 0.8 → 1.0, opacity 0 → 1
    Easing: spring (damping 15, stiffness 120)
  
  Frame 400–800ms:
    Logo settles. Brief hold.
  
  Frame 800–1200ms:
    Greeting text slides up: translateY(20) → translateY(0)
    Opacity 0 → 1
    Easing: Enter curve
  
  Frame 1200–1800ms:
    Home screen tiles cascade in with stagger:
    Tile 1: delay 0ms
    Tile 2: delay 80ms
    Tile 3: delay 160ms
    Tile 4: delay 240ms
    Each: scale(0.95) → scale(1.0), opacity 0 → 1
  
  Total feel: Waking up gently, not booting up.


  2. SCREEN TRANSITIONS — "Warm Slide"
  ─────────────────────────────────────
  Forward navigation:
    Current screen: translateX(0) → translateX(-30px), opacity 1 → 0
    New screen: translateX(30px) → translateX(0), opacity 0 → 1
    Duration: 350ms, Enter/Exit curves
    NOTE: Only 30px (not 100% width) — never disorientating
  
  Back navigation:
    Reverse of above. Feels like retreating, not going somewhere.
  
  Modal / bottom sheet:
    translateY(100%) → translateY(0)
    Duration: 450ms, Enter curve
    Background overlay: opacity 0 → 0.5, rgba(26,31,46,0.5)
    Background is NEVER fully black — 50% opacity max


  3. HOME SCREEN TILES — "Living Tiles"
  ─────────────────────────────────────
  Resting state:
    Tiles breathe with a very subtle shadow pulse:
    Level 3 shadow → Level 2 shadow → Level 3 shadow
    Duration: 4000ms loop, sine easing. Nearly imperceptible.
    Purpose: Makes the screen feel alive, not static.
  
  Press state (immediate):
    scale(1.0) → scale(0.97)
    Duration: 100ms
    Shadow: Level 3 → Level 1
    Haptic: impactLight
  
  Release state:
    scale(0.97) → scale(1.02) → scale(1.0)
    Duration: 200ms (spring, damping:12, stiffness:200)
    Haptic: impactMedium
    Feel: The tile "bounces" reassuringly when tapped


  4. MEDICATION TAKEN — "The Satisfying Completion"
  ──────────────────────────────────────────────────
  This is the most-used daily interaction. It must feel deeply satisfying.
  
  User taps "I took it":
  
  Frame 0–100ms:
    Button scales down: scale(1.0) → scale(0.95)
    Haptic: impactMedium
  
  Frame 100–300ms:
    Button scales up with spring: scale(0.95) → scale(1.05) → scale(1.0)
    Button colour transitions: Slate → Sage (green)
    Checkmark icon draws from center outward (path animation, 200ms)
    Text changes: "I took it" → "✓ Done!"
    Haptic: notificationSuccess
  
  Frame 300–700ms:
    Sage glow shadow pulses outward once (radius 16 → 32 → 0)
    Small particle burst: 8 soft green dots scatter outward
    (Not confetti — subtle, dignified. Just small circles.)
  
  Frame 700–1200ms:
    Card gently slides upward and fades out
    (Separates completed from pending items visually)
  
  Voice confirmation fires simultaneously:
    HAVEN says: "Perfect. Done."  (2 words. Warm tone. Short.)


  5. SHIELD AMBER ALERT — "Gentle Attention"
  ──────────────────────────────────────────
  This must get attention WITHOUT causing panic.
  
  Entry (600ms):
    A warm amber glow appears at screen edges (not center):
    Screen border: 0px → 8px amber glow (inset box shadow)
    Opacity: 0 → 1, 600ms, Emphasise curve
  
  Simultaneously:
    Small amber banner slides down from top (not full screen)
    Height: 80px. Text: "HAVEN noticed something — tap to see"
    Slide: translateY(-80px) → translateY(0), 450ms
  
  Continuing state:
    Border glow pulses slowly: opacity 0.6 → 1.0 → 0.6
    Period: 3000ms. Never frantic.
  
  Voice fires:
    "Something looks a little unusual. Want me to check it for you?"
    Tone: Concerned friend. Not alarm system.


  6. SHIELD RED ALERT — "Serious Calm"
  ─────────────────────────────────────
  Serious. Unmistakable. But never panic-inducing.
  
  Entry (800ms):
    Overlay appears from BOTTOM (not center drop — less alarming)
    translateY(100%) → translateY(0), 600ms, Emphasise curve
    Covers bottom 75% of screen
    Background: Alert Rose Pale (#FAE8E8) with rose border
    Background blur on content beneath: blur(4px)
  
  Header:
    HAVEN shield icon (40px) in Alert Rose
    Fades in + scales: scale(0.8) → scale(1.0), 300ms, delay 400ms
  
  Text fades in by line:
    Line 1 (delay 600ms): "HAVEN thinks this might be a scam."
    Line 2 (delay 800ms): "Here's why:"
    Red flags (delay 1000ms, stagger 100ms each)
  
  Pulse glow:
    Screen edge glow: Alert Rose, opacity 0.4, static (not pulsing)
    One pulse on entry only, then static — pulsing during read is distracting
  
  Voice fires (after 500ms delay — letting visual land first):
    "HAVEN thinks this might be a scam. I've noted why below.
     You don't have to do anything right now."


  7. VOICE BUTTON — "Breathing Life"
  ────────────────────────────────────
  Idle state:
    Slate Dusk circle, Voice Pulse shadow at low opacity
    Very slight pulse: scale(1.0) → scale(1.02) → scale(1.0)
    Period: 3500ms. The button "breathes."
  
  Activated (tap):
    Haptic: impactMedium
    scale(1.0) → scale(0.92) → scale(1.08) → scale(1.0), 300ms spring
    Colour: Slate → Circle Violet
    Shadow: Voice Pulse glow appears, full opacity
  
  Listening state:
    Outer ring 1: scale(1.0) → scale(1.3), opacity(0.4) → opacity(0)
    Outer ring 2: same, delay 400ms
    Outer ring 3: same, delay 800ms
    Loop continuously. The classic "listening pulse" but softer.
    Centre icon: mic → animated sound wave (reacts to audio level)
  
  Processing state:
    Three dots appear in sequence: · → ·· → ···
    Rotation: 0° → 360°, 1200ms, linear, loop
    HAVEN says: "Mmm..." (thinking sound — like a human)
  
  Response ready:
    All rings collapse inward to centre
    Scale: 1.0 → 0.9 → 1.0, 200ms spring
    Colour returns to Slate Dusk
    Voice response begins playing


  8. DAILY BRIEF CARD — "Morning Reveal"
  ────────────────────────────────────────
  When the Daily Brief screen opens:
  
  Background first: gradient washes in (300ms)
  Greeting appears: opacity 0 → 1, translateY(10) → 0 (400ms)
  Time: same, delay 150ms
  Weather: same, delay 200ms
  
  Medication rows cascade in with stagger:
    Row 1: delay 300ms
    Row 2: delay 380ms
    Row 3: delay 460ms
    Each: translateX(-20px) → translateX(0), opacity 0 → 1, 350ms
  
  Voice button: scale 0 → 1, spring, delay 600ms
  "Hear your brief" button: same, delay 700ms
  
  Feel: The day arriving, piece by piece. Not dumped all at once.


  9. LIFE STORY RECORDING — "Sacred Space"
  ──────────────────────────────────────────
  This deserves the most considered animation in the app.
  It is capturing something irreplaceable.
  
  Screen entry:
    Background: warm ivory (#FAF6EF), not white
    Prompt text fades in with Lora serif: opacity 0 → 1, 800ms
    Breathing pause: 500ms
    Mic button fades in: opacity 0 → 1, 600ms, scale 0.9 → 1.0
  
  Recording active:
    Background warms subtly: #FAF6EF → #FDF2E4, 800ms (barely perceptible)
    Mic button: Alert Rose filled circle, soft glow
    Waveform visualiser: lines grow from centre, react to voice amplitude
    Each bar: rounded cap, 3px wide, spacing 4px, Terracotta colour
    Waveform feels like a heartbeat — organic, not mechanical
  
  Recording complete:
    Mic button transforms: mic icon → small heart icon
    Scale: 1.0 → 0.8 → 1.0, spring, 400ms
    Colour: Alert Rose → Terracotta → Sage
    HAVEN says warmly: "Beautiful. I've saved that for your family."
    A small golden star particle appears and floats upward (subtle, 600ms)
Part 4 — Haptic Language
text

HAPTIC FEEDBACK SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HAVEN uses haptics as a second language — communicating
meaning through touch that reinforces visual and audio.

  Pattern                    Haptic                    Meaning
  ─────────────────────────────────────────────────────────────
  Any tap (immediate)        impactLight               "I registered that"
  Button press confirm       impactMedium              "This is happening"
  Successful action          notificationSuccess       "Done. Well done."
  Gentle alert (amber)       impactLight × 1           "Notice this"
  Serious alert (red)        impactHeavy × 1           "Pay attention"
  Emergency                  impactHeavy × 3           "This is important"
  Shield intercept           impactMedium + 200ms      "I caught something"
                             + impactLight
  Medication taken           notificationSuccess       "Excellent."
  Task completed             impactMedium + 150ms      "Good."
                             + impactLight (soft echo)
  Voice button activate      impactMedium              "I'm listening"
  Voice processing           impactLight × 1           "I heard you"
  Story recorded             notificationSuccess       "Treasured."
  Error / can't do this      notificationWarning       "Not quite right"

HAPTIC PRINCIPLES
──────────────────────────────────────────────────────
  ● Never use haptics for purely decorative animation
  ● Every haptic pattern means exactly ONE thing
  ● Haptics are optional — off by default for some users
  ● Never rapid-fire haptics — minimum 150ms between patterns
Part 5 — Sound Design
text

HAVEN SOUND SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHILOSOPHY: HAVEN does not beep, buzz, or alarm.
HAVEN sounds like a warm, attentive human presence.

AMBIENT AUDIO IDENTITY
──────────────────────────────────────────────────────

  The HAVEN Sound Mark (500ms):
    A single, soft, rising note
    Instrument: Muted piano, lightly reverbed
    Pitch: C4 → E4 (perfect third, rising)
    Character: Like someone gently saying "Hello"
    Used: App launch, positive confirmations

  Notification Tone (600ms):
    Two soft chimes: C5, G5
    Instrument: Vibraphone-like, soft mallet
    Character: Gentle door knock
    Used: New messages, gentle reminders

  Alert Tone — Amber (800ms):
    Three notes: A4, B4, A4 (unresolved — creates gentle attention)
    Instrument: Warm marimba
    Character: Someone clearing their throat softly
    Used: Amber scam alerts

  Alert Tone — Red (never jarring):
    Four notes: G4, G4, C5, G4 (repeating G, like a watch chime)
    Instrument: Soft orchestra bell
    Played ONCE only — not repeating
    Character: A hand on the shoulder
    Used: Red scam alerts only

  Completion Sound (400ms):
    Single note: D5, fading gently
    Instrument: Soft piano with subtle string overtone
    Character: A contented exhale
    Used: Medication taken, task completed, story saved

  Emergency Sound (do not underestimate this):
    Must be unmistakable but not panic-inducing
    Three descending notes: E5, C5, G4 (quarter note each)
    Instrument: Clear piano, no reverb, sustained
    Followed by: "I'm calling [Name] for you now"
    Character: Serious. Decisive. Calm.


VOICE DESIGN — "HAVEN'S VOICE"
──────────────────────────────────────────────────────

  HAVEN has ONE voice. It is not a robot.
  It is not a generic TTS voice.
  It sounds like:
    → A trusted GP who also happens to be a friend
    → Warm, unhurried, slightly lower register
    → Mid-Atlantic accent or user's locale equivalent
    → Never clipped. Always speaks in complete thoughts.
    → Pauses naturally — 400ms between sentences

  ElevenLabs Voice Configuration:
    Model: eleven_multilingual_v2
    Stability: 0.72 (consistent but not robotic)
    Similarity Boost: 0.80
    Style: 0.15 (subtle expressiveness)
    Speaking Rate: 0.88 (slightly slower than default)
    Pitch: Neutral (0)

  Voice Vocabulary Rules:
    ✅ "Good morning, Margaret" — always uses name
    ✅ "I noticed..." — ownership, active involvement
    ✅ "It looks like..." — tentative, not accusatory
    ✅ "That's done. Well done." — affirming, not patronising
    ✅ "You don't need to do anything right now"
    ✅ "Shall I read that for you?"
    ✅ "I'll remember that for you."
    ✅ "Your [family member] is thinking of you."

    ❌ "Error" / "Invalid" / "Failed"
    ❌ "Warning!" / "Alert!" / "Danger!"
    ❌ "You forgot to..." — never accusatory
    ❌ "Don't worry" — dismissive
    ❌ "As an AI..." — breaks the companion illusion
    ❌ "I cannot..." — always offer an alternative
    ❌ Technical jargon of any kind

  Sentence Length:
    Instructions: max 12 words per sentence
    Reminders: max 8 words
    Confirmations: max 5 words ("Done." "All set." "Saved for them.")
    Alerts: max 15 words, then pause
Part 6 — Screen-by-Screen Specification
6.1 — Onboarding Flow
text

ONBOARDING PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Onboarding is done BY THE FAMILY MEMBER, not the elder.
The elder should receive a fully configured app on first open.
The elder's first experience is:
  "Good morning, [Name]. HAVEN is ready for you."
  — no setup, no configuration, no questions.


FAMILY ONBOARDING — 6 Steps (web + mobile)
──────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────┐
  │  STEP 1 — "Tell us about your loved one"       │
  │                                                 │
  │  ☀️ What's their name?                          │
  │  [First name only — large input, 40px]          │
  │                                                 │
  │  And what do they prefer to be called?          │
  │  [Preferred name — "Mum", "Margaret", "Gran"]   │
  │                                                 │
  │  Progress: ● ○ ○ ○ ○ ○                         │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  STEP 2 — "Help HAVEN recognise their voice"   │
  │                                                 │
  │  Ask [Name] to say these 3 phrases:            │
  │  "Good morning, HAVEN"                          │
  │  "I took my pill"                               │
  │  "Call my daughter"                             │
  │                                                 │
  │  [Large MIC button — tap to record each]        │
  │  [Skip this step →] (can set up later)          │
  │                                                 │
  │  Progress: ● ● ○ ○ ○ ○                         │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  STEP 3 — "Tell us about their medications"    │
  │                                                 │
  │  Take a photo of each pill bottle.             │
  │  HAVEN will read it and set up reminders.      │
  │                                                 │
  │  [Big camera icon — tap to photograph]          │
  │  [I'll add medications later →]                 │
  │                                                 │
  │  Progress: ● ● ● ○ ○ ○                         │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  STEP 4 — "Who else should HAVEN keep in touch │
  │            with?"                               │
  │                                                 │
  │  [You] ✅ (already set as primary)              │
  │  + Add family member (name + phone)             │
  │  + Add family member                            │
  │                                                 │
  │  [Continue with just me →]                      │
  │                                                 │
  │  Progress: ● ● ● ● ○ ○                         │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  STEP 5 — "What font size works best?"         │
  │                                                 │
  │  [Preview text shown live as slider moves]      │
  │                                                 │
  │  Good morning, Margaret ☀️                      │
  │  ←————————●————————————→                       │
  │  Small              Large                       │
  │                                                 │
  │  [This looks perfect →]                         │
  │                                                 │
  │  Progress: ● ● ● ● ● ○                         │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  STEP 6 — "HAVEN is ready for Margaret"        │
  │                                                 │
  │  🛡️ SHIELD is on                               │
  │  💊 3 medications set up                        │
  │  👪 2 family members connected                  │
  │                                                 │
  │  Here's what Margaret will see when she         │
  │  opens HAVEN for the first time:               │
  │                                                 │
  │  [Preview of elder home screen]                 │
  │                                                 │
  │  [Open HAVEN together →] ← this is the CTA     │
  │                                                 │
  │  Progress: ● ● ● ● ● ●                         │
  └─────────────────────────────────────────────────┘
6.2 — The Home Screen
text

THE HOME SCREEN — FULL SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYOUT (phone — portrait):
──────────────────────────────────────────────────────

┌────────────────────────────────────────────┐
│  Status bar (system)                       │
├────────────────────────────────────────────┤
│                    40px top padding        │
│  Good Morning ☀️           [Aa] [◐]        │  ← 48px hero text
│  Margaret                                  │  ← 60px display text (name)
│                                            │
│  Tuesday, 10 June                          │  ← 26px, Pewter colour
│  🌤️  18° and sunny                        │  ← 24px, Pewter
│                    24px gap                │
├────────────────────────────────────────────┤
│  🛡️ HAVEN is keeping you safe  ●green     │  ← Status bar, 20px, full width
│     [tap to learn more]                    │    bg: Sage Pale, 56px height
├────────────────────────────────────────────┤
│                    20px gap                │
│  ┌──────────────┐    ┌──────────────┐     │
│  │              │    │              │     │
│  │  💊 (64px)   │    │  📅 (64px)   │     │
│  │              │    │              │     │  ← Each tile: (width÷2 - 36px) wide
│  │  My Pills    │    │    Today     │     │    160px tall
│  │              │    │              │     │    bg: White, Level 3 shadow
│  │  3 due today │    │  2 items     │     │  ← 20px subtext (Badge/count)
│  └──────────────┘    └──────────────┘     │
│                    16px gap                │
│  ┌──────────────┐    ┌──────────────┐     │
│  │              │    │              │     │
│  │  👪 (64px)   │    │  🆘 (64px)   │     │
│  │              │    │              │     │
│  │   Family     │    │     Help     │     │
│  │              │    │              │     │
│  │  1 message   │    │  Call Sarah  │     │
│  └──────────────┘    └──────────────┘     │
│                    24px gap                │
└────────────────────────────────────────────┘

TILE VISUAL SPECIFICATION
──────────────────────────────────────────────────────

  Default tile:
    Background: #FFFFFF
    Border: none
    Border radius: 20px
    Shadow: Level 3
    Icon: custom HAVEN icon, 64px, Pillar accent colour
    Label: 28px Nunito 600, Ink (#1A1F2E)
    Sublabel: 20px Nunito 400, Pewter (optional count/status)

  Attention tile (medication due now):
    Background: Linear gradient (Sage Pale to White, 135°)
    Left border accent: 4px solid Sage
    Icon: animated subtle pulse
    Sublabel colour: Sage

  Urgent tile (message unread / alert):
    Top-right badge: 24px circle, Slate Dusk fill, white number
    Badge appears with scale(0) → scale(1) spring animation

  Help tile (always distinct):
    Background: Linear gradient (Alert Rose Pale to White, 135°)
    Left border accent: 4px solid Emergency Red
    Icon: Emergency Red (not Pillar colour)
    Label: "Help" in Emergency Red
    Sublabel: "Call [Primary Contact Name]"
    This tile always looks slightly different — it is never forgotten


STATUS BAR (between greeting and tiles)
──────────────────────────────────────────────────────

  Safe state:
    Background: Sage Pale (#EBF4EE)
    Left icon: Shield (24px, Sage)
    Text: "HAVEN is keeping you safe" (22px, Sage)
    Right: Green dot (12px, Sage fill, soft glow pulse)

  Amber state:
    Background: Amber Pale (#FDF3E0)
    Left icon: Shield (24px, Amber Glow)
    Text: "HAVEN noticed something — tap to see" (22px, Amber)
    Right: Amber dot, faster pulse (2s period)
    Full bar tappable → Shield alert screen

  Red state:
    Background: Alert Rose Pale (#FAE8E8)
    Left icon: Shield (24px, Alert Rose)
    Text: "HAVEN thinks something needs attention" (22px, Alert Rose)
    Right: Rose dot, pulsing
    Full bar tappable → Shield alert screen
    Status bar also: subtle left/right animated gradient 
