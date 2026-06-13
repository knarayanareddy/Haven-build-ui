# HAVEN Architecture

## System context

HAVEN consists of:

- Elder app: Expo / React Native.
- Family dashboard: Next.js.
- Carer portal: WACHT role-scoped surface.
- Grandchild app: simplified Expo app.
- Browser Shield: Manifest V3 extension.
- Admin console: compliance and release operations.
- Backend: Supabase Postgres, Auth, Storage, Edge Functions, RLS, Realtime.
- AI providers: OpenAI and ElevenLabs.
- Optional integrations: PSD2, MedMij/FHIR, care systems and G-Standaard/Z-Index.

## Backend principles

1. Elder data ownership.
2. Forced RLS on user-data tables.
3. Consent-scoped family/carer access.
4. No BSN processing.
5. Fuzzed location by default.
6. Precise location TTL of 24 hours for active safety events only.
7. Storage buckets private by default.
8. Service-role access only inside Edge Functions.
9. Audit sensitive operations.
10. Human legal gates remain explicit.

## Data flow examples

### Voice interaction (v1.2.1 + vNext)

1. Elder records audio.
2. `fn-voice-pipeline` transcribes via Whisper or accepts text input in local mode.
3. Intent is classified (`bevestig_ingenomen` / `crisis` / `life_story` / `family_message` / `companion`).
4. **If intent = `bevestig_ingenomen` AND `med_repeatback_confirmation_enabled` flag is on** → write a `pending_confirmations(medication_taken)` row instead of marking the reminder taken immediately.
5. Companion memory is retrieved and optionally updated.
6. **Familiar Voice (vNext, gated)**: if `elder_voice_preferences.use_familiar_voice = true` AND not in crisis, select the `voice_profiles.provider_voice_id`; prepend disclosure if `disclosure_mode = 'always'`. Crisis mode forces a neutral voice.
7. Response is generated.
8. ElevenLabs creates TTS audio into `tts-cache`.
9. Signed audio URL is returned.
10. If a `pending_confirmations` row was written, the elder app shows the confirmation card; the elder says "yes" → `fn-pending-confirmation-respond` → `mark_reminder_taken`.

### Fall detection (vNext)

1. Phone heuristic / Apple Watch / manual trigger / carer reports a possible fall.
2. `fn-fall-event` accepts the event with detection source + confidence.
3. `fall_events` row is inserted with `status = 'possible'`.
4. `pending_confirmations(fall_response)` row is inserted with `expires_at = now() + 5 minutes`.
5. Elder app renders the "Are you OK?" modal (renderPendingConfirmation with `fall_response` type).
6. If elder taps "Yes I am OK" → `fn-pending-confirmation-respond` → `fall_events.status = 'resolved'`.
7. **If no response in N minutes** → `fn-fall-escalation` → `fall_events.status = 'no_response'` → notify family with calm copy → if still no response after further M minutes → notify active carers.

### Scam coaching (vNext)

1. Elder taps "Is this real?" or says "Is dit echt?" to the voice companion.
2. `fn-scam-coaching` accepts the description (hashed before storage, never stored raw).
3. Returns red flags + safe script ("Ik ga hier niet op in. Ik bel mijn familie eerst.") + recovery checklist + next step.
4. If composite score ≥ 40 → notify family with `scam_amber` or `scam_rood` notification type.
5. Records `scam_coaching_sessions` row with `family_notified_at` if applicable.

### Daily status (vNext)

1. `fn-daily-status-digest` runs at 21:00 Europe/Amsterdam (or triggered on demand).
2. For each elder: counts pending falls, no-response falls, high-score scams, missed medications, total medications, device staleness.
3. Computes `green / amber / red` with reasons.
4. Respects quiet hours (22:00–08:00): if outside the window, writes a `notifications` row per consented family member.
5. Family dashboard top pill renders the latest digest.

### Carer handover (vNext)

1. Carer fills appetite/mood/mobility/concerns in `apps/carer-portal/index.html`.
2. **Offline**: stored in `localStorage` queue under `haven.wacht.handover.queue.v1`.
3. **Online**: `fn-carer-handover-note` accepts the payload, asserts `auth.carer_can(elder_id)`, asserts no BSN-like text, inserts `carer_handover_notes` row.
4. Optional `carer_handover_recipients` rows for family visibility.
5. Family with `can_view_messages` + listed as a recipient sees the handover via RLS.
6. Optionally links `administered_medication_id` to MAR-light tracking.

### Scam event

1. Signal enters `fn-scam-pipeline` or `fn-browser-shield`.
2. Input is validated and BSN-like text is rejected.
3. Risk is scored.
4. Event is stored with hashes and plain-language explanation.
5. Family is notified for red/black levels.
6. Audit and metrics are recorded.

### BUURT match

1. Elder opts into PC4 neighbourhood profile.
2. Interests are selected from fixed tags.
3. `fn-buurt-discover` returns counts only.
4. `fn-buurt-match` creates a hidden recipient request.
5. Identity is revealed only after double opt-in.
6. Opt-out deletes profile/tags and ends connections.

### Emergency profile

1. Elder creates token with `fn-emergency-profile`.
2. Token hash is stored.
3. First responder presents token/QR/NFC value.
4. `get_emergency_profile` returns narrow medical profile.
5. Access is logged.

## Observability

### v1.2.1 observability surface

- `perf_metrics` stores function duration/status.
- `slo_alerts` stores operational alerts.
- `log_drain_configs` tracks Logflare/Axiom/Sentry/Slack drains.
- `fn-health-check` verifies operational basics.
- `fn-slo-measure` measures function p95 budgets.

### vNext observability surface

- `device_health_events` — immutable log of trust-signal explanations (battery low, permission denied, push token invalid, no heartbeat 12/24/48 h).
- `app_events` — append-only client event log (screen opened, scheduled check-in due).
- `pending_confirmations` — short-lived state for repeat-back + fall-response, purged by cron after 24 h.
- `medication_ocr_reviews` + `medication_interaction_alerts` — review and interaction pipelines.
- `scam_coaching_sessions` — every "Is this real?" session logged with hash-only elder prompt.

### Trust signal (vNext)

The family dashboard renders a `TrustSignalPanel` that summarises:
- Phone battery + network + permissions last known state (`device_sessions`).
- Recent `device_health_events` timeline with severity colors.

The system guarantees: **no silent failure**. If a safety feature cannot run (permissions off, offline, token invalid), family sees the trust signal rather than silence.
