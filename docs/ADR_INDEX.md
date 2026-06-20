# HAVEN ADR Index

The source design document contains the canonical ADRs. This index maps those decisions to implemented repository areas.

| ADR | Decision | Implementation |
|---|---|---|
| ADR-001 | Supabase primary backend | `supabase/` migrations/functions/config |
| ADR-002 | React Native + Expo elder app | `apps/elder` |
| ADR-003 | Next.js family dashboard | `apps/family` |
| ADR-004 | OpenAI Whisper STT | `_shared/ai.ts`, `fn-voice-pipeline` |
| ADR-005 | ElevenLabs TTS | `_shared/ai.ts`, `tts-cache` bucket |
| ADR-006 | pgvector | companion/scam/story embedding columns and HNSW indexes |
| ADR-007 | PostGIS fuzzy location | `location_events`, `insert_location_event`, TTL cleanup |
| ADR-008 | PSD2 phase 2 | `financial_accounts`, `fn-transaction-intercept` |
| ADR-009 | MedMij/FHIR phase 2 | `fhir_import_jobs`, `fn-medmij-fhir-import` |
| ADR-010 | text-embedding-3-small | `_shared/ai.ts`, `companion_memory` |
| ADR-011 | DigiD deferred | no DigiD auth implementation; BSN hard rule maintained |
