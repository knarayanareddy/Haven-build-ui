# HAVEN Production Readiness Checklist

Use this checklist before any real elder household launch.

## Engineering

- [ ] `corepack pnpm test` passes.
- [ ] Supabase CLI and Docker DB reset passes.
- [ ] Supabase DB types generated from the live local database.
- [ ] RLS positive and negative tests pass with real JWTs.
- [ ] Storage signed URL tests pass.
- [ ] Edge Function integration tests pass.
- [ ] iPhone physical-device test passes.
- [ ] Android physical-device test passes.
- [ ] Push notification test passes on iOS and Android.
- [ ] Offline medication queue test passes.
- [ ] Voice recording and TTS playback test passes.
- [ ] Camera/document capture test passes.

## Security

- [ ] Service role key is not exposed to clients.
- [ ] Production secrets are stored in approved secret managers.
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

- [ ] App Store metadata reviewed.
- [ ] Play Store metadata reviewed.
- [ ] Store screenshots prepared.
- [ ] Staging release approved.
- [ ] Rollback plan approved.
- [ ] On-call owner assigned.
