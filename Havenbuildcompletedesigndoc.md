HAVEN — Engineering Design Document Suite
Version: 1.0.0 Status: Approved — Single Source of Truth Locale: Netherlands (nl-NL) | Jurisdiction: EU / Dutch Law Last Updated: 2026-06-10 Replaces: README.md, HAVEN_BLUEPRINT.md, UIUXRENDER

Document 01 — Product Specification
1. Mission
HAVEN is a voice-first elder-care companion platform built for older adults living in the Netherlands. It exists to protect dignity, reduce isolation, prevent fraud, and support daily independence — without surveillance, without panic, and without complexity.

HAVEN is not a tracking app. It is not a panic button. It is not a replacement for human care. It is a calm, trusted presence in an elder's daily life — and a reassuring, transparent window for the family members and professionals who care for them.

2. The Problem
Dutch older adults — particularly those aged 70 and above — face four compounding challenges:

Challenge	Dutch Context
Financial fraud & scams	The Fraudehelpdesk reported over 580,000 fraud reports in 2024. Elders are the primary target of "bankhelpdeskfraude", phishing, and "vriend-in-nood" (friend-in-need) scams.
Loneliness & isolation	CBS (Centraal Bureau voor de Statistiek) reports 1 in 3 Dutch adults over 75 experiences severe loneliness.
Medication non-adherence	Approximately 50% of Dutch older adults with chronic conditions take medications incorrectly, per RIVM data.
Cognitive safety	Over 290,000 people in the Netherlands live with dementia (Alzheimer Nederland, 2025). Safe navigation and orientation support is an unmet gap in consumer tech.
3. Target Users
3.1 Primary User — The Elder
Age: 68–90
Lives independently or in a lightly assisted setting (thuiszorg)
Dutch mother tongue (nl-NL)
Low to medium digital literacy
May have reduced hearing, vision, or motor dexterity
Uses HAVEN as their primary digital companion
3.2 Secondary User — The Family Member / Mantelzorger
Age: 35–60
Grown child or partner of the elder
Dutch or English-speaking
Uses the family dashboard on mobile and desktop
Legally a "mantelzorger" (informal carer) in the Dutch care context
3.3 Tertiary User — The Professional Carer / Zorgverlener
Home care worker (thuiszorgmedewerker) or district nurse (wijkverpleegkundige)
Works within a licensed zorginstelling
Uses the Guardian portal (role-scoped)
Operates under BIG-register obligations and WGBO
4. The Six Pillars
Pillar 1 — SCHILD (Fraud & Scam Protection)
Dutch elders are specifically targeted by "bankhelpdeskfraude" (fake bank helpdesk calls), "vriend-in-nood" (friend-in-need WhatsApp scams), and fake overheid (government) portals.

Features:

Real-time call reputation analysis
Multi-layer scam scoring pipeline (per-call, per-message, per-link)
Conversation coaching during a flagged live call ("stay on the line, this may be a scam")
Vault for sensitive documents (DigiD, BSN card, insurance cards, passports)
Transaction intercept for flagged anomalies (via PSD2 Open Banking APIs)
Alert levels: Amber (worth knowing) → Rood (take action) → Zwart (transaction blocked)
Social engineering memory: tracks escalating "grooming" patterns across time
Weekly "Veiligheidsoverzicht" (safety digest) for family
Pillar 2 — ANKER (Health, Meds, Daily Rhythm)
Medication setup via photo/OCR of Dutch "bijsluiter" (medication leaflet) and geneesmiddelen labels
Warm voice reminders with escalation after misses
Daily rhythm board ("Vandaag")
Voice task manager
Wellness check-ins
G-standaard / Z-index integration for Dutch medication name resolution
MedMij/PGO integration for Dutch personal health record access
Huisarts (GP) appointment reminders
Pillar 3 — KRING (Connection & Community)
Family messaging: text, voice notes, photos, video hellos
Life story archive ("Mijn Verhaal") with Whisper transcription
Memory lane: anniversary and memorial surfacing
Dutch community event aggregation (via gemeentelijke APIs and Ouderenfonds feeds)
Intergenerational skill exchange
Connection to Dutch elder networks (ANBO, KBO-PCOB)
Pillar 4 — KOMPAS (Cognitive Safety & Orientation)
Daily cognitive check-ins (orientation questions)
Safe zone / "Veilige Zone" — PostGIS-backed with fuzzy location privacy
"Wat is dit?" — photo explainer (camera → AI → plain Dutch description)
Rouw- en verliesondersteuning (grief/bereavement mode)
Emergency medical profile (for huisarts and ambulance)
Nachtmodus (night safety mode)
Wandering detection via optional integration with GPS wearables
Pillar 5 — STEM (The Voice Companion)
Persistent-memory Dutch-language companion
Offline fallback for core interactions
Crisis phrase detection ("ik voel me niet goed", "ik ben bang")
Warm, calm Dutch voice persona (ElevenLabs, nl-NL voice)
Pillar 6 — WACHT (Professional Care Portal)
Role-scoped portal for thuiszorg and wijkverpleging
Visit logs and care plan hub
Safeguarding incident reporting (meldcode Huiselijk Geweld)
Integration with Careweb / ONS / Nedap care systems (Phase 2)
5. MVP Definition
The MVP is the smallest safe, loveable product that can be delivered to a closed beta of 50 Dutch elder households within 6 months.

In MVP Scope
Pillar	MVP Features
SCHILD	Call reputation display, scam flag + amber alert to family, document vault
ANKER	Medication reminders (voice + push), daily rhythm board, wellness check-in
KRING	Family voice notes, family photo sharing, life story recording
KOMPAS	Safe zone alerts, emergency medical profile
STEM	nl-NL voice companion (online), crisis phrase detection
WACHT	Read-only family dashboard; carer portal: Phase 2
Explicitly Out of MVP Scope
Transaction intercept / banking integration (PSD2)
MedMij / PGO health record integration
Cognitive driving event detection
Community event aggregation
Skill exchange / neighbourhood connections
Guardian / carer portal (WACHT)
Legacy account / digital estate module
Offline companion voice (Phase 2)
G-standaard medication database integration
6. Phased Roadmap
Phase 0 — Foundation (Months 1–2)
Supabase project setup (EU region)
Auth flows (elder + family + carer roles)
Core DB schema + RLS policies
Elder app skeleton (React Native + Expo)
Screen renderer + schema test suite (CI)
Family dashboard skeleton (Next.js)
Phase 1 — MVP (Months 3–5)
ANKER: medication reminders
SCHILD: call screening + document vault
KRING: family messaging + voice notes
STEM: nl-NL voice companion (online)
KOMPAS: safe zone + emergency profile
Beta launch: 50 households
Phase 2 — Depth (Months 6–9)
SCHILD: transaction intercept (PSD2)
KOMPAS: cognitive check-ins + "Wat is dit?"
STEM: offline fallback
ANKER: MedMij integration
WACHT: carer portal
Push to App Store (iOS) + Google Play
Phase 3 — Scale (Months 10–14)
Community event feeds
G-standaard medication DB
Nedap/Careweb integration
ANBO / KBO-PCOB partnership portal
Multi-language support (Turkish, Arabic — NL migrant elder communities)
7. Success Metrics
Metric	Target (12 months post-launch)
Daily active elder users	≥ 65% of registered elders
Medication adherence improvement	≥ 20% vs. baseline (self-reported + reminder data)
Scam events flagged per month	Tracked; elder feedback on relevance ≥ 80% accurate
Family dashboard MAU	≥ 80% of registered family members
Voice interaction completion rate	≥ 85% (intent resolved without fallback)
Crisis phrase detection response time	< 30 seconds to family notification
App Store rating	≥ 4.6 stars
CSAT (elder)	≥ 90% "feels safe and easy"
Document 02 — Architecture Decision Records (ADRs)
Each ADR follows the format: Context → Decision → Rationale → Consequences → Alternatives Rejected

ADR-001 — Primary Backend: Supabase (PostgreSQL)
Context: We need a backend that provides auth, database, storage, real-time, and edge compute with minimal operational overhead for a small team.

Decision: Supabase hosted on AWS eu-central-1 (Frankfurt) as the primary backend.

Rationale:

EU region hosting satisfies AVG/GDPR data residency requirements
PostgreSQL is the most mature open-source relational DB; we need ACID transactions for health and financial data
Supabase provides Row-Level Security natively, which is architecturally central to HAVEN's consent model
pgvector and PostGIS are first-class Postgres extensions — no additional vector or geo database needed at MVP scale
Supabase Auth provides JWT-based auth with RLS integration out of the box
Edge Functions (Deno) run in the same region as the DB, minimising latency for sensitive operations
Consequences:

We are partially vendor-locked to Supabase's hosting; mitigation is that the underlying stack is standard PostgreSQL + open-source
At very high scale (>500k active users) we will need to evaluate dedicated Postgres hosting
Alternatives Rejected:

Firebase: No native SQL, no RLS, US-centric data residency by default, no pgvector
AWS Amplify: High operational complexity, harder RLS model, more infrastructure overhead
Custom Node.js + RDS: Too much boilerplate for a small team at this stage
ADR-002 — Elder Mobile App: React Native + Expo
Context: We need a cross-platform mobile app for iOS and Android targeting Dutch elders (predominantly iOS via families gifting iPads, but Android significant in lower-income demographics).

Decision: React Native with Expo (Managed Workflow → Bare when needed).

Rationale:

Single codebase for iOS and Android
Expo's accessibility APIs are mature
EAS Build integrates with CI/CD
Large ecosystem for the integrations we need (HealthKit, Notifications, Camera/OCR)
Schema-driven UI renderer is framework-agnostic in principle but React Native's component model fits the declarative schema pattern well
Consequences:

Some native modules require ejecting to bare workflow (e.g., advanced Bluetooth for wearables in Phase 2)
React Native bridge overhead exists but is acceptable for our use case (not a high-frame-rate game)
Alternatives Rejected:

Flutter: Smaller ecosystem for our specific integrations; team expertise is React-based
Native iOS/Android: 2x development cost; unjustifiable for MVP
PWA: Insufficient access to native APIs (microphone, HealthKit, haptics, background tasks)
ADR-003 — Family Dashboard: Next.js 14 (App Router)
Context: Family members and carers need a web dashboard that works on desktop and mobile browsers.

Decision: Next.js 14 with App Router, hosted on Vercel (EU region).

Rationale:

App Router enables Server Components — sensitive data is never sent to client unnecessarily
Vercel EU region (Frankfurt) for data residency
Supabase Auth works seamlessly with Next.js middleware for SSR auth
Real-time dashboard updates via Supabase Realtime subscriptions on the client
Alternatives Rejected:

SvelteKit: Less team familiarity; smaller ecosystem for our UI component needs
Remix: Good option but App Router now has equivalent capabilities
Standalone React SPA: Loses SSR benefits; SEO not relevant here but SSR auth security model is important
ADR-004 — Voice STT: OpenAI Whisper (API)
Context: Speech-to-text for Dutch elder voices, which may include accents, slower speech, and softer articulation.

Decision: OpenAI Whisper via API (whisper-1 model) with language: nl forced.

Rationale:

Whisper has best-in-class Dutch language support including regional accents
Forcing language: nl improves accuracy and reduces hallucination on Dutch speech
API model removes on-device compute requirement for MVP
OpenAI processes data under a Data Processing Agreement (DPA) — we have confirmed EU DPA availability
Consequences:

Voice audio is sent to OpenAI servers; this is a data residency consideration. Mitigation: DPA in place; audio is not stored by OpenAI after transcription; elder consent is explicit during onboarding
Latency: API round-trip ~300–800ms acceptable for our use case
Phase 2 Consideration: Evaluate on-device Whisper (via whisper.rn or ExpoSpeech) for offline fallback.

Alternatives Rejected:

Azure Cognitive Services Speech: Dutch quality inferior to Whisper in testing
Google Cloud Speech-to-Text: Similar quality but higher cost at scale; less flexible
AssemblyAI: No strong nl-NL support
ADR-005 — Voice TTS: ElevenLabs
Context: Text-to-speech for the STEM voice companion must sound warm, calm, and natural in Dutch — not robotic.

Decision: ElevenLabs API with a custom nl-NL voice persona ("Hanna" — warm, measured, 60s-female-presenting voice).

Rationale:

ElevenLabs produces the most natural-sounding Dutch TTS available as of 2026
Custom voice cloning allows us to design a consistent HAVEN persona
Streaming API supports low-latency first-byte delivery
ElevenLabs GDPR DPA available
Consequences:

Cost scales with character volume; see Document 10 for cost model
Voice persona must be carefully designed to avoid being mistaken for a real person (AVG Article 22 / transparency obligation)
Alternatives Rejected:

Azure TTS (nl-NL): Good but less warm; "uncanny valley" effect in user testing
Google Cloud TTS: Similar issue
On-device TTS: Quality insufficient for our dignity-first positioning
ADR-006 — Vector Storage: pgvector (in Supabase Postgres)
Context: Companion memory, scam event similarity search, and life story retrieval require semantic vector search.

Decision: pgvector extension within Supabase Postgres; HNSW index for ANN search.

Rationale:

Keeps the data plane unified — no separate vector database to manage, secure, or pay for
HNSW index (added in pgvector 0.5+) provides performance adequate for our scale (< 5M vectors at 5-year horizon)
Simplifies RLS: vector search respects the same row-level security as all other queries
Consequences:

At very large scale (10M+ vectors) we will need to evaluate Qdrant or Pinecone. That is a Phase 3+ concern.
Alternatives Rejected:

Pinecone: Separate service, separate security model, no RLS, US-hosted by default
Qdrant: Self-hosted operational complexity; overkill for MVP
ADR-007 — Location: PostGIS with Fuzzy Privacy Model
Context: Safe zone and wandering detection require geospatial data. But storing precise elder location is a significant privacy risk.

