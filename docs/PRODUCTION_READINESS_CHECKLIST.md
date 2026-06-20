# HAVEN Production Readiness Checklist

Use this checklist before any real elder household launch.

## Engineering

- [x] `corepack pnpm test` passes locally.
- [x] `corepack pnpm run lint` passes locally.
- [x] `corepack pnpm run typecheck` passes locally.
- [x] `corepack pnpm run quality:check` passes locally.
- [x] Local Supabase reset/live local RLS verification has passed in this working tree.
- [ ] Hosted Supabase staging reset/migration deploy passes.
- [ ] Supabase DB types generated from the live local database.
- [ ] RLS positive and negative tests pass with hosted real JWTs.
- [ ] Hosted storage signed URL smoke passes via `corepack pnpm run smoke:hosted`.
- [ ] Hosted authenticated Edge Function smoke passes.
- [ ] iPhone physical-device test passes.
- [ ] Android physical-device test passes.
- [ ] Push notification test passes on iOS and Android.
- [ ] Offline medication queue test passes.
- [ ] Voice recording and TTS playback test passes.
- [ ] Camera/document capture test passes.

## Security

- [ ] Service role key is not exposed to clients.
- [ ] Production secrets are stored in approved secret managers.
- [ ] `HAVEN_INTERNAL_KEY` is configured and independent from the Supabase service role key.
- [ ] `TINK_TOKEN_ENCRYPTION_KEY` is configured as a base64-encoded 32-byte AES-GCM key.
- [ ] `HAVEN_INTERNAL_FUNCTIONS_URL` or `SUPABASE_URL` is configured for WhatsApp fallback dispatch.
- [ ] `REGULATORY_ESCALATION_WEBHOOK_URL` and `REGULATORY_ESCALATION_HMAC_SECRET` are configured if regulatory escalation is enabled.
- [ ] RLS reviewed by security owner.
- [ ] Storage policies reviewed by security owner.
- [ ] HMAC webhook verification tested.
- [ ] Sentry/log drain PII scrubbing tested.
- [ ] External penetration test completed.
- [ ] Critical and high findings remediated.

## Privacy/compliance

- [ ] DPO named.
- [ ] DPIA signed.
- [ ] Vendor DPAs signed.
- [ ] SCCs completed for non-EU vendors where required.
- [ ] Privacy policies approved.
- [ ] Data export tested.
- [ ] Right-to-erasure tested.
- [ ] BSN rejection tested.

## Product/accessibility

- [ ] VoiceOver test completed.
- [ ] TalkBack test completed.
- [ ] 200% font scaling test completed.
- [ ] High-contrast test completed.
- [ ] Older-adult usability sessions completed.
- [ ] Scam alert copy reviewed.
- [ ] Crisis copy reviewed.

## Release

- [ ] EAS remote env/secrets include `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for elder, carer, and grandchild profiles.
- [ ] `EXPO_PUBLIC_CARER_ELDER_IDS` bootstrap approach is replaced by a proper assigned-elders endpoint or explicitly accepted for pilot operations.
- [ ] Family dashboard server env includes `HAVEN_FAMILY_ELDER_ID` and a consent-scoped `HAVEN_FAMILY_ACCESS_TOKEN`, or a proper authenticated dashboard session flow is implemented.
- [ ] App Store metadata reviewed.
- [ ] Play Store metadata reviewed.
- [ ] Store screenshots prepared.
- [ ] Staging release approved.
- [ ] Rollback plan approved.
- [ ] On-call owner assigned.
