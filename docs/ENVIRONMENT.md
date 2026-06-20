# HAVEN Environment Variables

This document lists required runtime configuration. Store production values in Supabase secrets, Vercel environment variables, EAS secrets or the relevant secret manager.

## Supabase / deployment

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | deploy script | Supabase CLI deployment |
| `SUPABASE_PROJECT_REF` | deploy script | target Supabase project |
| `HAVEN_ENV` | all functions | environment label such as staging or production |
| `SUPABASE_URL` | Edge Functions | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | server-only Supabase service key |
| `SUPABASE_ANON_KEY` | Edge Functions + smoke tests | user-scoped Supabase clients and hosted smoke checks |
| `HAVEN_INTERNAL_KEY` | internal Edge Functions | required internal request signing key |
| `HAVEN_ALLOWED_ORIGINS` | Edge Functions | comma-separated allowed CORS origins |
| `HAVEN_INTERNAL_FUNCTIONS_URL` | notification fallback | internal base URL for Edge Function-to-Function calls; falls back to `SUPABASE_URL` |

## Elder app public config

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_ENV` | app environment |
| `EXPO_PUBLIC_LOCALE` | default locale |
| `EXPO_PUBLIC_TZ` | timezone, expected `Europe/Amsterdam` |

## Carer app public config

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_HAVEN_ENV` | app environment |
| `EXPO_PUBLIC_LOCALE` | default locale |
| `EXPO_PUBLIC_CARER_ELDER_IDS` | comma-separated elder profile IDs assigned to the signed-in carer for bootstrap/loading |

## Family dashboard config

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_ENV` | dashboard environment |
| `NEXT_PUBLIC_LOCALE` | default locale |
| `HAVEN_FAMILY_ELDER_ID` | server-side elder profile ID for dashboard bootstrap |
| `HAVEN_FAMILY_ACCESS_TOKEN` | server-side consent-scoped family user JWT used by the dashboard RPC client |

## Grandchild app public config

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## AI / voice

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Whisper, embeddings and LLM responses |
| `OPENAI_CHAT_MODEL` | optional chat model override |
| `ELEVENLABS_API_KEY` | text-to-speech |
| `ELEVENLABS_VOICE_ID_NL` | Dutch HAVEN voice |
| `ELEVENLABS_VOICE_ID_EN` | English HAVEN voice |
| `HAVEN_AI_MOCK` | enable built-in mock AI mode for local testing |
| `HAVEN_AI_MOCK_URL` | optional local mock AI server URL |

## Notifications / observability

| Variable | Purpose |
|---|---|
| `EXPO_ACCESS_TOKEN` | Expo push service integration |
| `SENTRY_DSN` | Sentry error capture |
| `LOG_DRAIN_TOKEN` | log drain provider token when enabled |
| `SLACK_WEBHOOK_URL` | SLO alert notifications when enabled |

## External integrations

| Variable | Purpose |
|---|---|
| `PSD2_WEBHOOK_SECRET` | PSD2 webhook HMAC verification |
| `TINK_CLIENT_ID` | Tink OAuth client ID |
| `TINK_CLIENT_SECRET` | Tink OAuth client secret |
| `TINK_REDIRECT_URI` | Tink OAuth callback URL |
| `TINK_TOKEN_ENCRYPTION_KEY` | base64-encoded 32-byte AES-GCM key for Tink refresh token encryption |
| `HAVEN_API_URL` | public API base URL used when registering vendor webhooks |
| `HAVEN_BANK_CONNECT_REDIRECT` | family dashboard redirect after bank connection |
| `MEDMIJ_CLIENT_ID` | MedMij/FHIR integration |
| `MEDMIJ_CLIENT_SECRET` | MedMij/FHIR integration |
| `MEDMIJ_IMPORT_SECRET` | MedMij import shared secret |
| `GSTANDAARD_CLIENT_ID` | G-Standaard/Z-Index integration when legal gate is met |
| `CARE_SYSTEM_CLIENT_ID` | ONS/Nedap/Careweb integration |
| `CARE_SYSTEM_CLIENT_SECRET` | ONS/Nedap/Careweb integration |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verification |
| `WHATSAPP_APP_SECRET` | WhatsApp request signature verification |
| `WHATSAPP_BUSINESS_PHONE_ID` | WhatsApp Business phone ID |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API token |
| `REGULATORY_ESCALATION_WEBHOOK_URL` | critical care incident escalation endpoint |
| `REGULATORY_ESCALATION_HMAC_SECRET` | HMAC secret for regulatory escalation webhook |

## Hosted smoke test variables

`corepack pnpm run smoke:hosted` requires:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | hosted Supabase URL |
| `SUPABASE_ANON_KEY` | hosted anon key |
| `HAVEN_INTERNAL_KEY` | internal function smoke authorization |
| `HAVEN_TEST_ELDER_ID` | test elder profile ID |
| `HAVEN_TEST_ELDER_JWT` | authenticated elder JWT for storage/function smoke checks |

## Security rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client apps.
- Never commit secrets to the repository.
- Rotate secrets after a suspected leak.
- Use separate staging and production values.