Decision: PostGIS extension in Postgres. Location is stored as neighbourhood-level fuzzed geometry (100m radius noise applied before storage) except for active safe-zone exit events (stored precisely, auto-deleted after 24h).

Rationale:

Fuzzy location satisfies our dignity-first principle: HAVEN is not a tracking app
PostGIS integrates natively with Postgres RLS
Neighbourhood-level precision is sufficient for "left the safe zone" detection and community event matching
Consequences:

Precise route history is never stored (intentional)
Active exit events must have a 24h auto-delete enforced via pg_cron job (see Document 05)
ADR-008 — PSD2 Banking Integration (Phase 2)
Context: Transaction anomaly detection requires read access to elder banking data.

Decision: Use a Dutch PSD2 AISP (Account Information Service Provider) aggregator. Target: Tink (EU-licensed, GDPR-compliant) or Nordigen (now Gocardless). Final vendor selected at Phase 2 start.

Rationale:

PSD2 gives us a legal framework for read-only account access with explicit elder consent
Dutch major banks (ING, Rabobank, ABN AMRO) all expose PSD2-compliant APIs
AISP aggregators handle the bank-by-bank OAuth flows and normalise the data
Consequences:

Elder must explicitly consent via their bank's OAuth flow (strong customer authentication)
We never store full account numbers — only masked identifiers and transaction metadata
ADR-009 — Dutch Healthcare Integration: MedMij / PGO (Phase 2)
Context: Accessing Dutch personal health records requires compliance with the MedMij standard.

Decision: Integrate with a certified Dutch PGO (Persoonlijke Gezondheidsomgeving) provider as a data consumer, using the MedMij afsprakenstelsel (framework agreement).

Rationale:

MedMij is the Dutch national standard for personal health data exchange
Integrating as a MedMij data consumer gives us legally compliant access to medication history, GP correspondence, and lab results
Requires formal MedMij toelating (accreditation) — this is a Phase 2 regulatory milestone
Consequences:

MedMij accreditation takes 3–6 months; must be started at Phase 1 end
FHIR R4 is the underlying data format
ADR-010 — Embedding Model: OpenAI text-embedding-3-small
Context: Companion memory, scam similarity, and story retrieval require embeddings.

Decision: OpenAI text-embedding-3-small (1536 dimensions).

Rationale:

Strong multilingual performance including Dutch
Cost-effective vs. text-embedding-3-large
1536 dimensions work well with pgvector HNSW
Consequences:

All text sent for embedding is subject to OpenAI DPA (same as Whisper)
Document 03 — System Architecture
1. C4 Level 1 — System Context
text

┌─────────────────────────────────────────────────────────────────────┐
│                        HAVEN SYSTEM                                 │
│                                                                     │
│  ┌───────────────┐   ┌─────────────────┐   ┌───────────────────┐   │
│  │  Elder App    │   │ Family Dashboard│   │  Guardian Portal  │   │
│  │ (React Native)│   │   (Next.js 14)  │   │   (Next.js 14)    │   │
│  └──────┬────────┘   └────────┬────────┘   └────────┬──────────┘   │
│         │                     │                     │              │
│         └─────────────────────┼─────────────────────┘              │
│                               │                                     │
│                    ┌──────────▼──────────┐                         │
│                    │   Supabase Backend  │                         │
│                    │  (AWS eu-central-1) │                         │
│                    │  Postgres + pgvector│                         │
│                    │  PostGIS + pg_cron  │                         │
│                    │  Auth + Storage     │                         │
│                    │  Edge Functions     │                         │
│                    │  Realtime           │                         │
│                    └──────────┬──────────┘                         │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
          ┌─────────────────────┼──────────────────────┐
          │                     │                      │
   ┌──────▼──────┐    ┌─────────▼──────┐    ┌─────────▼──────┐
   │  OpenAI     │    │  ElevenLabs    │    │  PSD2 / Tink   │
   │ Whisper STT │    │  TTS (nl-NL)   │    │ Banking (Ph.2) │
   │ Embeddings  │    │                │    │                │
   └─────────────┘    └────────────────┘    └────────────────┘
          │
   ┌──────▼──────┐    ┌─────────────────┐   ┌────────────────┐
   │Call Reputat.│    │ MedMij/PGO(Ph2) │   │  Push (FCM/    │
   │   Service   │    │  FHIR R4        │   │   APNs/Expo)   │
   └─────────────┘    └─────────────────┘   └────────────────┘
2. C4 Level 2 — Container Diagram
text

┌──────────────────────────────────────────────────────────────────────────────┐
│ HAVEN Platform                                                               │
│                                                                              │
│  ┌─────────────────────┐      ┌──────────────────────────────────────────┐  │
│  │    ELDER APP         │      │           SUPABASE BACKEND               │  │
│  │  React Native/Expo  │      │                                          │  │
│  │                     │      │  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  ScreenRenderer     │─────▶│  │  PostgREST   │  │  Supabase Auth   │  │  │
│  │  VoiceEngine        │      │  │  (REST API)  │  │  (JWT + RLS)     │  │  │
│  │  SchemaRegistry     │      │  └──────┬───────┘  └────────┬─────────┘  │  │
│  │  OfflineCache       │      │         │                   │            │  │
│  └──────────┬──────────┘      │  ┌──────▼───────────────────▼─────────┐  │  │
│             │                 │  │         PostgreSQL 15               │  │  │
│  ┌──────────▼──────────┐      │  │   pgvector | PostGIS | pg_cron     │  │  │
│  │   FAMILY DASHBOARD  │─────▶│  │   Row-Level Security on all tables │  │  │
│  │   Next.js 14        │      │  └──────────────┬───────────────────--┘  │  │
│  │   App Router        │      │                 │                        │  │
│  │   Supabase Realtime │      │  ┌──────────────▼──────────────────────┐  │  │
│  └─────────────────────┘      │  │        Edge Functions (Deno)        │  │  │
│                               │  │  fn-voice-pipeline                  │  │  │
│  ┌──────────────────────┐     │  │  fn-scam-pipeline                   │  │  │
│  │  GUARDIAN PORTAL     │────▶│  │  fn-medication-escalation           │  │  │
│  │  Next.js 14          │     │  │  fn-companion-memory                │  │  │
│  │  Role-scoped         │     │  │  fn-notification-dispatch           │  │  │
│  └──────────────────────┘     │  │  fn-transaction-intercept (Ph.2)   │  │  │
│                               │  │  fn-weekly-digest                   │  │  │
│                               │  └─────────────────────────────────────┘  │  │
│                               │                                            │  │
│                               │  ┌─────────────────────────────────────┐  │  │
│                               │  │     Supabase Storage                │  │  │
│                               │  │  Voice recordings | Photos | Docs   │  │  │
│                               │  │  (AES-256, EU region)               │  │  │
│                               │  └─────────────────────────────────────┘  │  │
│                               └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
3. Voice Interaction Pipeline (Sequence)
text

Elder speaks
     │
     ▼
[React Native] — record audio (16kHz mono WAV)
     │
     ▼
[fn-voice-pipeline] Edge Function
     │
     ├──▶ OpenAI Whisper API (language: nl)
     │         └──▶ transcript (Dutch text)
     │
     ├──▶ Intent Classifier (pattern match + embedding similarity)
     │         └──▶ intent + entities
     │                   │
     │     ┌─────────────┴──────────────┐
     │     ▼                            ▼
     │  [Medication log]          [Task creation]
     │  [Wellness check-in]       [Story archive]
     │  [Crisis escalation]       [Companion query]
     │  [Navigation command]      [Scam report]
     │
     ├──▶ [Companion LLM] (if no structured intent)
     │         └──▶ response text (Dutch)
     │
     ├──▶ companion_memory upsert (embedding store)
     │
     └──▶ ElevenLabs TTS (nl-NL "Hanna" voice)
               └──▶ audio stream → elder device
4. Scam Detection Pipeline (Sequence)
text

Incoming call / message / link received
     │
     ▼
[fn-scam-pipeline] Edge Function
     │
     ├──▶ Layer 1: Phone/domain reputation lookup (cache-first)
     │         └──▶ reputation_score (0–100)
     │
     ├──▶ Layer 2: Pattern matching (known NL scam scripts)
     │         └──▶ pattern_match_score
     │
     ├──▶ Layer 3: NLP intent analysis (Dutch text)
     │         └──▶ urgency_score, authority_claim_score
     │
     ├──▶ Layer 4: Longitudinal contact risk (pgvector similarity to
     │              known scam event embeddings)
     │         └──▶ similarity_score
     │
     ├──▶ Composite score → alert_level
     │         Amber: 40–69 | Rood: 70–89 | Zwart: 90+
     │
     ├──▶ INSERT scam_events
     │
     ├──▶ [fn-notification-dispatch]
     │         └──▶ elder: calm voice alert ("Dit gesprek lijkt verdacht")
     │         └──▶ family: push notification (if rood/zwart)
     │
     └──▶ [Zwart only] → fn-transaction-intercept (Phase 2)
5. Medication Escalation State Machine
text

SCHEDULED
     │
     ▼ (reminder time reached)
REMINDED ──── elder confirms ──────────────────────▶ TAKEN ──▶ done
     │
     │ (no response after 10 min)
     ▼
SNOOZED_1 ──── elder confirms ─────────────────────▶ TAKEN
     │
     │ (no response after 20 min)
     ▼
SNOOZED_2 ──── elder confirms ─────────────────────▶ TAKEN
     │
     │ (no response after 30 min)
     ▼
ESCALATED ──── family push notification sent
     │          "Mama heeft haar medicijnen nog niet genomen"
     │
     │ (elder confirms late) ─────────────────────▶ TAKEN_LATE
     │
     │ (no response after 60 min total)
     ▼
MISSED ──── daily summary updated
            weekly digest updated
6. Onboarding Flow
text

Family member registers (email + DigiD optional)
     │
     ▼
Creates elder profile (name, DOB, language, timezone: Europe/Amsterdam)
     │
     ▼
Sets up medications (photo OCR or manual)
     │
     ▼
Defines safe zone (map picker → PostGIS point + radius)
     │
     ▼
Completes emergency medical profile (huisarts, allergies, conditions)
     │
     ▼
