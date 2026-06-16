# 🗄️ Authoritative HAVEN Database Retention Roadmap (90-Table Rollout Plan)

Governed by GDPR Article 5(1)(e) (Storage Limitation), Dutch *Uitvoeringswet AVG* (UAVG), and **NEN 7510 / NEN 7512** healthcare archiving standards, transactional data must not reside in active online database systems indefinitely.

In accordance with our Red Team quality gates and long-term cloud scalability objectives, this authoritative document details the complete, prioritized retention policy roadmap for the remaining 90 domain tables, strictly grouped into three risk-derived operational execution batches. 

*Note: No automated database migrations or `pg_cron` schedules for these specific 90 tables sit active in the repository yet. They are explicitly scheduled for incremental rollout starting in the upcoming engineering sprint.*

---

## 🔴 BATCH 1: Highest Clinical, Medical & Financial GDPR Risk (Implement Next Sprint)

**Operational Focus:** Time-series tables storing un-obfuscated clinical incident notes, formal community nursing (*wijkverpleegkundige*) shift updates, raw third-party health flushes, sensitive interpersonal family messaging, spatial telematics, and interactive phishing sessions.

| Table | Batch | Retention Period | Regulatory Legal Basis | Method (`pg_cron`/partition) |
| :--- | :---: | :---: | :--- | :---: |
| `incidents` | Batch 1 | 20 Years | Statutory WGBO / *Wet Wkkgz* clinical calamity archiving norms | `pg_cron` scheduled nullification |
| `health_record_imports` | Batch 1 | 90 Days | Fully verified staging buffer / GDPR Art. 5(1)(e) | Partition Drop (`PARTITION BY RANGE`) |
| `carer_visit_logs` | Batch 1 | 20 Years | Statutory WGBO mandatory home care shift archiving limit | `pg_cron` scheduled sweeper |
| `scam_coaching_sessions` | Batch 1 | 2 Years | Statutory *Fraudehelpdesk* / forensic investigation baseline | `pg_cron` scheduled delete |
| `family_messages` | Batch 1 | 1 Year | Interpersonal messaging privacy / GDPR Art. 17 Right to Erasure | Partition Drop (`PARTITION BY RANGE`) |
| `driving_events` | Batch 1 | 90 Days | Highly sensitive spatial telematics / UAVG tracking norms | Partition Drop (`PARTITION BY RANGE`) |
| `financial_transactions` | Batch 1 | 7 Years | Dutch absolute financial archiving norm (*Archiefwet* / *Belastingdienst*) | `pg_cron` scheduled sweeper |
| `carer_handover_notes` | Batch 1 | 20 Years | Statutory WGBO home care shift observation immutability | `pg_cron` scheduled sweeper |
| `clinical_record_corrections` | Batch 1 | 20 Years | NEN 7510 non-repudiable pre-image clinical revision proof | `pg_cron` scheduled sweeper |
| `medication_reminders` | Batch 1 | 20 Years | WGBO Medical Administration Record (MAR-light) historical ledger | Partition Drop (`PARTITION BY RANGE`) |
| `medication_ocr_jobs` | Batch 1 | 90 Days | Ephemeral CV vision parsing cache / Storage minimization | Partition Drop (`PARTITION BY RANGE`) |
| `medication_ocr_reviews` | Batch 1 | 20 Years | NEN 7510 non-repudiable multi-stakeholder DPO verification proof | `pg_cron` scheduled sweeper |
| `medication_interaction_alerts` | Batch 1 | 20 Years | NEN 7510 lethal drug combination override accountability | `pg_cron` scheduled sweeper |
| `video_call_sessions` | Batch 1 | 30 Days | Ephemeral WebRTC video conference metadata ledgers | Partition Drop (`PARTITION BY RANGE`) |
| `telehealth_sessions` | Batch 1 | 20 Years | Statutory WGBO formal telehealth clinical session log | `pg_cron` scheduled sweeper |
| `cognitive_checkins` | Batch 1 | 20 Years | WGBO longitudinal orientation health baselines | `pg_cron` scheduled sweeper |
| `wellness_checkins` | Batch 1 | 20 Years | WGBO daily interactive mood and physical energy baselines | `pg_cron` scheduled sweeper |
| `hydration_logs` & `nutrition_logs`| Batch 1 | 20 Years | WGBO daily caloric and liquid intake clinical tracking | `pg_cron` scheduled sweeper |
| `safeguarding_reports` | Batch 1 | 20 Years | Mandatory Dutch domestic violence and child safeguarding tracking (*Meldcode*) | `pg_cron` scheduled sweeper |
| `bereavement_events` | Batch 1 | 20 Years | WGBO severe clinical grief and psychological support logging | `pg_cron` scheduled sweeper |
| `wandering_events` | Batch 1 | 20 Years | WGBO safe zone spatial disorientation tracking | `pg_cron` scheduled sweeper |
| `emergency_profile_access_log` | Batch 1 | 20 Years | NEN 7510 paramedic NFC/QR emergency access non-repudiation | `pg_cron` scheduled sweeper |
| `pending_confirmations` | Batch 1 | 24 Hours | Ephemeral repeat-back audio intake challenge state store | `pg_cron` scheduled sweeper |
| `psd2_webhook_ingress_buffer` | Batch 1 | 24 Hours | Unlogged Open Banking scratch staging buffer | Partition Drop (`PARTITION BY RANGE`) |
| `deletion_requests` | Batch 1 | 90 Days | Highly auditable compliance proof of GDPR Art. 17 teardown receipt | `pg_cron` scheduled sweeper |

