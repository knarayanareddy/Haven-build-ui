# Haven-build

### Your Parent's Guardian. Your Peace of Mind.

**One app. One mission. Make aging feel safe, connected, and dignified.**

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built at Megathon](https://img.shields.io/badge/Built%20at-Megathon%202025-purple)](https://megathon.xyz)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react)](https://reactnative.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://typescriptlang.org)

[Overview](#-overview) · [The Crisis](#-the-crisis-in-numbers) · [Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [UI System](#-ui-design-system) · [Contributing](#-contributing)

</div>

---

## 📖 Overview

HAVEN is a **voice-first, elder-care companion platform** that unifies fraud protection, medication management, social connection, cognitive safety, and family peace-of-mind into a single, dignified experience.

It is built on a foundational belief: **the people who built everything we have deserve technology that works for them, not against them.**

HAVEN is not a monitoring app. It is not a tracker. It is a trusted companion — calm, warm, and always on the elder's side.

> *"A 5-year-old should be able to use it. A worried adult child should be able to trust it."*

---

## 🚨 The Crisis in Numbers

Three crises are currently treated as separate problems by five separate fragmented apps. HAVEN treats them as one.

### Fraud
| Metric | Figure |
|--------|--------|
| Internet-enabled fraud losses (60+, 2025) | **$7.748 billion** — up 59% YoY |
| AI-related fraud complaints (60+, 2025) | 3,143 complaints · **$352.5M in losses** |
| Estimated true cost of elder fraud (2024) | **$10.1B – $81.5B** (FTC, accounting for underreporting) |

### Loneliness
| Metric | Figure |
|--------|--------|
| Adults 65+ who are socially isolated | **1 in 4** |
| Increased mortality risk from isolation | **+30%** — equivalent to smoking 15 cigarettes/day |
| Increased dementia risk from isolation | **+50%** (CDC) |

### Medication
| Metric | Figure |
|--------|--------|
| Average medications taken by older adults | **6–8 daily** |
| Patients not taking medication as prescribed | **~50%** |
| Preventable deaths/hospitalisations annually | **~200,000** |

---

## ✨ Features

HAVEN is organised into **six pillars**, each addressing a distinct but interconnected dimension of elder wellbeing.

---

### 🔴 Pillar 1 — SHIELD: Fraud & Scam Protection

The always-on nervous system. Runs passively in the background — never in the way until it needs to be.

| Feature | Description |
|---------|-------------|
| **1.1 Real-Time Scam Intercept** | Every call, SMS, email, and web page scored in real-time through a 4-layer pipeline (heuristics → context → LLM → response) |
| **1.2 Safe Conversation Coach** | Silent on-screen card during flagged calls — shows safe responses, no sound, no panic |
| **1.3 Browser & App Shield** | Flags gift card checkouts, remote support downloads, fake government portals, and new domains |
| **1.4 Weekly Safety Digest** | Sunday summary for family — reassuring, not alarming; scams intercepted, safe activity, one conversation starter |
| **1.5 Document Vault** | AES-256 encrypted storage; sensitive legal documents trigger 24-hour cooling-off + family notification |
| **1.6 Phone Reputation Intercept** | Pre-answer screen with Hiya/Truecaller integration; real-time call transcription via Whisper streaming |
| **1.7 Financial Guardian Mode** | Optional read-only Open Banking (Plaid/TrueLayer); anomaly detection on transactions; configurable family alerts |
| **1.8 Digital Estate Planner** | Legacy account vault; "after I'm gone" document; annual review reminders |
| **1.9 Social Engineering Memory** | Longitudinal contact relationship graph; flags grooming escalation patterns across weeks |

**Alert levels — always calm, never alarming:**
🟡 AMBER Gentle glow + "This looks a little unusual. Want me to check?" 🔴 RED Full-screen soft overlay + explanation + silent family notification ⚫ BLACK Transaction intercept + "Before you send money — let's call family first"

text


---

### 💊 Pillar 2 — ANCHOR: Health, Medication & Daily Rhythm

| Feature | Description |
|---------|-------------|
| **2.1 Medication Companion** | OCR setup via photo (GPT-4o Vision); plain-English pill descriptions; warm voice reminders; escalation to family after 2 misses |
| **2.2 Daily Rhythm Board** | 30-second spoken daily brief; giant-text schedule card; max 3 items; no nested menus |
| **2.3 Voice Task Manager** | Natural language task creation ("Remind me to call the plumber tomorrow morning"); family-added tasks with attribution |
| **2.4 Wellness Check-In** | One-tap 😊/😐/😔 daily; family note after 3 consecutive "not great"; passive inactivity check-in |
| **2.5 Telehealth Integration** | One-tap NHS 111/Medicare access; pre-call medication brief; post-appointment medication reminders |
| **2.6 Transport Coordination** | Medical appointment detection; 24-hour transport prompt; family can pre-book from dashboard |
| **2.7 Hydration & Nutrition** | Gentle nudges every 3 hours; voice food log; flags to family on sustained poor nutrition |
| **2.8 GP/FHIR Integration** | Read-only HL7 FHIR R4 connection; automatic medication reconciliation when prescriptions change |
| **2.9 Vital Signs Companion** | Apple HealthKit / Google Health Connect; Bluetooth pairing for cuff/oximeter/glucometer; threshold alerts |

---

### 🤝 Pillar 3 — CIRCLE: Connection & Community

| Feature | Description |
|---------|-------------|
| **3.1 Neighbourhood Connector** | Privacy-first hyper-local matching; fuzzy location (neighbourhood-level only); interest tags; mutual opt-in before contact |
| **3.2 Family Bridge** | "Thinking of you" button; voice note threading; family dashboard with live status, messages, medication view |
| **3.3 Life Story Archive** | Weekly prompted memory recordings; Whisper transcription; 52 stories/year; printable memoir book |
| **3.4 Grandchildren Bridge** | Cartoon companion app for grandchildren; video hellos; artwork as daily wallpaper |
| **3.5 Community Event Aggregator** | Eventbrite + Age UK + AARP + council APIs; filtered for free, accessible, daytime, within radius |
| **3.6 Skill Exchange** | Elders offer skills to matched youth volunteers; dignity-preserving reverse mentoring |
| **3.7 Memory Lane** | Family-uploaded photos surfaced on anniversaries; memorial moments for deceased loved ones |

---

### 🧠 Pillar 4 — COMPASS: Cognitive Safety & Orientation

| Feature | Description |
|---------|-------------|
| **4.1 Cognitive Check-In** | Conversational, never clinical; daily orientation question; longitudinal pattern tracking; family alert on significant change |
| **4.2 Safe Return** | Configurable safe zone; gentle check-in on exit; 15-minute no-response → family alert; elder always knows it's on |
| **4.3 "What Was That?"** | Photo → GPT-4o Vision → 3-sentence plain-English summary; doctor questions for medical forms |
| **4.4 Grief Module** | Bereavement-adjusted voice tone for 30 days; curated resources (never pushed); sustained-decline family alert |
| **4.5 Emergency Medical Profile** | NFC tap for first responders; QR code on printed card; Apple Health / Google Health sync |
| **4.6 Night Safety Mode** | 11pm–7am passive monitoring; sudden movement + no-movement pattern → gentle ping → family alert |
| **4.7 Wandering Detection** | AirTag/Tile integration; smart home door sensor support (Matter/HomeKit/Google Home) |
| **4.8 Driving Safety Monitor** | Opt-in phone sensor pattern analysis; elder sees results first; family access only with elder consent |

---

### 🎙️ Pillar 5 — VOICE: The Companion

The most human part of HAVEN. Voice is not a tool here — it is the product.

| Feature | Description |
|---------|-------------|
| **5.1 Companion Mode** | Persistent memory LLM; "You mentioned your roses last week — how are they doing?"; daily conversation |
| **5.2 Multilingual Support** | Full UI + voice in 8 languages (Phase 1); dialect-aware STT; cultural sensitivity layer |
| **5.3 Offline Companion** | On-device LLM fallback (Phi-3 mini / Gemma 2B); queued sync; core features always available offline |
| **Crisis Detection** | Distress phrase detection → immediate family alert + warm crisis resource signpost |

---

### 🛡️ Pillar 6 — GUARDIAN: Professional Carer Layer

| Feature | Description |
|---------|-------------|
| **6.1 Carer Portal** | Separate role-scoped access; visit logs; medication administration records; handoff notes |
| **6.2 Care Plan Hub** | Document storage; plain-English summaries; care plan deviation flagging |
| **6.3 Safeguarding** | Incident reporting; pattern-based concern detection; one-tap anonymous referral; human-confirmed only |

---

## 🏗️ Architecture

### System Overview
┌──────────────────────────────────────────────────────────────────┐ │ HAVEN PLATFORM │ ├─────────────────────────┬────────────────────────────────────────┤ │ ELDER APP │ FAMILY DASHBOARD │ │ React Native │ Next.js 14 + Tailwind CSS │ │ iOS + Android │ Web (PWA) │ ├─────────────────────────┴────────────────────────────────────────┤ │ API GATEWAY │ │ Supabase Edge Functions │ ├──────────┬─────────────┬──────────────┬──────────────────────────┤ │ SHIELD │ ANCHOR │ CIRCLE │ COMPASS + VOICE │ │ Service │ Service │ Service │ Service │ ├──────────┴─────────────┴──────────────┴──────────────────────────┤ │ CORE SERVICES │ │ │ │ ┌──────────────┐ ┌─────────────┐ ┌───────────────────────┐ │ │ │ Voice Engine │ │ Scam AI │ │ Notification │ │ │ │ ElevenLabs │ │ Pipeline │ │ Orchestrator │ │ │ │ + Whisper │ │ (4-layer) │ │ (Expo Push) │ │ │ └──────────────┘ └─────────────┘ └───────────────────────┘ │ │ │ │ ┌──────────────┐ ┌─────────────┐ ┌───────────────────────┐ │ │ │ OCR Engine │ │ Location │ │ Story Archive │ │ │ │ GPT-4o Vision│ │ Service │ │ + Companion Memory │ │ │ └──────────────┘ └─────────────┘ └───────────────────────┘ │ ├──────────────────────────────────────────────────────────────────┤ │ Supabase │ │ PostgreSQL · pgvector · PostGIS · RLS · Auth · Storage · Edge │ └──────────────────────────────────────────────────────────────────┘

text


### Scam Detection Pipeline
Incoming Signal (call / SMS / email / web) │ ▼ ┌─────────────────────────┐ │ Layer 1: Heuristics │ < 5ms · On-device │ Regex · Phrase lists │ Urgency · Payment · Authority │ Domain age · Blocklist │ Isolation · Fear · Reward └────────────┬────────────┘ │ score > 0.15 ▼ ┌─────────────────────────┐ │ Layer 2: Context │ < 50ms │ Known contact graph? │ Active scam already? │ Previous interactions? │ Transaction in progress? └────────────┬────────────┘ │ score > 0.35 ▼ ┌─────────────────────────┐ │ Layer 3: LLM Reasoning │ < 200ms · GPT-4o / fine-tuned │ Full content analysis │ Plain-English explanation │ Confidence scoring │ Red flag extraction └────────────┬────────────┘ │ ▼ ┌─────────────────────────┐ │ Layer 4: Response │ │ Amber / Red / Black │ Alert level determined │ Voice alert generated │ Family notification queued │ Everything logged │ Receipt created └─────────────────────────┘

text


### Voice Interaction Pipeline
Elder speaks │ ▼ Whisper STT → transcript │ ▼ Intent Classifier ├── "I took it" → log medication adherence ├── "Remind me to..." → create task + TTS confirm ├── "I've been scammed" → crisis alert flow ├── "Tell my story" → archive recording ├── "When is my...?" → query → TTS response ├── "Not feeling well" → log + escalate if pattern └── Everything else → Companion LLM + memory │ ▼ Response generated │ ▼ ElevenLabs TTS → warm voice output

text


---

## 💻 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Elder App | React Native + Expo | Single codebase, iOS + Android, full accessibility |
| Family Dashboard | Next.js 14 + Tailwind CSS | Fast, real-time, server components |
| Database | Supabase (PostgreSQL) | RLS, real-time subscriptions, pgvector, PostGIS |
| Auth | Supabase Auth | Row-level security tied to identity |
| Voice TTS | ElevenLabs (hackathon) / Coqui (prod) | Warm, human-sounding voice is non-negotiable |
| Voice STT | OpenAI Whisper | Best accuracy for elder speech patterns |
| Scam AI | Fine-tuned + GPT-4o reasoning | Rules for speed, LLM for nuance |
| Document OCR | GPT-4o Vision | Prescription bottle + letter parsing |
| Medication DB | RxNorm (US) / SNOMED CT (UK) | Clinical accuracy |
| EHR Integration | HL7 FHIR R4 | GP prescription sync |
| Banking | Plaid (US) / TrueLayer (UK) | Read-only financial anomaly detection |
| Location | React Native Location + PostGIS | Fuzzy geofencing, privacy-preserving |
| Notifications | Supabase Edge + Expo Push | Reliable cross-platform delivery |
| Offline LLM | Phi-3 mini / Gemma 2B (quantised) | Core features without internet |
| Health | Apple HealthKit / Google Health Connect | Passive vital signs |

---

## 🗄️ Database Overview

35 tables across 6 domain areas. Full schema in [`/database/schema.sql`](database/schema.sql).
IDENTITY & AUTH SHIELD ANCHOR ───────────────── ────────────────────── ────────────────────── profiles scam_events medications elder_profiles contacts medication_reminders family_relationships domain_reputation_cache tasks carer_relationships phone_reputation_cache wellness_checkins documents vital_signs financial_accounts hydration_logs financial_transactions safety_digests

CIRCLE COMPASS GUARDIAN / SYSTEM ────────────────────── ────────────────────── ────────────────────── family_messages location_events carer_visit_logs life_story_prompts cognitive_checkins incidents life_stories driving_events legacy_accounts memory_lane_photos bereavement_events notifications elder_interests push_tokens neighbourhood_connections audit_log community_events event_interests skill_offerings

text


**Key architectural decisions:**
- **Row-Level Security on every table** — the elder owns their data; family see only what the elder has consented to share
- **pgvector** for semantic search across scam transcripts, life stories, and companion memory
- **PostGIS** for privacy-preserving fuzzy geofencing (neighbourhood-level, never address-level)
- **Soft deletes everywhere** — elder data is never hard-deleted
- **Immutable audit log** — INSERT-only, no UPDATE or DELETE, enforced by RLS

---

## 📱 UI Design System

### The UX Constitution (Non-Negotiables)

These are laws. Any feature that violates one must be redesigned until it doesn't.
✦ Zero Learning Curve If it needs a tutorial, it failed ✦ Voice First Primary interface is a calm, warm human voice ✦ Dignity Always HAVEN never patronises, never alarms unnecessarily ✦ Max 3 choices/screen Never overwhelm ✦ Max 2 taps to anything From Home to any action ✦ 72×72px tap targets Always — no exceptions ✦ 24px minimum text Never smaller, for any purpose ✦ No icon without label Every icon has visible text ✦ No swipe-only actions Everything has a visible tap alternative ✦ Help is always 1 tap The 🆘 button never disappears

text


### Design Identity

| Motif | Description |
|-------|-------------|
| **The HAVEN Halo** | Breathing status ring — green/amber/red — animates like breathing, never flashes |
| **Paper + Ink** | Soft off-white backgrounds, subtle grain, serif font for Life Stories |
| **One-Card Truth** | Each screen is one large card — one question, one answer |
| **Calm Motion** | Slow slide-up (500–800ms) for alerts. No pop/bounce. Premium, never template. |

### Design Tokens (Summary)

```typescript
// Minimum text size: 24px (body), 18px (absolute minimum)
// Minimum tap target: 72×72px
// Colour contrast: WCAG AAA (7:1 minimum)
// Max screen items: 3
// Max navigation depth: 2 from Home
// Alert animations: 500–800ms, slow ease — never startle

COLORS.brand.haven_blue    = '#1A4FBA'  // trust, calm
COLORS.status.safe         = '#16A34A'  // green
COLORS.status.amber        = '#F59E0B'  // amber
COLORS.status.red          = '#DC2626'  // red (alert, never alarm)
COLORS.bg.story            = '#FEFCE8'  // warm ivory for Life Stories
The Home Screen
text

┌─────────────────────────────────┐
│  Good Morning, Margaret  🌅     │
│  ● HAVEN is keeping you safe    │
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │    💊     │  │    📅     │  │
│  │ My Pills  │  │  Today    │  │
│  └───────────┘  └───────────┘  │
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │    👪     │  │    🆘     │  │
│  │  Family   │  │   Help    │  │
│  └───────────┘  └───────────┘  │
└─────────────────────────────────┘

4 buttons. That's it.
Schema-Driven UI
Every elder screen is defined as a ScreenSchema JSON object. The renderer reads it and produces a fully accessible screen. No ad-hoc screens. No ad-hoc navigation. If a screen needs to exist, it needs a schema first.

TypeScript

// Every screen declares its UX contract:
{
  screenId:        'ELDER_TODAY',
  maxPrimaryItems: 3,              // build test fails if exceeded
  layout:          'ONE_CARD',
  bottomActions:   [/* max 2 */],
  voice: {
    entrySpeak:    { template: "Here is your day..." },
    commands:      [{ utterances: ["what's today"], intent: "READ_DAILY_BRIEF" }],
    fallback:      { message: "Tap 'Hear my day' to hear today." }
  }
}
Build tests enforce the UX constitution in CI — 20+ schema compliance tests that fail the build on any violation.

🚀 Getting Started
Prerequisites
Bash

node >= 20.0.0
pnpm >= 9.0.0
expo-cli >= 6.0.0
supabase-cli >= 1.150.0
Repository Structure
text

haven/
├── apps/
│   ├── elder/              # React Native (Expo) — elder app
│   │   ├── schema/         # All screen schemas (JSON)
│   │   ├── renderer/       # ScreenRenderer + block renderers
│   │   ├── components/     # HButton, HText, HCard, HHalo...
│   │   ├── hooks/          # useVoiceEngine, useScreenData...
│   │   ├── stores/         # Zustand stores (shield, meds, family)
│   │   └── services/       # ShieldMonitor, VoiceService...
│   │
│   ├── family/             # Next.js — family dashboard (web)
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # Dashboard, ShieldView, MedView...
│   │   └── hooks/          # useElderData, useRealtimeAlerts...
│   │
│   └── grandchild/         # React Native — grandchild companion app
│
├── packages/
│   ├── schema/             # Shared TypeScript schema types
│   ├── ui/                 # Shared component tokens + primitives
│   ├── api/                # Supabase client + typed query helpers
│   └── ml/                 # Scam detection pipeline + dataset tools
│
├── database/
│   ├── schema.sql          # Full Postgres schema (35 tables)
│   ├── rls.sql             # Row-Level Security policies
│   ├── triggers.sql        # Audit log, wellness counters, document flags
│   ├── indexes.sql         # Performance indexes
│   └── seed.sql            # Dev seed data
│
├── supabase/
│   └── functions/          # Edge Functions
│       ├── scam-detector/  # Real-time scam analysis
│       ├── daily-digest/   # Weekly family digest generator
│       ├── med-reminder/   # Medication escalation scheduler
│       ├── wellness-alert/ # Wellness pattern monitor
│       └── story-archive/  # Life story transcription pipeline
│
├── ml/
│   ├── dataset/            # Scam detection training data
│   │   ├── schema.ts       # Dataset record type definitions
│   │   ├── templates/      # Synthetic generation templates
│   │   └── manifest.yaml   # Dataset versioning + governance
│   ├── heuristics/         # Rule-based classifier (on-device)
│   ├── fine-tuning/        # DistilBERT fine-tuning scripts
│   └── prompts/            # GPT-4o system prompts + few-shot
│
└── docs/
    ├── architecture.md
    ├── scam-detection.md
    ├── voice-design.md
    ├── accessibility.md
    └── ethics.md
Installation
1. Clone the repository

Bash

git clone https://github.com/your-org/haven.git
cd haven
pnpm install
2. Set up Supabase

Bash

# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase instance
supabase start

# Run migrations
supabase db push

# Seed development data
supabase db seed
3. Configure environment variables

Bash

# Copy environment template
cp apps/elder/.env.example apps/elder/.env.local
cp apps/family/.env.example apps/family/.env.local

# Required variables (see full list in .env.example):
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
ELEVENLABS_API_KEY=
OPENAI_API_KEY=
HIYA_API_KEY=
PLAID_CLIENT_ID=          # Optional: Financial Guardian
TRUELAYER_CLIENT_ID=      # Optional: Financial Guardian (UK)
4. Start the elder app

Bash

cd apps/elder
pnpm start

# iOS simulator
pnpm ios

# Android emulator
pnpm android
5. Start the family dashboard

Bash

cd apps/family
pnpm dev
# Open: http://localhost:3000
6. Run the test suite

Bash

# All tests (includes schema compliance)
pnpm test

# Schema compliance only (UX constitution enforcement)
pnpm test --filter schema

# E2E tests (Maestro)
pnpm test:e2e
🧪 Testing Strategy
Schema Compliance Tests (Mandatory, runs in CI)
Every screen schema is validated automatically:

text

✓ Navigation depth ≤ 2 from Home
✓ Max 2 bottom actions per screen
✓ maxPrimaryItems respected
✓ All blocks have blockId
✓ All interactive elements have accessibilityLabel
✓ Voice fallback always defined
✓ Fallback message ≤ 15 words
✓ No banned copy ("warning", "error", "failed", "critical"...)
✓ Emergency button on every non-help screen
✓ All data sources have offlineCacheTTL
Any violation fails the build. This is how simplicity is enforced in code, not just design.

Accessibility Tests
Bash

# Run WCAG AAA audit
pnpm a11y

# Minimum tap target enforcement (72×72px)
pnpm test:tap-targets

# Colour contrast (7:1 ratio)
pnpm test:contrast

# Screen reader compatibility
pnpm test:voiceover
The "5-Year-Old Test" (Manual QA Checklist)
Before any release:

 A first-time user can complete daily brief → take meds → message family without explanation
 No screen has more than 3 primary choices
 Every tap target passes 72×72px
 Help button is always visible without scrolling
 Voice misunderstanding never traps the user (tap fallback always available)
 Any high-stakes action introduces a calm pause moment
 Zero alarm sounds — only warm chimes and calm voice
🤖 Scam Detection
Dataset Composition
text

100,000 records total
├── 50,000 scam examples
│   ├── Government impersonation (IRS, SSA, HMRC)
│   ├── Bank impersonation
│   ├── Tech support
│   ├── Grandparent scam
│   ├── Romance/trust grooming
│   ├── Investment fraud
│   ├── Lottery/prize
│   └── Gift card / wire transfer demand
│
└── 50,000 benign examples (critical for false positive prevention)
    ├── Real bank communications
    ├── Real government letters (IRS, SSA, HMRC)
    ├── Legitimate healthcare communications
    ├── Real marketing/commercial
    └── Real family/friend messages
Model Architecture
text

On-device (< 5ms):   Rule-based heuristic classifier
                     Regex patterns · Phrase lists · Structural signals

Cloud (< 200ms):     Fine-tuned DistilBERT (semantic classification)
                     + GPT-4o reasoning layer (plain-English explanation)

False positive target: < 2%   (over-alerting destroys elder trust)
False negative target: < 10%  (accepted tradeoff for dignity preservation)
Ethics Commitment
text

✦ HAVEN never blocks anything automatically — it pauses and explains
✦ Agency is always preserved — the elder always has the final say
✦ Explanations are always warm, never alarming
✦ Over-triggering is treated as a product failure, not a safety feature
✦ All scam model decisions are auditable and explainable
✦ Bias audit conducted quarterly — results published in /docs/ethics.md
🔒 Privacy & Security
Principle	Implementation
Elder owns their data	Row-Level Security on every table — data is inaccessible without explicit elder consent
Family sees summaries, not surveillance	Family dashboard shows peace-of-mind summaries by default; raw logs require elder consent
Location is fuzzy by default	Neighbourhood-level only (PostGIS fuzzy radius), never address-level
Full opt-out	Every feature can be turned off by the elder — no dark patterns
Document encryption	AES-256-GCM for all vault documents; keys managed in Supabase Vault
Immutable audit log	Every data access logged; INSERT-only table; cannot be modified or deleted
No training on user data	Elder conversations and stories are never used to train models
GDPR / CCPA compliant	Right to deletion, data portability, consent records
Scammer isolation tactic counter	Silent family alerts are the critical backstop — the elder doesn't need to act for family to be informed