Sends elder app invite (SMS to elder's phone)
     │
     ▼
Elder opens app → voice-guided welcome ("Hallo, ik ben HAVEN")
     │
     ▼
Elder gives explicit consent (voice + tap confirmation)
     │
     ▼
Relationship activated (family_relationships.elder_consented = true)
     │
     ▼
Home screen rendered
Document 04 — API Contract
1. Authentication Model
HAVEN uses Supabase Auth (JWT) with three roles enforced at the database level via RLS.

1.1 Roles
Role	Description	Auth Method
elder	Primary app user	Magic link SMS (no password)
family	Family member / mantelzorger	Email + password or DigiD (Phase 2)
carer	Professional zorgverlener	Email + password + organisation invite
admin	HAVEN platform admin	Email + password + TOTP mandatory
1.2 JWT Claims
Every JWT issued by Supabase Auth includes:

JSON

{
  "sub": "<uuid>",
  "role": "authenticated",
  "app_role": "family",
  "elder_id": "<uuid>",
  "org_id": "<uuid | null>",
  "iat": 1718000000,
  "exp": 1718086400
}
app_role is set via a Supabase Auth hook that reads from the profiles table on sign-in. elder_id is set for family and carer roles to the primary elder they are linked to.

1.3 Token Lifecycle
Token	Lifetime	Storage
Access token	1 hour	In-memory only (never localStorage, never AsyncStorage unencrypted)
Refresh token	30 days	iOS Keychain / Android Keystore via expo-secure-store
2. Edge Functions — Complete Inventory
All Edge Functions are deployed to supabase/functions/ and run in Deno on Supabase Edge Runtime (eu-central-1).

2.1 fn-voice-pipeline
Trigger: POST from elder app Auth: Bearer JWT (elder role required) Input:

TypeScript

{
  audio_base64: string;       // 16kHz mono WAV, max 30s
  screen_id: ScreenId;        // current screen context
  elder_id: string;           // UUID
}
Output:

TypeScript

{
  transcript: string;
  intent: IntentType;
  entities: Record<string, string>;
  response_text: string;
  audio_url: string;          // signed Supabase Storage URL, 5-min TTL
  action_taken: ActionType | null;
  distress_detected: boolean;
}
Side effects: INSERTs to voice_interactions; may INSERT to tasks, wellness_checkins, life_stories; may trigger fn-notification-dispatch if distress detected.

2.2 fn-scam-pipeline
Trigger: POST from elder app (call event or message event) or scheduled via pg_cron Auth: Bearer JWT (elder role) or service role (for scheduled jobs) Input:

TypeScript

{
  elder_id: string;
  channel: 'phone' | 'sms' | 'whatsapp' | 'email' | 'web';
  signal_reference: string;   // phone number (hashed) or URL or message snippet hash
  raw_content_hash: string;   // SHA-256 of raw content — content itself not stored
  contact_id?: string;        // UUID if known contact
}
Output:

TypeScript

{
  scam_event_id: string;
  alert_level: 'none' | 'amber' | 'rood' | 'zwart';
  composite_score: number;    // 0–100
  layer_scores: {
    reputation: number;
    pattern: number;
    nlp_intent: number;
    longitudinal: number;
  };
  explanation_nl: string;     // Dutch plain-language explanation for elder
  family_notified: boolean;
}
2.3 fn-medication-escalation
Trigger: pg_cron every 10 minutes Auth: Service role Logic: Queries medication_reminders where status IN ('reminded', 'snoozed_1', 'snoozed_2') and scheduled_time < now() - escalation_threshold. Updates status, dispatches notifications. Output: No HTTP response (scheduled job); side effects only.

2.4 fn-companion-memory
Trigger: Called internally by fn-voice-pipeline Auth: Service role Input:

TypeScript

{
  elder_id: string;
  interaction_id: string;
  memory_type: 'preference' | 'fact' | 'event' | 'relationship';
  content: string;
  source_interaction_id?: string;
  source_story_id?: string;
}
Logic: Generates embedding via OpenAI → upserts to companion_memory (deduplication via cosine similarity threshold 0.97).

2.5 fn-notification-dispatch
Trigger: Called by other Edge Functions Auth: Service role Input:

TypeScript

{
  recipient_id: string;
  recipient_role: 'elder' | 'family' | 'carer';
  notification_type: NotificationType;
  title_nl: string;
  body_nl: string;
  data?: Record<string, string>;
  priority: 'normal' | 'high';
}
Logic: Looks up push_tokens for recipient → dispatches via Expo Push API (which routes to APNs/FCM). INSERTs to notifications table.

2.6 fn-weekly-digest
Trigger: pg_cron every Monday 08:00 Europe/Amsterdam Auth: Service role Logic: Aggregates prior 7 days of scam_events, medication_reminders, wellness_checkins, voice_interactions per elder → INSERTs to safety_digests → dispatches push/email to linked family members.

2.7 fn-transaction-intercept (Phase 2)
Trigger: Webhook from PSD2/Tink on new transaction Auth: Tink webhook signature verification (HMAC-SHA256) Input: Tink transaction payload (normalised) Logic: Runs anomaly scoring → if score > threshold, INSERTs financial_transactions with flagged = true, creates linked scam_event, dispatches fn-notification-dispatch at zwart level.

2.8 fn-location-event
Trigger: POST from elder app (background location update) Auth: Bearer JWT (elder role) Input:

TypeScript

{
  elder_id: string;
  latitude: number;
  longitude: number;
  accuracy_metres: number;
  timestamp: string;          // ISO 8601
}
Logic:

Apply 100m fuzzy noise before storage
Check against elder_profiles.safe_zone_centre + safe_zone_radius_metres
If outside safe zone: INSERT location_events (precise — 24h auto-delete via pg_cron), trigger family notification
If inside safe zone: INSERT location_events with fuzzed geometry only
3. PostgREST (Auto-generated REST API)
Supabase exposes all tables via PostgREST. Access is governed entirely by RLS policies (defined in Document 05). No table is accessible without a valid JWT and a matching RLS policy.

Key conventions:

All list endpoints use ?limit=50&offset=0 pagination by default
Soft-deleted rows (deleted_at IS NOT NULL) are filtered by RLS policy — callers never see them
Timestamps are always UTC ISO 8601; UI converts to Europe/Amsterdam for display
4. Real-time Subscriptions
The family dashboard and elder app use Supabase Realtime for live updates.

Channel	Table	Filter	Used By
scam-alerts	scam_events	elder_id = :id AND alert_level IN ('rood','zwart')	Family dashboard
medication-status	medication_reminders	elder_id = :id	Family dashboard
family-messages	family_messages	elder_id = :id	Elder app + family dashboard
notifications	notifications	recipient_id = :id	Both apps
location-events	location_events	elder_id = :id AND event_type = 'safe_zone_exit'	Family dashboard
All channels are authenticated — Supabase Realtime validates the JWT before subscribing and RLS applies to the underlying data.

Document 05 — Database Specification
1. Principles
All tables have UUID primary keys (gen_random_uuid())
All tables have created_at TIMESTAMPTZ DEFAULT NOW() and updated_at TIMESTAMPTZ DEFAULT NOW()
All tables support soft delete via deleted_at TIMESTAMPTZ
RLS enabled on every table with explicit FORCE ROW LEVEL SECURITY
updated_at maintained via moddatetime trigger on all tables
All migrations are versioned SQL files in supabase/migrations/
Migration naming: YYYYMMDDHHMMSS_description.sql
2. Extensions
SQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "moddatetime";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search on Dutch names
3. Enums
SQL

CREATE TYPE user_role AS ENUM ('elder', 'family', 'carer', 'admin');

CREATE TYPE alert_level AS ENUM ('none', 'amber', 'rood', 'zwart');

CREATE TYPE scam_channel AS ENUM (
  'phone', 'sms', 'whatsapp', 'email', 'web', 'in_person', 'post'
);

CREATE TYPE scam_threat_type AS ENUM (
  'bankhelpdeskfraude',
  'vriend_in_nood',
  'overheid_impersonatie',
  'romantische_fraude',
  'investeringsfraude',
  'pakketfraude',
  'phishing',
  'andere'
);

CREATE TYPE medication_frequency AS ENUM (
  'dagelijks', 'tweemaal_daags', 'driemaal_daags',
  'wekelijks', 'maandelijks', 'zo_nodig', 'andere'
);

CREATE TYPE reminder_status AS ENUM (
  'gepland', 'herinnerd', 'gesnoozed_1', 'gesnoozed_2',
  'geëscaleerd', 'ingenomen', 'laat_ingenomen', 'gemist', 'overgeslagen'
);

CREATE TYPE relationship_type AS ENUM (
  'kind', 'partner', 'kleinzind', 'broer_zus', 'vriend', 'buur', 'andere'
);

CREATE TYPE carer_role AS ENUM (
  'thuiszorgmedewerker', 'wijkverpleegkundige',
  'huisarts', 'specialist', 'andere'
);

CREATE TYPE notification_type AS ENUM (
  'medicijn_herinnering', 'medicijn_gemist', 'scam_amber',
  'scam_rood', 'scam_zwart', 'veilige_zone_verlaten',
  'crisis_gedetecteerd', 'familiebericht', 'welzijnscheck',
  'wekelijks_overzicht', 'systeem'
);

CREATE TYPE memory_type AS ENUM (
  'voorkeur', 'feit', 'gebeurtenis', 'relatie'
);

CREATE TYPE story_status AS ENUM ('opname', 'transcriberen', 'gereed', 'gearchiveerd');

CREATE TYPE cognitive_trend AS ENUM ('stabiel', 'verbeterend', 'verslechterend', 'onbekend');
4. Core Identity Tables
4.1 profiles
SQL

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  user_role NOT NULL,
  full_name             TEXT NOT NULL,
  preferred_name        TEXT,                            -- "Oma Lies" / "Cor"
  phone_nl              TEXT,                            -- Dutch format: +31 6 ...
  locale                TEXT NOT NULL DEFAULT 'nl-NL',
  timezone              TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  country_code          CHAR(2) NOT NULL DEFAULT 'NL',
  high_contrast         BOOLEAN NOT NULL DEFAULT FALSE,
  font_size_multiplier  DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  voice_id              TEXT,                            -- ElevenLabs voice ID
  onboarding_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON profiles;

-- Trigger: updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
4.2 elder_profiles
SQL

CREATE TABLE elder_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Dutch healthcare identifiers
  bsn_encrypted             BYTEA,                       -- AES-256-GCM encrypted BSN
  bsn_last_four             CHAR(4),                     -- for display/verification only
  zorgverzekering_nummer    TEXT,                        -- health insurance number
  huisarts_naam             TEXT,
  huisarts_praktijk         TEXT,
  huisarts_telefoon         TEXT,
  apotheker_naam            TEXT,
  apotheker_adres           TEXT,

  -- Emergency medical profile
  medical_conditions        TEXT[],
  allergies                 TEXT[],
  current_medications_count INT,
  blood_type                TEXT,
  dnr_on_file               BOOLEAN DEFAULT FALSE,
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,

  -- Cognitive / care support
  cognitive_support_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  cognitive_trend           cognitive_trend DEFAULT 'onbekend',
  bereavement_active        BOOLEAN NOT NULL DEFAULT FALSE,
  bereavement_start_date    DATE,
  bereavement_person_name   TEXT,

  -- Safe zone (PostGIS)
  safe_zone_centre          GEOMETRY(POINT, 4326),
  safe_zone_radius_metres   INT DEFAULT 500,
  safe_zone_label           TEXT DEFAULT 'Thuis',        -- "Thuis", "Dagopvang", etc.

  -- Night mode
  night_mode_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  night_mode_start          TIME DEFAULT '22:00',
  night_mode_end            TIME DEFAULT '07:00',

  -- Legacy
  legacy_setup_complete     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  UNIQUE(profile_id)
);

ALTER TABLE elder_profiles ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON elder_profiles;
4.3 family_relationships
SQL

CREATE TABLE family_relationships (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  family_member_id        UUID NOT NULL REFERENCES profiles(id),
  relationship_type       relationship_type NOT NULL,
  is_primary              BOOLEAN NOT NULL DEFAULT FALSE,

  -- Consent & permissions (elder controls these)
  elder_consented         BOOLEAN NOT NULL DEFAULT FALSE,
  elder_consented_at      TIMESTAMPTZ,
  can_view_location       BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_financials     BOOLEAN NOT NULL DEFAULT FALSE,   -- Phase 2
  can_view_medications    BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_messages       BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_wellness       BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_stories        BOOLEAN NOT NULL DEFAULT FALSE,   -- elder chooses
  can_manage_medications  BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_safe_zone    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Alert subscriptions
  alert_amber             BOOLEAN NOT NULL DEFAULT TRUE,
  alert_rood              BOOLEAN NOT NULL DEFAULT TRUE,
  alert_zwart             BOOLEAN NOT NULL DEFAULT TRUE,
  alert_medication_missed BOOLEAN NOT NULL DEFAULT TRUE,
  alert_crisis            BOOLEAN NOT NULL DEFAULT TRUE,
  alert_safe_zone_exit    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  UNIQUE(elder_id, family_member_id)
);

ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON family_relationships;
4.4 carer_relationships
SQL

CREATE TABLE carer_relationships (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  carer_id              UUID NOT NULL REFERENCES profiles(id),
  organisation_name     TEXT NOT NULL,
  carer_role            carer_role NOT NULL,
  big_register_nummer   TEXT,                            -- Dutch BIG register
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  start_date            DATE NOT NULL,
  end_date              DATE,
  can_view_medications  BOOLEAN NOT NULL DEFAULT TRUE,
  can_log_visits        BOOLEAN NOT NULL DEFAULT TRUE,
  can_report_incidents  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  UNIQUE(elder_id, carer_id)
);

ALTER TABLE carer_relationships ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON carer_relationships;
5. SCHILD Tables
5.1 scam_events
SQL

CREATE TABLE scam_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                  UUID NOT NULL REFERENCES profiles(id),
  contact_id                UUID REFERENCES contacts(id),
  channel                   scam_channel NOT NULL,
  signal_reference_hashed   TEXT NOT NULL,               -- SHA-256 hashed phone/URL
  raw_content_hash          TEXT NOT NULL,               -- SHA-256 of raw content
  threat_types              scam_threat_type[],
  alert_level               alert_level NOT NULL DEFAULT 'none',

  -- Pipeline scores (0–100)
  score_composite           SMALLINT NOT NULL DEFAULT 0 CHECK (score_composite BETWEEN 0 AND 100),
  score_reputation          SMALLINT CHECK (score_reputation BETWEEN 0 AND 100),
  score_pattern             SMALLINT CHECK (score_pattern BETWEEN 0 AND 100),
  score_nlp_intent          SMALLINT CHECK (score_nlp_intent BETWEEN 0 AND 100),
  score_longitudinal        SMALLINT CHECK (score_longitudinal BETWEEN 0 AND 100),

  explanation_nl            TEXT NOT NULL,               -- Dutch plain language
  embedding                 VECTOR(1536),                -- for similarity search

  elder_dismissed           BOOLEAN NOT NULL DEFAULT FALSE,
  elder_dismissed_at        TIMESTAMPTZ,
  family_notified           BOOLEAN NOT NULL DEFAULT FALSE,
  family_notified_at        TIMESTAMPTZ,

  -- Transaction linkage (Phase 2)
  linked_transaction_id     UUID REFERENCES financial_transactions(id),
  transaction_intercepted   BOOLEAN DEFAULT FALSE,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

ALTER TABLE scam_events ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON scam_events;

-- Indexes
CREATE INDEX idx_scam_events_elder_id ON scam_events(elder_id);
CREATE INDEX idx_scam_events_alert_level ON scam_events(alert_level);
CREATE INDEX idx_scam_events_created_at ON scam_events(created_at DESC);
CREATE INDEX idx_scam_events_embedding ON scam_events USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
5.2 contacts
SQL

CREATE TABLE contacts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                  UUID NOT NULL REFERENCES profiles(id),
  display_name              TEXT NOT NULL,
  phone_hashed              TEXT,
  email_hashed              TEXT,
  relationship_label        TEXT,
  is_trusted                BOOLEAN NOT NULL DEFAULT FALSE,
  interaction_count         INT NOT NULL DEFAULT 0,
  last_interaction_at       TIMESTAMPTZ,
  grooming_risk_score       SMALLINT DEFAULT 0 CHECK (grooming_risk_score BETWEEN 0 AND 100),
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON contacts;
5.3 phone_reputation_cache
SQL

CREATE TABLE phone_reputation_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hashed      TEXT NOT NULL UNIQUE,
  reputation_score  SMALLINT NOT NULL CHECK (reputation_score BETWEEN 0 AND 100),
  source            TEXT NOT NULL,
  report_count      INT DEFAULT 0,
  cached_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- No RLS needed — this is non-personal reputation data
-- pg_cron cleanup: DELETE FROM phone_reputation_cache WHERE expires_at < NOW();
5.4 documents
SQL

