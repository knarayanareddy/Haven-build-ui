# HAVEN Compliance Guide

## Legal framework

HAVEN is designed for EU/Dutch compliance context:

- AVG/GDPR
- UAVG
- WGBO where professional care context applies
- WMO context for care support
- Meldcode Huiselijk Geweld en Kindermishandeling for safeguarding workflows
- NEN 7510 directionally for healthcare security
- MedMij and PSD2 gates for Phase 2 integrations

## Implemented compliance support

### v1.2.1 baseline

- `consent_records` (granular per-category)
- `vendor_register`
- `dpia_assessments`
- `data_breach_incidents`
- `deletion_requests`
- `audit_log`
- `app_release_checks`
- privacy policies in English and Dutch
- breach/incident runbook support
- DPO-required status tracking

### vNext additions

- `consent_packs` + `consent_pack_status` — staged consent so onboarding is not a 12-permission avalanche. Six seeded packs: `core_meds`, `core_voice`, `core_family_msgs`, `safety_location`, `safety_fall`, `shield_scam_coaching`. UI orchestration for the actual staged reveal is a follow-up; the data layer is ready.
- `device_health_events` — supports the **no-silent-failure** principle by emitting trust-signal events when permissions are denied, push tokens are invalid, or the device hasn't checked in for 12/24/48 h.
- `voice_profiles` + `elder_voice_preferences` — dual-consent for Familiar Voice (family member + elder), with EU-AI-Act-style disclosure (`disclosure_mode = 'always' | 'first_of_day'`).
- `video_call_sessions` — provider-abstracted real-time video calling.
- `pending_confirmations` — repeat-back confirmation for medication intake and fall response, with `cron` retention.
- `medication_ocr_reviews` — every OCR'd medication now goes through a review workflow before becoming live (when `med_ocr_review_required` flag is on).
- `medication_interaction_alerts` — pluggable provider integration for drug-interaction checks.
- `fall_events` — separate from wandering with full audit (detection source, confidence, ack timestamps, escalation notes).
- `carer_handover_notes` + `carer_handover_recipients` — carer writes non-clinical overdracht for family, with per-recipient visibility.

## Human gates

The following must be completed by responsible humans:

- DPIA signed.
- Vendor DPAs/SCCs signed.
- DPO/privacy officer named.
- External pentest complete.
- Real elder usability sessions complete.
- Store review complete.

## BSN rule

HAVEN does not collect, process, store or transmit BSN.

Controls:

- no BSN schema fields
- document upload warnings
- document summary rejection trigger for 9-digit identifiers
- Edge Function BSN-like content rejection helper
- vendor register `bsn_transmitted = false` constraint