---

## 🟠 BATCH 2: Operational & Threat Telemetry (Medium Risk — Implement Sprint After)

**Operational Focus:** Background analytical ledgers, threat detection buffers, device attestation buffers, SIEM metrics, and integration job tracking containing exactly zero plain-text clinical data.

| Table | Batch | Retention Period | Regulatory Legal Basis | Method (`pg_cron`/partition) |
| :--- | :---: | :---: | :--- | :---: |
| `browser_shield_events` | Batch 2 | 90 Days | Manifest V3 extension risk pattern diagnostic buffer | Partition Drop (`PARTITION BY RANGE`) |
| `call_reputation_lookups` | Batch 2 | 90 Days | Cache matching index for external phone scam networks | Partition Drop (`PARTITION BY RANGE`) |
| `domain_reputation_cache` | Batch 2 | 180 Days | Background URL phishing security evaluation indices | `pg_cron` scheduled delete |
| `phone_reputation_cache` | Batch 2 | 180 Days | In-memory operational NL phone reputation cache indices | `pg_cron` scheduled delete |
| `idempotency_keys` | Batch 2 | 7 Days | Distributed API concurrency state lock execution buffers | Partition Drop (`PARTITION BY RANGE`) |
| `security_violations` | Batch 2 | 5 Years | Datadog SIEM threat detection and DPO forensic non-repudiation | `pg_cron` scheduled sweeper |
| `app_release_checks` | Batch 2 | 1 Year | Platform engineering Quality Gate validation records | `pg_cron` scheduled sweeper |
| `slo_alerts` & `perf_metrics` | Batch 2 | 1 Year | Operational NEN 7510 SLO availability audit receipts | Partition Drop (`PARTITION BY RANGE`) |
| `external_care_sync_jobs` | Batch 2 | 90 Days | Async ONS / Nedap partner API integration job tracking | Partition Drop (`PARTITION BY RANGE`) |
| `fhir_import_jobs` | Batch 2 | 90 Days | Asynchronous MedMij FHIR clinical standard bundle execution logs | Partition Drop (`PARTITION BY RANGE`) |
| `partner_event_feeds` | Batch 2 | 30 Days | Raw external API healthcare communication message queues | Partition Drop (`PARTITION BY RANGE`) |
| `transport_requests` | Batch 2 | 2 Years | Corporate taxi and older adult ride booking fulfillment records | `pg_cron` scheduled sweeper |
| `tasks` | Batch 2 | 5 Years | Routine analytical health task check-in prompters | `pg_cron` scheduled sweeper |
| `skill_exchange_matches` | Batch 2 | 2 Years | Anonymous community older adult skill and talent registers | `pg_cron` scheduled sweeper |
| `neighbourhood_connections` | Batch 2 | 2 Years | Dutch PC4 walk buddy (*wandelmaatjes*) double opt-in ledgers | `pg_cron` scheduled sweeper |
| `safety_digests` | Batch 2 | 2 Years | Structured weekly family analytical summary records | `pg_cron` scheduled sweeper |