CREATE TABLE documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  label_nl              TEXT NOT NULL,                  -- "Paspoort", "DigiD kaart"
  document_type         TEXT NOT NULL,
  storage_path          TEXT NOT NULL,                  -- Supabase Storage path
  summary_nl            TEXT,                           -- AI-generated Dutch summary
  is_sensitive_legal    BOOLEAN NOT NULL DEFAULT FALSE, -- 48h cooling-off for deletions
  in_emergency_profile  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON documents;
5.5 financial_transactions (Phase 2)
SQL

CREATE TABLE financial_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  account_id_masked       TEXT NOT NULL,               -- last 4 digits only
  bank_name               TEXT,                        -- ING, Rabobank, ABN AMRO, etc.
  amount_cents            BIGINT NOT NULL,
  currency                CHAR(3) NOT NULL DEFAULT 'EUR',
  counterparty_name       TEXT,
  counterparty_iban_masked TEXT,
  description             TEXT,
  transaction_date        DATE NOT NULL,
  anomaly_score           SMALLINT DEFAULT 0,
  flagged                 BOOLEAN NOT NULL DEFAULT FALSE,
  linked_scam_event_id    UUID REFERENCES scam_events(id),
  intercepted             BOOLEAN DEFAULT FALSE,
  elder_reviewed          BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON financial_transactions;
5.6 safety_digests
SQL

CREATE TABLE safety_digests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  week_starting           DATE NOT NULL,
  scam_events_count       INT NOT NULL DEFAULT 0,
  amber_count             INT NOT NULL DEFAULT 0,
  rood_count              INT NOT NULL DEFAULT 0,
  zwart_count             INT NOT NULL DEFAULT 0,
  medications_taken_pct   DECIMAL(5,2),
  wellness_avg_score      DECIMAL(5,2),
  family_interactions     INT NOT NULL DEFAULT 0,
  summary_nl              TEXT,
  sent_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(elder_id, week_starting)
);

ALTER TABLE safety_digests ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON safety_digests;
6. ANKER Tables
6.1 medications
SQL

CREATE TABLE medications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  name_nl                 TEXT NOT NULL,               -- Dutch medication name
  generic_name            TEXT,
  brand_name              TEXT,
  g_standaard_code        TEXT,                        -- Dutch G-Standaard (Phase 2)
  dose_description_nl     TEXT NOT NULL,               -- "1 tablet van 10mg"
  frequency               medication_frequency NOT NULL,
  schedule_times          TIME[] NOT NULL,             -- array of daily times
  with_food               BOOLEAN DEFAULT FALSE,
  special_instructions_nl TEXT,
  prescribing_huisarts    TEXT,
  pharmacy_name           TEXT,
  refill_date             DATE,
  refill_reminder_days    INT DEFAULT 7,
  ocr_source              BOOLEAN DEFAULT FALSE,       -- was this set up via OCR?
  fhir_medication_id      TEXT,                        -- MedMij Phase 2
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON medications;
6.2 medication_reminders
SQL

CREATE TABLE medication_reminders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id         UUID NOT NULL REFERENCES medications(id),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  scheduled_time        TIMESTAMPTZ NOT NULL,
  status                reminder_status NOT NULL DEFAULT 'gepland',
  snooze_count          SMALLINT NOT NULL DEFAULT 0,
  first_reminded_at     TIMESTAMPTZ,
  confirmed_at          TIMESTAMPTZ,
  escalated_at          TIMESTAMPTZ,
  family_notified_at    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON medication_reminders;

-- Indexes
CREATE INDEX idx_med_reminders_elder_scheduled
  ON medication_reminders(elder_id, scheduled_time DESC);
CREATE INDEX idx_med_reminders_status
  ON medication_reminders(status) WHERE status NOT IN ('ingenomen', 'overgeslagen');
6.3 tasks
SQL

CREATE TABLE tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  created_by_role       user_role NOT NULL DEFAULT 'elder',
  title_nl              TEXT NOT NULL,
  notes_nl              TEXT,
  due_date              DATE,
  due_time              TIME,
  completed             BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at          TIMESTAMPTZ,
  voice_created         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON tasks;
6.4 wellness_checkins
SQL

CREATE TABLE wellness_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id        UUID NOT NULL REFERENCES profiles(id),
  mood_score      SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  energy_score    SMALLINT CHECK (energy_score BETWEEN 1 AND 5),
  pain_score      SMALLINT CHECK (pain_score BETWEEN 1 AND 5),
  notes_nl        TEXT,
  voice_note_path TEXT,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON wellness_checkins;
7. KRING Tables
7.1 family_messages
SQL

CREATE TABLE family_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id            UUID NOT NULL REFERENCES profiles(id),
  sender_id           UUID NOT NULL REFERENCES profiles(id),
  sender_role         user_role NOT NULL,
  message_type        TEXT NOT NULL CHECK (message_type IN (
                        'tekst', 'voice_note', 'foto', 'video_hallo', 'tekening'
                      )),
  content_nl          TEXT,
  storage_path        TEXT,
  duration_seconds    INT,
  read_by_elder       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON family_messages;

CREATE INDEX idx_family_messages_elder_created
  ON family_messages(elder_id, created_at DESC);
7.2 life_stories
SQL

CREATE TABLE life_stories (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  prompt_id             UUID REFERENCES life_story_prompts(id),
  title_nl              TEXT,
  recording_path        TEXT,
  transcript_nl         TEXT,
  duration_seconds      INT,
  status                story_status NOT NULL DEFAULT 'opname',
  embedding             VECTOR(1536),
  keepsake_book_include BOOLEAN NOT NULL DEFAULT FALSE,
  year_approximate      INT,
  location_nl           TEXT,                          -- "Groningen, 1962"
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE life_stories ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON life_stories;

CREATE INDEX idx_life_stories_embedding ON life_stories
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
7.3 life_story_prompts
SQL

CREATE TABLE life_story_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_nl     TEXT NOT NULL,
  category_nl   TEXT NOT NULL,  -- "Jeugd", "Werk", "Familie", "Liefde", "Herinneringen"
  sort_order    INT NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Seed data (examples):
-- "Vertel me over je eerste dag op het werk"
-- "Wat was je favoriete plek als kind?"
-- "Hoe ontmoette jij je partner?"
7.4 memory_lane_photos
SQL

CREATE TABLE memory_lane_photos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  uploaded_by_id        UUID NOT NULL REFERENCES profiles(id),
  storage_path          TEXT NOT NULL,
  caption_nl            TEXT,
  year_approximate      INT,
  date_taken            DATE,
  location_nl           TEXT,
  is_memorial           BOOLEAN NOT NULL DEFAULT FALSE,
  surface_on_anniversary BOOLEAN NOT NULL DEFAULT FALSE,
  anniversary_date      DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE memory_lane_photos ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON memory_lane_photos;
8. KOMPAS Tables
8.1 location_events
SQL

CREATE TABLE location_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  event_type            TEXT NOT NULL CHECK (event_type IN (
                          'veilige_zone_verlaten', 'veilige_zone_teruggekeerd',
                          'check_in', 'nacht_beweging'
                        )),
  location_fuzzed       GEOMETRY(POINT, 4326) NOT NULL,  -- always stored fuzzed
  location_precise      GEOMETRY(POINT, 4326),           -- only for safe_zone_exit, 24h TTL
  accuracy_metres       INT,
  family_notified       BOOLEAN NOT NULL DEFAULT FALSE,
  check_in_prompted     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_delete_at        TIMESTAMPTZ                      -- set to NOW()+24h for precise events
);

ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON location_events;

-- pg_cron: precise location auto-delete
-- SELECT cron.schedule('location-precise-cleanup', '*/30 * * * *',
--   $$UPDATE location_events SET location_precise = NULL
--     WHERE auto_delete_at < NOW() AND location_precise IS NOT NULL$$);
8.2 cognitive_checkins
SQL

CREATE TABLE cognitive_checkins (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  question_nl             TEXT NOT NULL,
  answer_nl               TEXT,
  expected_answer_nl      TEXT,
  correct                 BOOLEAN,
  confidence_score        DECIMAL(4,3),
  rolling_score_7d        DECIMAL(4,3),
  significant_change      BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cognitive_checkins ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON cognitive_checkins;
9. STEM Tables
9.1 voice_interactions
SQL

CREATE TABLE voice_interactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  screen_id             TEXT NOT NULL,
  transcript_nl         TEXT NOT NULL,
  intent                TEXT,
  entities              JSONB,
  confidence_score      DECIMAL(4,3),
  response_text_nl      TEXT,
  response_audio_path   TEXT,
  distress_detected     BOOLEAN NOT NULL DEFAULT FALSE,
  distress_phrase       TEXT,
  action_taken          TEXT,
  duration_ms           INT,
  embedding             VECTOR(1536),
  audio_path            TEXT,                          -- retained 30 days then deleted
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_delete_audio_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE voice_interactions ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON voice_interactions;

CREATE INDEX idx_voice_interactions_elder_created
  ON voice_interactions(elder_id, created_at DESC);
CREATE INDEX idx_voice_interactions_embedding ON voice_interactions
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
9.2 companion_memory
SQL

CREATE TABLE companion_memory (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  memory_type             memory_type NOT NULL,
  content_nl              TEXT NOT NULL,
  embedding               VECTOR(1536) NOT NULL,
  confidence              DECIMAL(4,3) DEFAULT 1.000,
  source_interaction_id   UUID REFERENCES voice_interactions(id),
  source_story_id         UUID REFERENCES life_stories(id),
  last_recalled_at        TIMESTAMPTZ,
  recall_count            INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE companion_memory ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON companion_memory;

CREATE INDEX idx_companion_memory_embedding ON companion_memory
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
10. WACHT Tables
10.1 carer_visit_logs
SQL

CREATE TABLE carer_visit_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  carer_id              UUID NOT NULL REFERENCES profiles(id),
  visit_date            DATE NOT NULL,
  check_in_time         TIMESTAMPTZ,
  check_out_time        TIMESTAMPTZ,
  activities_nl         TEXT[],
  observations_nl       TEXT,
  mood_observed         SMALLINT CHECK (mood_observed BETWEEN 1 AND 5),
  concerns_nl           TEXT,
  follow_up_required    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

ALTER TABLE carer_visit_logs ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON carer_visit_logs;
10.2 incidents
SQL

CREATE TABLE incidents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id                UUID NOT NULL REFERENCES profiles(id),
  reported_by_id          UUID NOT NULL REFERENCES profiles(id),
  incident_type           TEXT NOT NULL,               -- meldcode categories
  description_nl          TEXT NOT NULL,
  severity                TEXT NOT NULL CHECK (severity IN ('laag', 'gemiddeld', 'hoog', 'kritiek')),
  meldcode_step_reached   SMALLINT CHECK (meldcode_step_reached BETWEEN 1 AND 5),
  external_report_made    BOOLEAN NOT NULL DEFAULT FALSE,
  external_authority_nl   TEXT,                        -- "Veilig Thuis", "huisarts", etc.
  resolved                BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at             TIMESTAMPTZ,
  resolution_notes_nl     TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON incidents;
11. System Tables
11.1 notifications
SQL

CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id          UUID NOT NULL REFERENCES profiles(id),
  notification_type     notification_type NOT NULL,
  title_nl              TEXT NOT NULL,
  body_nl               TEXT NOT NULL,
  data                  JSONB,
  read                  BOOLEAN NOT NULL DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  sent_at               TIMESTAMPTZ,
  send_error            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON notifications;

CREATE INDEX idx_notifications_recipient_read
  ON notifications(recipient_id, read, created_at DESC);
11.2 push_tokens
SQL

CREATE TABLE push_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON push_tokens;
12. RLS Policy Definitions
These are the canonical RLS policies. All are PERMISSIVE unless stated.

SQL

-- ─────────────────────────────────────────────────
-- profiles: users can only read/update their own profile
-- ─────────────────────────────────────────────────
CREATE POLICY "profiles: self access"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- ─────────────────────────────────────────────────
-- elder_profiles: elder sees own; family sees via relationship + consent
-- ─────────────────────────────────────────────────
CREATE POLICY "elder_profiles: elder access"
  ON elder_profiles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "elder_profiles: family read"
  ON elder_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_relationships fr
      WHERE fr.elder_id = elder_profiles.profile_id
        AND fr.family_member_id = auth.uid()
        AND fr.elder_consented = TRUE
        AND fr.deleted_at IS NULL
    )
  );

-- ─────────────────────────────────────────────────
-- scam_events: elder sees own; family sees if rood/zwart + permission
-- ─────────────────────────────────────────────────
CREATE POLICY "scam_events: elder access"
  ON scam_events FOR ALL
  USING (elder_id = auth.uid());

CREATE POLICY "scam_events: family read"
  ON scam_events FOR SELECT
  USING (
    alert_level IN ('rood', 'zwart')
    AND EXISTS (
      SELECT 1 FROM family_relationships fr
      WHERE fr.elder_id = scam_events.elder_id
        AND fr.family_member_id = auth.uid()
        AND fr.elder_consented = TRUE
        AND fr.deleted_at IS NULL
    )
  );

-- ─────────────────────────────────────────────────
-- medication_reminders: elder sees own; family sees if can_view_medications
-- ─────────────────────────────────────────────────
CREATE POLICY "medication_reminders: elder access"
  ON medication_reminders FOR ALL
  USING (elder_id = auth.uid());

CREATE POLICY "medication_reminders: family read"
  ON medication_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_relationships fr
      WHERE fr.elder_id = medication_reminders.elder_id
        AND fr.family_member_id = auth.uid()
        AND fr.can_view_medications = TRUE
        AND fr.elder_consented = TRUE
        AND fr.deleted_at IS NULL
    )
  );

-- ─────────────────────────────────────────────────
-- location_events: elder sees own; family sees if can_view_location
-- ─────────────────────────────────────────────────
CREATE POLICY "location_events: elder access"
  ON location_events FOR ALL
  USING (elder_id = auth.uid());

CREATE POLICY "location_events: family read (fuzzed only)"
  ON location_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_relationships fr
      WHERE fr.elder_id = location_events.elder_id
        AND fr.family_member_id = auth.uid()
        AND fr.can_view_location = TRUE
        AND fr.elder_consented = TRUE
        AND fr.deleted_at IS NULL
    )
  );
-- Note: location_precise column is additionally masked in the PostgREST view

-- ─────────────────────────────────────────────────
-- family_messages: sender or elder
-- ─────────────────────────────────────────────────
CREATE POLICY "family_messages: access"
  ON family_messages FOR ALL
  USING (
    elder_id = auth.uid()
    OR sender_id = auth.uid()
  );

-- ─────────────────────────────────────────────────
-- life_stories: elder owns; family reads if can_view_stories
-- ─────────────────────────────────────────────────
CREATE POLICY "life_stories: elder access"
  ON life_stories FOR ALL
  USING (elder_id = auth.uid());

CREATE POLICY "life_stories: family read"
  ON life_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_relationships fr
      WHERE fr.elder_id = life_stories.elder_id
        AND fr.family_member_id = auth.uid()
        AND fr.can_view_stories = TRUE
        AND fr.elder_consented = TRUE
        AND fr.deleted_at IS NULL
    )
  );

-- ─────────────────────────────────────────────────
-- notifications: recipient only
-- ─────────────────────────────────────────────────
CREATE POLICY "notifications: recipient access"
  ON notifications FOR ALL
  USING (recipient_id = auth.uid());

-- ─────────────────────────────────────────────────
-- companion_memory: elder only (never exposed to family by design)
-- ─────────────────────────────────────────────────
CREATE POLICY "companion_memory: elder only"
  ON companion_memory FOR ALL
  USING (elder_id = auth.uid());

-- ─────────────────────────────────────────────────
-- incidents: carer who reported + service role
-- ─────────────────────────────────────────────────
CREATE POLICY "incidents: carer access"
  ON incidents FOR ALL
  USING (
    reported_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM carer_relationships cr
      WHERE cr.elder_id = incidents.elder_id
        AND cr.carer_id = auth.uid()
        AND cr.active = TRUE
        AND cr.can_report_incidents = TRUE
    )
  );
13. Indexing Strategy
SQL

-- High-volume time-series tables: partition by month (Phase 2 migration)
-- For now: B-tree on (elder_id, created_at DESC) is sufficient

-- Full-text search on Dutch content (pg_trgm)
CREATE INDEX idx_tasks_title_trgm ON tasks USING gin (title_nl gin_trgm_ops);
CREATE INDEX idx_life_stories_transcript_trgm
  ON life_stories USING gin (transcript_nl gin_trgm_ops);

-- Safe zone geometry
CREATE INDEX idx_elder_profiles_safe_zone
  ON elder_profiles USING GIST (safe_zone_centre);
CREATE INDEX idx_location_events_fuzzed
  ON location_events USING GIST (location_fuzzed);
14. Scheduled Jobs (pg_cron)
SQL

-- Weekly digest: every Monday 08:00 Amsterdam time
SELECT cron.schedule('weekly-digest', '0 8 * * 1',
  $$SELECT net.http_post(url := current_setting('app.edge_fn_url') || '/fn-weekly-digest',
    headers := '{"Authorization": "Bearer " || current_setting(''app.service_role_key'')}'::jsonb
  )$$);

-- Medication escalation: every 10 minutes
SELECT cron.schedule('medication-escalation', '*/10 * * * *',
  $$SELECT net.http_post(url := current_setting('app.edge_fn_url') || '/fn-medication-escalation',
    headers := '{"Authorization": "Bearer " || current_setting(''app.service_role_key'')}'::jsonb
  )$$);

-- Precise location cleanup: every 30 minutes
SELECT cron.schedule('location-precise-cleanup', '*/30 * * * *',
  $$UPDATE location_events
    SET location_precise = NULL
    WHERE auto_delete_at < NOW()
      AND location_precise IS NOT NULL$$);

-- Voice audio cleanup: daily at 03:00
SELECT cron.schedule('voice-audio-cleanup', '0 3 * * *',
  $$UPDATE voice_interactions
    SET audio_path = NULL
    WHERE auto_delete_audio_at < NOW()
      AND audio_path IS NOT NULL$$);

-- Phone reputation cache cleanup: daily at 04:00
SELECT cron.schedule('reputation-cache-cleanup', '0 4 * * *',
  $$DELETE FROM phone_reputation_cache WHERE expires_at < NOW()$$);
Document 06 — Security & Compliance
1. Regulatory Framework (Netherlands)
Regulation	Relevance to HAVEN	Owner
AVG (Algemene Verordening Gegevensbescherming = GDPR)	Primary data protection law. All personal data processing must have a legal basis.	CTO + DPO
Uitvoeringswet AVG (UAVG)	Dutch implementation of GDPR with supplementary rules	CTO + DPO
WGBO (Wet op de geneeskundige behandelingsovereenkomst)	Governs medical data handling; relevant for medication, health, and care data	CTO + Legal
WMO (Wet maatschappelijke ondersteuning)	Governs home care and social support services; relevant for WACHT pillar	Product + Legal
Meldcode Huiselijk Geweld en Kindermishandeling	Governs incident reporting obligations for professional carers	WACHT module
NEN 7510	Dutch standard for information security in healthcare	Security team
MedMij Afsprakenstelsel	Framework for personal health data exchange (Phase 2)	Phase 2 CTO
PSD2 / PSD3	Payment services directive; governs banking data access	Phase 2 (SCHILD)
ePrivacy Directive (Dutch implementation)	Governs cookies, electronic communications, push notifications	Frontend
2. Legal Bases for Processing (AVG Article 6 + Article 9)
HAVEN processes multiple categories of data. Each requires an explicit legal basis.

Data Category	AVG Article 9 Special Category?	Legal Basis	Notes
Name, contact details, profile	No	Article 6(1)(b) — contract performance	Core service delivery
Voice recordings (STEM)	No (unless health content)	Article 6(1)(a) — explicit consent	Consent captured on onboarding; withdrawable at any time
Medication data	Yes — health data	Article 9(2)(a) — explicit consent	Must be granular and informed
BSN (Dutch citizen number)	Yes — Article 87 UAVG special	UAVG Article 46 — only if strictly necessary	Encrypted at rest; access restricted to elder only
Location data	No	Article 6(1)(a) — explicit consent	Consent per-family-member; elder can revoke
Financial transaction data (Phase 2)	No	Article 6(1)(a) — explicit consent	PSD2 consent flow required
Health check-ins / wellness	Yes — health data	Article 9(2)(a) — explicit consent	
Cognitive check-in scores	Yes — health data	Article 9(2)(a) — explicit consent	
Life stories / voice diaries	No (unless health content)	Article 6(1)(a) — explicit consent	Elder controls sharing
Scam event data	No	Article 6(1)(f) — legitimate interest	Fraud prevention; LIA documented
Carer visit logs	Yes — health data	Article 9(2)(h) — healthcare provision	Carer professional obligation
Incident reports	Yes — health data	Article 9(2)(h) + Meldcode obligations	
3. Consent Management
3.1 Consent Principles
Consent is granular — separate consent for each data category (not bundled)
Consent is recorded — stored in consent_records table (see below) with timestamp, version, and channel
Consent is withdrawable — at any time via elder app settings; withdrawal triggers immediate processing halt + soft deletion where applicable
Consent language is plain Dutch — maximum 8th-grade reading level; no legal jargon
Consent for health data requires a separate explicit confirmation step (double-tap or voice "ja, ik ga akkoord")
3.2 consent_records Table
SQL

CREATE TABLE consent_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id              UUID NOT NULL REFERENCES profiles(id),
  consent_type          TEXT NOT NULL,    -- e.g., 'voice_recordings', 'medication_data'
  granted               BOOLEAN NOT NULL,
  consent_version       TEXT NOT NULL,    -- e.g., 'v1.2'
  channel               TEXT NOT NULL,   -- 'elder_app', 'family_onboarding', 'api'
  ip_address_hashed     TEXT,
  device_id             TEXT,
  granted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
FORCE ROW LEVEL SECURITY ON consent_records;

CREATE POLICY "consent_records: elder access"
  ON consent_records FOR ALL
  USING (elder_id = auth.uid());