---

## 🟢 BATCH 3: System Configurations & Reference Data (Low Risk — Implement Before GA)

**Operational Focus:** Core identity nodes, feature runtime flags, DPO regulatory DPIA/Breach compliance ledgers, canonical Dutch pharmacological dictionaries, and PC4 postal code matching parameters.

| Table | Batch | Retention Period | Regulatory Legal Basis | Method (`pg_cron`/partition) |
| :--- | :---: | :---: | :--- | :---: |
| `profiles` & `elder_profiles` | Batch 3 | Tombstoned | GDPR Art. 17 / Art. 5(1)(e) statistical anonymization rule | Declarative Tombstoning (`status := 'erased'`) |
| `profiles_snapshot` | Batch 3 | Permanent | Stable secondary keys protecting high-write PSD2/Webhook references | Non-Expiring static Snapshot |
| `wearable_devices` | Batch 3 | Revoked | Hardware MAC/Enclave attestation UUID link store | Application Soft-Revoke (`is_active := false`) |
| `emergency_access_tokens` | Batch 3 | Revoked | Paramedic active brief connection hash store | Application Soft-Revoke (`expires_at`) |
| `feature_flags` | Batch 3 | Permanent | Complete platform operational runtime capability definitions | Non-Expiring static Config Table |
| `vendor_register` | Batch 3 | 10 Years | DPO regulatory compliance GDPR proof and vendor DPA tracking | `pg_cron` scheduled review/archive |
| `dpia_assessments` | Batch 3 | 10 Years | Corporate DPO mandatory Data Protection Impact Assessment ledger | `pg_cron` scheduled review/archive |
| `data_breach_incidents` | Batch 3 | 10 Years | Dutch *Autoriteit Persoonsgegevens* formal regulatory incident ledger | `pg_cron` scheduled review/archive |
| `medication_catalog_entries`| Batch 3 | Permanent | Z-Index / G-Standaard localized active NL drug dictionary | Automated Provider Delta Flushes |
| `medication_catalog_sync` | Batch 3 | 1 Year | Z-Index operational sync execution status records | `pg_cron` scheduled sweeper |
| `life_story_prompts` | Batch 3 | Permanent | Authoritative conversational prompters for Dutch older adults | Completely Immutable static Content |
| `bereavement_resources` | Batch 3 | Permanent | Content prompters for formal Dutch elder grief coaching | Completely Immutable static Content |
| `notification_preferences` | Batch 3 | Purged | Channel routing (WhatsApp fallback) and storage properties | Automatically wiped upon user GDPR erasure |
| `elder_voice_preferences` | Batch 3 | Purged | ELEVENLABS Familiar Voice companion speed and volume settings | Automatically wiped upon user GDPR erasure |
| `voice_profiles` | Batch 3 | Revoked | ELEVENLABS cloned Family Familiar Voice integration models | Explicit model teardown via `fn-voice-profile-revoke` |
| `interest_tags` & `event_int`| Batch 3 | Purged | Obfuscated PC4 community neighborhood discovery parameters | Purged automatically via `fn-buurt-optout` crons |
| `log_drain_configs` | Batch 3 | Permanent | SIEM cloud log forwarding endpoint routes and credentials | Non-Expiring static Config Table |
| `care_plans` & `items` | Batch 3 | 20 Years | Statutory WGBO professional nurse overarching treatment plans | Highly immutable active care plan repository |

---

### Implementation Runbook Guidelines
1. When starting **Batch 1**, coordinate with active visiting home care providers (*WACHT* operational teams) to schedule all `pg_cron` sweeper functions strictly during low-traffic overnight maintenance windows (e.g., between `03:00` and `04:00 AM CET`).
2. Ensure declarative DDL modifications for `PARTITION BY RANGE` operations utilize safe multi-phase data migration shims to entirely eliminate long-running `ShareLock` query wait queues.
3. Every completed migration file must be paired with an auditable Node.js integration assertion script in `tests/edge/` verifying exact data erasure without breaking underlying Row-Level Security rules.