4. Data Classification
Class	Definition	Examples	Controls
Class 1 — Openbaar	Non-personal, non-sensitive	App UI text, community event data	Standard
Class 2 — Persoonlijk	Personal data (AVG Article 4)	Name, phone, email, push tokens	Encrypted in transit (TLS 1.3), RLS enforced
Class 3 — Gevoelig Persoonlijk	Sensitive personal data	Location, financial, scam events	Class 2 controls + field-level encryption where feasible
Class 4 — Bijzondere Categorie	Special category (AVG Article 9)	Medication, health data, cognitive scores, BSN	Class 3 controls + explicit consent + access audit log + encryption at rest (AES-256)
5. Encryption
5.1 In Transit
All API traffic: TLS 1.3 minimum
WebSocket (Realtime): WSS with TLS 1.3
Internal Supabase service communication: encrypted by Supabase platform
5.2 At Rest
Supabase hosted PostgreSQL: AES-256 disk encryption (AWS EBS)
Supabase Storage: AES-256 (AWS S3)
BSN field: additional application-level AES-256-GCM encryption. Key stored in Supabase Vault (not in application code or environment variables accessible to Edge Functions)
Voice recordings: encrypted at storage path level via Supabase Storage (AES-256); paths are not guessable (UUID-based)
5.3 Key Management
Application secrets: Supabase Vault
Service role key: never exposed to frontend; only used in Edge Functions server-side
BSN encryption key: rotated annually; old key retained for 90 days post-rotation for re-encryption
6. Threat Model
6.1 Assets to Protect
Elder personal and health data (Class 4)
Family member access credentials
Voice recordings and life stories
Companion memory (persistent personal history)
Financial data (Phase 2)
BSN and healthcare identifiers
6.2 Threat Actors
Actor	Motivation	Capability
Opportunistic attacker	Financial gain via elder data	Low-medium
Targeted scammer	Access to elder's financial/identity data to facilitate fraud	Medium
Compromised family member	Misuse of elder monitoring capabilities	Low
Malicious carer	Unauthorised access to elder personal data	Low-medium
HAVEN insider	Unauthorised data access	Medium
State actor	Data espionage	Low (not a target at this scale)
6.3 Attack Surfaces
Surface	Threat	Mitigation
Elder app (mobile)	Stolen device → app access	Biometric/PIN lock required; tokens in Keychain; no sensitive data in AsyncStorage
Elder app (mobile)	Malicious app update	Expo EAS signed builds; code signing
Family dashboard (web)	XSS	Next.js App Router (no dangerouslySetInnerHTML); CSP headers
Family dashboard (web)	CSRF	SameSite=Strict cookies; CSRF tokens on state-changing requests
Supabase API	Unauthorised data access	RLS on all tables; service role key never in frontend
Edge Functions	Injection via malformed audio/text	Input validation + sanitisation on all Edge Function inputs
Push notifications	Spoofed notifications	Notifications only sent server-side via service role
PSD2 webhooks (Phase 2)	Spoofed webhook	HMAC-SHA256 signature verification on all inbound webhooks
BSN storage	Data breach exposure	AES-256-GCM application-level encryption; key in Vault
7. Data Retention & Deletion Policy
Data Type	Retention Period	Deletion Method	AVG Right to Erasure
Voice recordings (audio files)	30 days	Auto-delete via pg_cron	Immediate on request
Voice interaction transcripts	12 months	Soft delete → hard delete after 30 days	Immediate on request
Companion memory	Until elder requests deletion	Soft delete	Immediate on request
Medication reminders	24 months	Soft delete	Elder may delete
Scam events	36 months	Soft delete (evidence preservation)	Hard delete 30 days after request
Location events (fuzzed)	6 months	Auto-delete via pg_cron	Immediate on request
Location events (precise)	24 hours	pg_cron — location_precise column nulled	N/A (already auto-deleted)
Life stories	Indefinite (elder's choice)	Elder-controlled; soft delete	Immediate on request
Financial transactions (Phase 2)	7 years	Soft delete (Dutch accounting law: Boekhoudbesluit)	Restricted — legal retention obligation
Carer visit logs	15 years	Soft delete (WGBO medical record retention)	Restricted — legal retention obligation
Incident reports (Meldcode)	5 years	Soft delete (Meldcode retention obligations)	Restricted
Push tokens	Until unregistered	Hard delete on unregister	Immediate
Audit logs	7 years	Immutable append-only	Not deletable — legal basis
7.1 Right to Erasure Process
Elder or authorised family member submits deletion request (in-app or email to privacy@haven.nl)
Request logged in deletion_requests table with timestamp
Automated pipeline runs within 72 hours: cascades soft deletes, nulls encrypted fields, removes Storage files
Confirmation sent to elder within 30 days (AVG Article 12(3))
Any legally retained data (carer logs, financial records) listed explicitly in the confirmation
8. Audit Logging
All access to Class 3/4 data is logged in an append-only audit table.

SQL

CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,               -- sequential for ordering
  actor_id        UUID NOT NULL,
  actor_role      user_role NOT NULL,
  action          TEXT NOT NULL,                       -- e.g., 'READ', 'UPDATE', 'DELETE'
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  elder_id        UUID,
  ip_address_hash TEXT,
  user_agent      TEXT,
  extra           JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS delete policy — audit_log is append-only
-- Only service role can INSERT
-- Retention: 7 years (legal obligation)
Audit events are triggered via Supabase database triggers on:

elder_profiles (all operations)
medications (all operations)
scam_events (all operations)
financial_transactions (all operations)
documents (all operations)
companion_memory (read events via Edge Function logging)
consent_records (all operations)
9. AVG / GDPR Operational Obligations
Obligation	Implementation
Privacy by Design	Schema-driven UI prevents accidental data collection; fuzzed location; no raw audio stored beyond 30 days
Data Minimisation	Only data necessary for each feature is collected; fields for Phase 2 features are nullable and not populated
Verwerkingsregister (Article 30 Record of Processing)	Maintained as living document in Notion; reviewed quarterly
DPIA (Data Protection Impact Assessment)	Required for voice recordings, location, health data, BSN. Completed before MVP launch.
Privacy Policy (Privacyverklaring)	Available in plain Dutch at haven.nl/privacy; version-controlled
Autoriteit Persoonsgegevens Registration	Not mandatory unless processing meets Article 37 DPO threshold; assessed at launch
Data Breach Notification	Within 72 hours to AP (Autoriteit Persoonsgegevens) per AVG Article 33; within "without undue delay" to affected elders per Article 34
DPA with Supabase	In place (Supabase EU DPA)
DPA with OpenAI	In place (OpenAI Data Processing Addendum for EU customers)
DPA with ElevenLabs	Required — confirm EU DPA availability before launch
DPA with Expo/Vercel	In place (both offer EU DPAs)
10. Security Review Plan
Review Type	Frequency	Owner
Dependency vulnerability scan (Snyk)	Every CI run	Automated
Static code analysis (ESLint security rules)	Every CI run	Automated
Supabase RLS policy review	Each schema migration	CTO
Internal security review	Quarterly	CTO
External penetration test	Before MVP launch + annually	Third-party (NEN 7510 certified firm)
AVG compliance review	Annually	DPO + Legal
Document 07 — Elder App Specification
1. Overview
The elder app is a React Native (Expo) application. Its central engineering bet is that every screen is a data schema and the UI is built by a renderer from that schema. This makes it structurally impossible to accidentally add complexity — any screen that violates the UX constitution will fail the CI test suite.

2. UX Constitution (Enforced in CI)
These rules are non-negotiable and tested automatically:

Rule	Constraint
Max navigation depth from home	≤ 2 levels
Max primary items per screen	≤ 4
Max bottom actions per screen	≤ 2
Voice fallback	Required on every screen; ≤ 15 words
Offline cache TTL	Required on every screen
Emergency button	Required on all screens except modals
Accessibility label	Required on every interactive element
Banned words	fout, mislukt, waarschuwing, gevaar, ongeldig, fout opgetreden, als een AI
Banned words (SCHILD exception)	"Nooit" is allowed on SCHILD screens only
Font size	Minimum 18sp body; minimum 24sp primary actions
Touch targets	Minimum 56×56dp
Colour contrast	WCAG 2.1 AA minimum; AAA for primary text
3. TypeScript Schema Types
TypeScript

// types/screen-schema.ts

export type ScreenId =
  | 'HOME'
  | 'VANDAAG'
  | 'MIJN_PILLEN'
  | 'PIL_BEVESTIGING'
  | 'FAMILIE'
  | 'BERICHT_STUREN'
  | 'MIJN_VERHAAL'
  | 'VERHAAL_OPNEMEN'
  | 'SCHILD_AMBER'
  | 'SCHILD_ROOD'
  | 'SCHILD_ZWART'
  | 'DOCUMENT_UITLEG'
  | 'KOMPAS_VEILIGE_ZONE'
  | 'WAT_IS_DIT'
  | 'WELZIJN_CHECKIN'
  | 'COGNITIEVE_CHECKIN'
  | 'INSTELLINGEN'
  | 'NOODPROFIEL';

export type BlockType =
  | 'greeting'
  | 'halo_status'
  | 'hero_button_grid'
  | 'medication_card'
  | 'task_list'
  | 'family_thread'
  | 'voice_note_player'
  | 'story_prompt'
  | 'alert_banner'
  | 'transaction_intercept'
  | 'map_zone'
  | 'wellness_sliders'
  | 'cognitive_question'
  | 'photo_explainer'
  | 'empty_state';

export type AlertLevel = 'none' | 'amber' | 'rood' | 'zwart';

export interface ContentBlock {
  id: string;
  type: BlockType;
  accessibilityLabel: string;
  accessibilityHint?: string;
  props?: Record<string, unknown>;
}

export interface BottomAction {
  id: string;
  labelNl: string;
  icon: string;
  action: ActionType;
  voiceAlias?: string[];            // Dutch phrases that trigger this action
  accessibilityLabel: string;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface VoiceSchema {
  entrySpeak: string;               // What HAVEN says when screen opens (Dutch, ≤ 20 words)
  fallbackSpeak: string;            // What HAVEN says if elder seems stuck (≤ 15 words)
  commands: VoiceCommand[];
  distressPhrases: string[];        // Dutch phrases that trigger crisis flow
}

export interface VoiceCommand {
  intentNl: string;
  examplePhrases: string[];         // Dutch example phrases for this command
  action: ActionType;
  confirmationRequired?: boolean;
}

export interface DataSource {
  key: string;
  table?: string;
  edgeFunction?: string;
  offlineCacheTtlSeconds: number;
}

export interface ScreenSchema {
  screenId: ScreenId;
  titleNl: string;
  accessibilityLabel: string;
  layout: 'single_column' | 'two_column' | 'full_screen_overlay';
  themeVariant: 'default' | 'night' | 'schild_amber' | 'schild_rood' | 'schild_zwart';
  headerVariant: 'greeting' | 'title' | 'minimal' | 'hidden';
  depthFromHome: number;            // CI enforces ≤ 2
  maxPrimaryItems: number;          // CI enforces ≤ 4
  contentBlocks: ContentBlock[];
  bottomActions: BottomAction[];    // CI enforces ≤ 2
  persistentElements: {
    emergencyButton: boolean;       // CI enforces true on all non-modal screens
    voiceButton: boolean;
    haloStatus: boolean;
    backButton: boolean;
  };
  voice: VoiceSchema;
  dataSources: DataSource[];
  emptyState?: ContentBlock;
  screenStates?: Record<string, Partial<ScreenSchema>>;
}
4. Concrete Screen Schemas
4.1 HOME
TypeScript

export const HOME_SCHEMA: ScreenSchema = {
  screenId: 'HOME',
  titleNl: 'HAVEN',
  accessibilityLabel: 'Hoofdscherm van HAVEN',
  layout: 'single_column',
  themeVariant: 'default',
  headerVariant: 'greeting',
  depthFromHome: 0,
  maxPrimaryItems: 4,
  contentBlocks: [
    {
      id: 'greeting_block',
      type: 'greeting',
      accessibilityLabel: 'Begroeting van HAVEN',
      props: { includeTimeOfDay: true, includeWeather: false }
    },
    {
      id: 'halo_block',
      type: 'halo_status',
      accessibilityLabel: 'Jouw dagelijks overzicht',
      props: {
        dimensions: ['pillen', 'veiligheid', 'familie'],
        pulsing: true
      }
    },
    {
      id: 'hero_grid',
      type: 'hero_button_grid',
      accessibilityLabel: 'Kies wat je wilt doen',
      props: {
        items: [
          { id: 'pills', labelNl: 'Mijn Pillen', icon: 'pill', screenTarget: 'MIJN_PILLEN', badgeSource: 'pending_medications' },
          { id: 'today', labelNl: 'Vandaag', icon: 'calendar', screenTarget: 'VANDAAG', badgeSource: 'pending_tasks' },
          { id: 'family', labelNl: 'Familie', icon: 'heart', screenTarget: 'FAMILIE', badgeSource: 'unread_messages' },
          { id: 'help', labelNl: 'Hulp', icon: 'shield', screenTarget: 'NOODPROFIEL' }
        ]
      }
    }
  ],
  bottomActions: [
    {
      id: 'voice_action',
      labelNl: 'Praat met HAVEN',
      icon: 'mic',
      action: 'OPEN_VOICE',
      accessibilityLabel: 'Praat met HAVEN',
      voiceAlias: ['hallo haven', 'haven', 'luister'],
      style: 'primary'
    }
  ],
  persistentElements: {
    emergencyButton: true,
    voiceButton: true,
    haloStatus: true,
    backButton: false
  },
  voice: {
    entrySpeak: 'Goedemorgen. Alles goed met u vandaag?',
    fallbackSpeak: 'Waarmee kan ik u helpen?',
    commands: [
      {
        intentNl: 'navigeer_pillen',
        examplePhrases: ['mijn pillen', 'medicijnen', 'heb ik mijn pillen al genomen?'],
        action: 'NAVIGATE_MIJN_PILLEN'
      },
      {
        intentNl: 'navigeer_vandaag',
        examplePhrases: ['wat staat er vandaag op het programma?', 'vandaag', 'mijn dag'],
        action: 'NAVIGATE_VANDAAG'
      },
      {
        intentNl: 'navigeer_familie',
        examplePhrases: ['familie', 'berichten', 'heeft iemand geschreven?'],
        action: 'NAVIGATE_FAMILIE'
      },
      {
        intentNl: 'crisis',
        examplePhrases: ['ik voel me niet goed', 'help', 'ik ben bang', 'ik ben gevallen'],
        action: 'TRIGGER_CRISIS_FLOW',
        confirmationRequired: false
      }
    ],
    distressPhrases: [
      'ik voel me niet goed',
      'help me',
      'ik ben gevallen',
      'ik ben bang',
      'bel een ambulance'
    ]
  },
  dataSources: [
    { key: 'pending_medications', table: 'medication_reminders', offlineCacheTtlSeconds: 300 },
    { key: 'pending_tasks', table: 'tasks', offlineCacheTtlSeconds: 600 },
    { key: 'unread_messages', table: 'family_messages', offlineCacheTtlSeconds: 120 }
  ]
};
4.2 MIJN_PILLEN (My Pills)
TypeScript

export const MIJN_PILLEN_SCHEMA: ScreenSchema = {
  screenId: 'MIJN_PILLEN',
  titleNl: 'Mijn Pillen',
  accessibilityLabel: 'Overzicht van uw medicijnen voor vandaag',
  layout: 'single_column',
  themeVariant: 'default',
  headerVariant: 'title',
  depthFromHome: 1,
  maxPrimaryItems: 4,
  contentBlocks: [
    {
      id: 'medication_list',
      type: 'medication_card',
      accessibilityLabel: 'Uw medicijnen voor vandaag',
      props: {
        groupBy: 'scheduled_time',
        showStatus: true,
        showInstructions: true,
        maxVisible: 4
      }
    }
  ],
  bottomActions: [
    {
      id: 'confirm_taken',
      labelNl: 'Ingenomen',
      icon: 'check',
      action: 'CONFIRM_MEDICATION_TAKEN',
      voiceAlias: ['ingenomen', 'ik heb mijn pillen genomen', 'klaar'],
      accessibilityLabel: 'Bevestig dat u uw medicijnen heeft ingenomen',
      style: 'primary'
    },
    {
      id: 'remind_later',
      labelNl: 'Straks',
      icon: 'clock',
      action: 'SNOOZE_MEDICATION',
      voiceAlias: ['straks', 'later', 'herinner me over tien minuten'],
      accessibilityLabel: 'Herinner mij later aan mijn medicijnen',
      style: 'secondary'
    }
  ],
  persistentElements: {
    emergencyButton: true,
    voiceButton: true,
    haloStatus: false,
    backButton: true
  },
  voice: {
    entrySpeak: 'Dit zijn uw medicijnen voor vandaag.',
    fallbackSpeak: 'Zegt u "ingenomen" als u klaar bent.',
    commands: [
      {
        intentNl: 'bevestig_ingenomen',
        examplePhrases: ['ingenomen', 'ik heb ze genomen', 'klaar', 'gedaan'],
        action: 'CONFIRM_MEDICATION_TAKEN'
      },
      {
        intentNl: 'snoeze_herinnering',
        examplePhrases: ['straks', 'later', 'over tien minuten'],
        action: 'SNOOZE_MEDICATION'
      },
      {
        intentNl: 'vraag_instructies',
        examplePhrases: ['waarvoor is dit?', 'wat doet dit medicijn?', 'uitleg'],
        action: 'EXPLAIN_MEDICATION'
      }
    ],
    distressPhrases: ['ik voel me ziek', 'ik ben misselijk', 'bijwerking']
  },
  dataSources: [
    { key: 'todays_medications', table: 'medication_reminders', offlineCacheTtlSeconds: 300 },
    { key: 'medications_detail', table: 'medications', offlineCacheTtlSeconds: 3600 }
  ]
};
4.3 SCHILD_ROOD (Scam Alert — Red)
TypeScript

export const SCHILD_ROOD_SCHEMA: ScreenSchema = {
  screenId: 'SCHILD_ROOD',
  titleNl: 'Let Op',
  accessibilityLabel: 'Veiligheidswaarschuwing — mogelijke oplichting',
  layout: 'full_screen_overlay',
  themeVariant: 'schild_rood',
  headerVariant: 'minimal',
  depthFromHome: 1,
  maxPrimaryItems: 2,
  contentBlocks: [
    {
      id: 'alert_banner_rood',
      type: 'alert_banner',
      accessibilityLabel: 'Mogelijke oplichting gedetecteerd',
      props: {
        level: 'rood',
        iconName: 'shield-alert',
        headingNl: 'Pas op',
        bodyNl: 'Dit gesprek lijkt verdacht. U hoeft geen geld over te maken of uw codes te geven.'
      }
    }
  ],
  bottomActions: [
    {
      id: 'stop_gesprek',
      labelNl: 'Verbreek verbinding',
      icon: 'phone-off',
      action: 'END_CALL_FLAGGED',
      voiceAlias: ['ophangen', 'verbinding verbreken', 'stop'],
      accessibilityLabel: 'Verbreek de verdachte verbinding',
      style: 'danger'
    },
    {
      id: 'ik_vertrouw_dit',
      labelNl: 'Ik vertrouw dit',
      icon: 'check-circle',
      action: 'DISMISS_SCAM_ALERT',
      voiceAlias: ['ik vertrouw dit', 'dit is goed'],
      accessibilityLabel: 'Markeer dit gesprek als betrouwbaar',
      confirmationRequired: true,
      style: 'secondary'
    }
  ],
  persistentElements: {
    emergencyButton: true,
    voiceButton: true,
    haloStatus: false,
    backButton: false                // no back on a ROOD alert
  },
  voice: {
    entrySpeak: 'Pas op. Dit gesprek lijkt verdacht. U hoeft nooit uw pincode te geven.',
    fallbackSpeak: 'Zeg "ophangen" als u wilt stoppen.',
    commands: [
      {
        intentNl: 'verbreek_verbinding',
        examplePhrases: ['ophangen', 'stop', 'weg'],
        action: 'END_CALL_FLAGGED'
      }
    ],
    distressPhrases: ['ik ben bang', 'help', 'ze bedreigen me']
  },
  dataSources: [
    { key: 'scam_event', table: 'scam_events', offlineCacheTtlSeconds: 0 }
  ]
};
5. Screen Renderer Architecture
TypeScript

// components/ScreenRenderer.tsx

import React, { useEffect } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import { ScreenSchema } from '../types/screen-schema';
import { useScreenData } from '../hooks/useScreenData';
import { useVoiceEngine } from '../hooks/useVoiceEngine';
import { renderBlock } from './blocks';
import { EmergencyButton } from './EmergencyButton';
import { VoiceButton } from './VoiceButton';

interface Props {
  schema: ScreenSchema;
}

export const ScreenRenderer: React.FC<Props> = ({ schema }) => {
  const { data, loading, offline } = useScreenData(schema.dataSources);
  const { bootVoice, speak } = useVoiceEngine(schema.voice);

  useEffect(() => {
    bootVoice();
    speak(schema.voice.entrySpeak);
    AccessibilityInfo.announceForAccessibility(schema.accessibilityLabel);
  }, [schema.screenId]);

  const resolvedBlocks = schema.contentBlocks.map(block => ({
    ...block,
    data: data[block.id] ?? null,
  }));

  return (
    <View
      accessible={true}
      accessibilityLabel={schema.accessibilityLabel}
      style={[styles.container, themeStyles[schema.themeVariant]]}
    >
      {resolvedBlocks.map(block => renderBlock(block, offline))}

      {schema.persistentElements.emergencyButton && (
        <EmergencyButton accessibilityLabel="Noodknop — bel 112 of stuur bericht naar familie" />
      )}

      {schema.persistentElements.voiceButton && (
        <VoiceButton voiceSchema={schema.voice} />
      )}
    </View>
  );
};
6. CI Schema Test Suite (UX Constitution Enforcement)
TypeScript

// __tests__/schema-constitution.test.ts

import { SCREEN_REGISTRY } from '../schema/registry';

const BANNED_WORDS_NL = [
  'fout', 'mislukt', 'waarschuwing', 'gevaar', 'ongeldig',
  'fout opgetreden', 'als een ai', 'als ai'
];

describe('HAVEN UX Constitution', () => {

  Object.entries(SCREEN_REGISTRY).forEach(([screenId, schema]) => {

    describe(`Screen: ${screenId}`, () => {

      it('depth from home must be ≤ 2', () => {
        expect(schema.depthFromHome).toBeLessThanOrEqual(2);
      });

      it('bottom actions must be ≤ 2', () => {
        expect(schema.bottomActions.length).toBeLessThanOrEqual(2);
      });

      it('max primary items must be ≤ 4', () => {
        expect(schema.maxPrimaryItems).toBeLessThanOrEqual(4);
      });

      it('all content blocks must have unique IDs', () => {
        const ids = schema.contentBlocks.map(b => b.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('all content blocks must have accessibility labels', () => {
        schema.contentBlocks.forEach(block => {
          expect(block.accessibilityLabel).toBeTruthy();
          expect(block.accessibilityLabel.length).toBeGreaterThan(0);
        });
      });

      it('voice fallback must exist and be ≤ 15 words', () => {
        const wordCount = schema.voice.fallbackSpeak.split(' ').length;
        expect(wordCount).toBeLessThanOrEqual(15);
      });

      it('every data source must define offlineCacheTtlSeconds', () => {
        schema.dataSources.forEach(ds => {
          expect(ds.offlineCacheTtlSeconds).toBeDefined();
          expect(typeof ds.offlineCacheTtlSeconds).toBe('number');
        });
      });

      it('emergency button must be present (except modals)', () => {
        if (schema.layout !== 'full_screen_overlay') {
          expect(schema.persistentElements.emergencyButton).toBe(true);
        }
      });

      it('must not contain banned Dutch words in any text', () => {
        const isShieldScreen = screenId.startsWith('SCHILD');
        const allText = JSON.stringify(schema).toLowerCase();

        BANNED_WORDS_NL.forEach(word => {
          if (word === 'nooit' && isShieldScreen) return; // SCHILD exception
          expect(allText).not.toContain(word);
        });
      });

      it('all bottom actions must have voice aliases', () => {
        schema.bottomActions.forEach(action => {
          expect(action.voiceAlias).toBeDefined();
          expect(action.voiceAlias!.length).toBeGreaterThan(0);
        });
      });

      it('distress phrases must be defined on all screens', () => {
        expect(schema.voice.distressPhrases.length).toBeGreaterThan(0);
      });

    });
  });
});
7. Accessibility
Standard	Requirement
WCAG 2.1 Level AA	Minimum compliance for all screens
WCAG 2.1 Level AAA	Target for primary text and primary actions
Touch targets	Minimum 56×56dp (exceeds WCAG 44×44px)
Font sizes	Body: 18sp minimum; Primary actions: 24sp minimum; Headers: 32sp minimum
Font scaling	Respect system font scale up to 200%; layouts tested at 150% and 200%
Screen reader	Full VoiceOver (iOS) and TalkBack (Android) support; all interactive elements labelled
Colour	Never use colour as the only differentiator; always pair with icon + text
High contrast mode	Supported via high_contrast profile flag; all themes have high-contrast variants
Haptics	All confirmations have haptic feedback; all alerts have a distinct haptic pattern
Audio alerts	All alerts have a voice equivalent; visual-only alerts are never used alone
Document 08 — Family Dashboard Specification
1. Overview
The family dashboard is a Next.js 14 (App Router) web application hosted on Vercel (EU region). It is the primary interface for family members (mantelzorgers) to stay connected with their elder, monitor wellbeing, and respond to alerts.

The dashboard is role-aware — what a primary family member sees differs from a secondary family member, based on the permissions granted in family_relationships.

2. Screen Inventory
Screen	Route	Access	Description
Login	/inloggen	Public	Email/password login
Dashboard Home	/dashboard	Family	Overview: halo, alerts, quick actions
Alerts	/dashboard/meldingen	Family	All scam alerts, medication misses, zone exits
Alert Detail	/dashboard/meldingen/[id]	Family	Full scam event details + pipeline scores
Medications	/dashboard/medicijnen	Family (can_view_medications)	Today's status + history
Messages	/dashboard/berichten	Family (can_view_messages)	Send/read family messages
Stories	/dashboard/verhalen	Family (can_view_stories)	Life story archive (read-only)
Wellness	/dashboard/welzijn	Family (can_view_wellness)	Wellness trends + check-in history
Location	/dashboard/locatie	Family (can_view_location)	Fuzzed map: safe zone + last known area
Weekly Digest	/dashboard/overzicht	Family	Weekly safety + wellbeing summary
Elder Profile	/dashboard/profiel	Primary family only	Edit elder profile, manage permissions
Medications Setup	/dashboard/medicijnen/beheren	Primary + can_manage_medications	Add/edit medications
Safe Zone Setup	/dashboard/locatie/zone	Primary + can_manage_safe_zone	Edit safe zone on map
Settings	/dashboard/instellingen	Family	Notification preferences, account
3. Halo Status Component
The halo is the primary "how is mum/dad doing today" indicator on the dashboard home. It maps to the same three-axis model in the elder app.

Axis	Colour	Logic
Pillen (green/amber/red)	Green	All medications taken today
Amber	Some missed; not yet escalated
Red	Escalated; family notification sent
Veiligheid (green/amber/red)	Green	No scam events in 7 days
Amber	Amber scam event in last 24h
Red	Rood or Zwart event in last 24h
Familie (green/amber/grey)	Green	Message exchanged in last 48h
Grey	No family interaction in 7+ days
4. Real-time Alert Experience
When an alert arrives:

Browser push notification (if tab not active)
In-app toast notification (if tab active): Supabase Realtime subscription
Dashboard halo status updates live
Alert appears at top of /dashboard/meldingen
Alert tone by level:

Level	Visual	Sound	Action Required
Amber	Soft orange banner	Gentle chime	No — informational
Rood	Orange/red card, pulse animation	Alert tone	Yes — review recommended
Zwart	Full-screen intercept overlay	Urgent tone	Yes — immediate review required
5. Permission-Scoped Views
The dashboard checks family_relationships permissions on every sensitive page via Next.js middleware:

TypeScript

// middleware.ts (simplified)
export async function middleware(request: NextRequest) {
  const { session } = await getSession(request);
  const { data: relationship } = await supabase
    .from('family_relationships')
    .select('*')
    .eq('family_member_id', session.user.id)
    .single();

  const PERMISSION_MAP: Record<string, keyof FamilyRelationship> = {
    '/dashboard/medicijnen': 'can_view_medications',
    '/dashboard/locatie': 'can_view_location',
    '/dashboard/verhalen': 'can_view_stories',
    '/dashboard/welzijn': 'can_view_wellness',
  };

  const requiredPermission = PERMISSION_MAP[request.nextUrl.pathname];
  if (requiredPermission && !relationship[requiredPermission]) {
    return NextResponse.redirect(new URL('/dashboard/geen-toegang', request.url));
  }
}
6. Location Map (Fuzzed Privacy Model)
The location screen shows:

Elder's safe zone as a circle on a Dutch map (Mapbox/OpenStreetMap, OSM preferred for EU data residency)
Last known neighbourhood-level fuzzed position (100m+ noise applied before storage)
Safe zone exit events (time of exit, time of return — no route shown)
The map never shows:

Precise GPS coordinates
Route history
Real-time tracking
This is enforced at:

Database level (fuzzed geometry stored; precise auto-deleted after 24h)
API level (PostgREST view masks location_precise column for family role)
UI level (map component only accepts fuzzed coordinates)
7. Family Message Composer
Supported message types (matching family_messages schema):

Type	UI	Elder App Display
Tekst	Text input (max 280 chars, large font preview)	Voice-read aloud by HAVEN
Voice note	Browser mic recording (max 60s)	Playable audio card
Foto	Image upload (max 10MB, HEIC supported)	Full-screen photo
Video hallo	Browser camera recording (max 60s)	Auto-plays once on open
Tekening	Simple canvas (finger/mouse drawing)	Displayed as image
8. Weekly Digest View
The weekly digest (/dashboard/overzicht) renders the safety_digests table record for the current week:

text

┌─────────────────────────────────────────────┐
│ Week van 2 juni 2026                        │
├────────────────────┬────────────────────────┤
│ Veiligheid         │ 2 amber meldingen      │
│                    │ 0 rood/zwart            │
├────────────────────┼────────────────────────┤
│ Medicijnen         │ 94% ingenomen          │
│                    │ 2x gemist (dinsdag)    │
├────────────────────┼────────────────────────┤
│ Welzijn (gem.)     │ Humeur: 4.1/5          │
│                    │ Energie: 3.8/5         │
├────────────────────┼────────────────────────┤
│ Familie contact    │ 6 berichten gewisseld  │
└────────────────────┴────────────────────────┘
Document 09 — Integrations Specification
1. Integration Inventory
Integration	Pillar	Phase	Type	Data Stored
OpenAI Whisper	STEM	MVP	STT API	Transcript text only; audio not retained by OpenAI
OpenAI Embeddings	STEM + SCHILD + KRING	MVP	Embedding API	Embedding vectors in pgvector
ElevenLabs	STEM	MVP	TTS API	No data stored; audio streamed and ephemeral
Expo Push (APNs/FCM)	All	MVP	Push API	Push tokens only
Tink / Gocardless	SCHILD	Phase 2	PSD2 AISP	Masked transaction metadata only
MedMij / PGO	ANKER	Phase 2	FHIR R4	Medication and appointment data
Call reputation service	SCHILD	Phase 2	Reputation API	Cached score + source (phone hashed)
OpenStreetMap / Mapbox	KOMPAS	MVP	Tile API	No personal data
ANBO / KBO-PCOB	KRING	Phase 3	Event feed	Community event metadata
2. OpenAI Whisper
Purpose: Dutch STT for voice interactions Endpoint: POST https://api.openai.com/v1/audio/transcriptions Model: whisper-1

Request (from fn-voice-pipeline):

text

Content-Type: multipart/form-data
file: <audio file, 16kHz mono WAV, max 25MB>
model: whisper-1
language: nl
response_format: json
Response:

JSON

{ "text": "Ik heb mijn pillen al ingenomen." }
Error handling:

429 Rate limit: retry with exponential backoff (3 retries max)
400 Audio too short (< 0.1s): return empty transcript, trigger fallback voice prompt
500: return fallback voice prompt ("Kunt u dat herhalen?")
Data governance:

Audio is sent to OpenAI and not stored after transcription (per OpenAI DPA)
OpenAI DPA signed and on file
Transcript (text only) is stored in voice_interactions
3. OpenAI Embeddings
Purpose: Companion memory similarity, scam event pattern matching, story retrieval Endpoint: POST https://api.openai.com/v1/embeddings Model: text-embedding-3-small Dimensions: 1536

Request:

JSON

{
  "model": "text-embedding-3-small",
  "input": "Ik houd van mijn kleinkinderen Sofia en Tim.",
  "dimensions": 1536
}
Response:

JSON

{
  "data": [{ "embedding": [...], "index": 0 }],
  "usage": { "prompt_tokens": 14, "total_tokens": 14 }
}
Usage limits:

Called for every voice interaction (companion memory upsert)
Called for every scam event (similarity search)
Called for every life story transcription
Estimated: ~500 tokens/elder/day → ~15k tokens/month/elder
Batched where possible (max 2048 inputs per request)
4. ElevenLabs TTS
Purpose: nl-NL voice output for STEM companion Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream Voice: Custom nl-NL voice "Hanna" (voice_id stored in Supabase Vault)

Request:

JSON

{
  "text": "Goedemorgen! U heeft vandaag twee medicijnen om negen uur.",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.75,
    "similarity_boost": 0.85,
    "style": 0.3,
    "use_speaker_boost": true
  }
}
Response: Audio stream (MP3); streamed to client for low-latency first-byte delivery.

Storage: Audio is NOT stored permanently. The stream is played directly on the device. For offline fallback (Phase 2), a limited set of pre-generated phrases are cached locally.

Failure mode: If ElevenLabs is unavailable, fall back to expo-speech (device TTS) with language: nl-NL. Quality degrades but functionality is maintained.

5. Expo Push Notifications
Purpose: Alert family and elders of medication misses, scam events, family messages Service: Expo Push API → routes to APNs (iOS) or FCM (Android)

Token registration:

TypeScript

// On app launch (after permission granted)
const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig.extra.eas.projectId
});
await supabase.from('push_tokens').upsert({
  profile_id: session.user.id,
  token: token.data,
  platform: Platform.OS,
  active: true
});
Sending (from fn-notification-dispatch):

TypeScript

await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: pushToken,
    title: titleNl,
    body: bodyNl,
    data: extraData,
    priority: priority === 'high' ? 'high' : 'normal',
    sound: priority === 'high' ? 'default' : null,
    badge: 1
  })
});
Consent: Notification permission requested with Dutch explanation. Elder can opt out per notification type in settings.

6. PSD2 / Tink — Banking Integration (Phase 2)
Purpose: Read-only access to Dutch bank accounts for transaction anomaly detection Provider target: Tink (EU-licensed AISP) or Gocardless Banks supported (NL): ING, Rabobank, ABN AMRO, SNS, Triodos

Consent flow:

Elder (or primary family with explicit consent) initiates in-app
HAVEN redirects to Tink OAuth flow
Elder selects their bank and authenticates (strong customer authentication — bank's own)
Tink returns access token → stored encrypted in Supabase Vault (not in DB)
financial_accounts record created (masked account details only)
Data received and stored:

Account identifier: masked (last 4 digits of IBAN only)
Bank name
Transaction date, amount (cents, EUR), counterparty name, description
NO full IBAN, NO full account number, NO authentication credentials
Anomaly scoring:

Large unusual amounts (> 3 standard deviations from 90-day average)
New counterparty + large amount
Multiple small transactions to same new counterparty ("structuring")
Transaction to counterparty flagged in phone_reputation_cache
PSD2 legal basis: AVG Article 6(1)(a) explicit consent + PSD2 Article 67 (AISP access rights)

7. MedMij / PGO — Health Records (Phase 2)
Purpose: Import medication history and GP correspondence from Dutch personal health record Standard: MedMij Afsprakenstelsel v2.x; FHIR R4

Prerequisites:

HAVEN must obtain MedMij toelating (accreditation) — initiate 6 months before Phase 2 launch
Elder must have a DigiD (required for MedMij authentication)
Elder must have a PGO account (or HAVEN creates one as a PGO participant)
Data imported:

MedicationRequest (FHIR R4): maps to medications table
Appointment (FHIR R4): maps to tasks (huisarts appointments)
AllergyIntolerance (FHIR R4): maps to elder_profiles.allergies
FHIR R4 resource mapping (medications example):

text

MedicationRequest.medicationCodeableConcept.text → medications.name_nl
MedicationRequest.dosageInstruction[0].text → medications.dose_description_nl
MedicationRequest.dosageInstruction[0].timing → medications.frequency + schedule_times
MedicationRequest.medication.code (G-Standaard) → medications.g_standaard_code
8. Call Reputation Service (Phase 2)
Purpose: Look up reputation score for incoming phone numbers in the SCHILD pipeline Target providers (NL-specific):

Fraudehelpdesk API (if public API available) — Dutch fraud reports database
Truecaller API — global call reputation
Marktplaats Veiligheidsteam data sharing (partnership)
Request:

TypeScript

const score = await lookupPhoneReputation(hashedPhone);
// Returns: { score: 0–100, reportCount: number, source: string }
Caching: Results cached in phone_reputation_cache for 7 days. Cache-first always — no live lookup during an active call (latency constraints).

Document 10 — Testing & Observability
1. Testing Strategy
1.1 Philosophy
Testing in HAVEN must validate not only correctness but tone, cognitive load, and dignity. The UX constitution tests (Document 07) are first-class tests — not lint rules.

1.2 Test Pyramid
text

         ┌────────────────────────┐
         │     E2E Tests          │  ← Maestro (iOS) + Playwright (web)
         │  (Critical user flows) │    ~20 flows
         ├────────────────────────┤
         │   Integration Tests    │  ← Supabase local + Edge Function tests
         │  (API + DB contracts)  │    ~80 tests
         ├────────────────────────┤
         │      Unit Tests        │  ← Jest + React Native Testing Library
         │  (Components + logic)  │    ~200 tests
         ├────────────────────────┤
         │  Schema Constitution   │  ← Jest (Document 07, Section 6)
         │     Tests (CI gate)    │    ~10 rules × N screens
         └────────────────────────┘
1.3 Unit Tests
Framework: Jest + React Native Testing Library Coverage target: 80% line coverage on business logic; 70% on UI components

Key areas:

Intent classifier (Dutch phrase → intent mapping)
Medication escalation state machine logic
Scam composite score calculation
Screen schema type validation
Notification dispatch logic
Date/time utilities (Europe/Amsterdam timezone handling)
Dutch number/currency formatting (€ EUR, commas not dots)
1.4 Integration Tests
Framework: Jest + Supabase local (supabase start) Approach: Each Edge Function has a corresponding integration test that:

Seeds the local Supabase DB with fixture data
Calls the Edge Function with test input
Asserts the expected DB state changes + return values
TypeScript

// __tests__/integration/fn-medication-escalation.test.ts
describe('fn-medication-escalation', () => {
  it('escalates a reminder after 30 minutes with no response', async () => {
    // Seed: create a reminder in 'gesnoozed_2' state, 35 minutes ago
    await seedMedicationReminder({ status: 'gesnoozed_2', scheduledAgo: 35 });

    // Run the function
    await invoke('fn-medication-escalation');

    // Assert: status updated to 'geëscaleerd', family notification created
    const reminder = await getReminder();
    expect(reminder.status).toBe('geëscaleerd');
    const notification = await getLatestNotification();
    expect(notification.notification_type).toBe('medicijn_gemist');
  });
});
RLS integration tests:

TypeScript

describe('RLS: family cannot see companion_memory', () => {
  it('returns empty result for family role', async () => {
    const familyClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${familyJwt}` } }
    });
    const { data, error } = await familyClient
      .from('companion_memory')
      .select('*');
    expect(data).toHaveLength(0); // RLS blocks all rows
  });
});
1.5 E2E Tests
Framework:

Elder app (iOS): Maestro
Family dashboard (web): Playwright
Critical flows tested (E2E):

Flow	Tool	Priority
Elder onboarding (family sets up → elder activates)	Maestro	P0
Medication reminder → confirmation	Maestro	P0
Medication reminder → escalation to family	Maestro + Playwright	P0
Scam amber alert → elder dismisses	Maestro	P0
Scam rood alert → family notified	Maestro + Playwright	P0
Voice command: "Ik heb mijn pillen genomen"	Maestro	P0
Crisis phrase: "Ik ben gevallen" → family notified	Maestro + Playwright	P0
Safe zone exit → family dashboard alert	Maestro + Playwright	P1
Family sends voice note → elder receives	Maestro + Playwright	P1
Life story recording → transcript	Maestro	P1
Weekly digest generation → family email	Playwright	P1
Elder consent withdrawal → family loses access	Maestro + Playwright	P0
Maestro example (medication confirmation):

YAML

# flows/medication-confirmation.yaml
appId: nl.haven.elder
---
- launchApp
- waitForAnimationToEnd
- assertVisible: "Mijn Pillen"
- tapOn: "Mijn Pillen"
- assertVisible: "Metformine 500mg"
- tapOn: "Ingenomen"
- assertVisible: "Goed gedaan"
- assertNotVisible: "Ingenomen" # button should be gone post-confirmation
1.6 Accessibility Testing
Test	Tool	Standard
Colour contrast	Automated: axe-core (web), Accessibility Scanner (Android)	WCAG 2.1 AA
Touch target sizes	Manual + automated UI test assertions	WCAG 2.5.5 (56×56dp)
Screen reader flow (VoiceOver)	Manual testing protocol — every screen	WCAG 4.1.2
Screen reader flow (TalkBack)	Manual testing protocol — every screen	WCAG 4.1.2
Font scaling (200%)	Automated snapshot tests	WCAG 1.4.4
Keyboard navigation (web dashboard)	Playwright keyboard navigation tests	WCAG 2.1.1
1.7 Test Data & Fixtures
No real elder personal data is ever used in tests
Fixture data is entirely synthetic: generated Dutch names (Jan de Vries, Maria Bakker), synthetic BSN numbers (format-valid but not real)
Synthetic voice audio for Whisper testing: recorded by team members reading Dutch test phrases
Test Supabase project (separate from production): haven-test.supabase.co
2. Observability
2.1 Structured Logging
All Edge Functions emit structured JSON logs:

JSON

{
  "timestamp": "2026-06-10T08:32:11.234Z",
  "level": "info",
  "function": "fn-voice-pipeline",
  "elder_id_hash": "sha256:abc123...",  // hashed — never raw UUID in logs
  "intent": "bevestig_ingenomen",
  "duration_ms": 847,
  "whisper_tokens": 12,
  "elevenlabs_chars": 48,
  "action_taken": "CONFIRM_MEDICATION_TAKEN",
  "distress_detected": false
}
Note: elder_id is always SHA-256 hashed in logs. Never log raw personal data.

Log aggregation: Supabase log drain → AWS CloudWatch Logs (eu-central-1) → Datadog (EU region).

2.2 Error Tracking
Tool: Sentry (EU data residency — o0.ingest.sentry.io EU endpoint) Elder app: @sentry/react-native Family dashboard: @sentry/nextjs

Privacy in Sentry:

PII scrubbing enabled (Sentry data scrubber)
Elder IDs are hashed before being set as Sentry user context
No personal data in error messages (enforced via code review + Sentry scrubbing rules)
2.3 SLOs (Service Level Objectives)
Service	SLO	Measurement
Elder app availability	99.5% uptime	Supabase uptime + Expo availability
Voice pipeline latency (p95)	< 3 seconds end-to-end	CloudWatch metric: fn-voice-pipeline.duration_ms
Voice pipeline latency (p99)	< 6 seconds	CloudWatch metric
Medication escalation correctness	99.9% of due reminders processed within 15 minutes	pg_cron job success rate
Scam event processing latency (p95)	< 5 seconds	CloudWatch metric: fn-scam-pipeline.duration_ms
Family dashboard availability	99.9% uptime	Vercel uptime monitoring
Push notification delivery (p95)	< 30 seconds	Expo Push receipt checking
Crisis alert to family (p99)	< 60 seconds	Custom metric: crisis detection → notification sent
SLO breach alerting: PagerDuty (or equivalent) with on-call rotation. Alerts routed to engineering Slack channel #haven-ops.

2.4 Performance Budgets
Metric	Budget
Elder app cold start (iPhone SE 2022)	< 2.5 seconds to interactive
Elder app cold start (mid-range Android)	< 3.5 seconds to interactive
Home screen render (warm start)	< 500ms
Voice button to first audio byte	< 1.5 seconds (online)
Voice button to first audio byte	< 500ms (offline cached response)
Family dashboard LCP (desktop)	< 1.2 seconds
Family dashboard LCP (mobile)	< 2.0 seconds
Family dashboard FID	< 100ms
3. Cost Model
3.1 Assumptions (per 1,000 active elder users/month)
Service	Usage Estimate	Unit Cost	Monthly Cost
Supabase Pro	1 project	€25/month	€25
Supabase Compute	2× small instances	€15/month each	€30
Supabase Storage	~50GB (voice notes, photos)	€0.021/GB	~€1
OpenAI Whisper	1,000 elders × 10 voice interactions/day × 30 days × avg 5s = 1,500,000 seconds	$0.006/min = $0.0001/sec	~€900
OpenAI Embeddings	~15k tokens/elder/month × 1,000 = 15M tokens	$0.02/1M tokens	~€0.30
ElevenLabs	1,000 elders × 10 responses/day × 30 days × avg 50 chars = 15M chars	€0.30/1,000 chars (Creator plan)	~€4,500
Expo Push	1,000 elders
