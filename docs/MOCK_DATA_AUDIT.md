# Mock Data Boundary Audit

Audit of all `packages/ui/src/mockData.ts` imports across Haven apps.

## Classification

| Category | Meaning |
|---|---|
| **A** | Acceptable hackathon visual fixture — UI layout / design data |
| **B** | Should use live Supabase/Edge Function data when available |
| **C** | Dangerous — pretends success or hides real state |

## Elder App

| Screen | Imports | Classification | Notes |
|---|---|---|---|
| `PillsScreen` | `MEDICATIONS` | **B** (already wired) | Fetches live `medication_reminders` from Supabase; falls back to mock only when unauthenticated or empty |
| `ShieldScreen` | `SCAM_EVENTS` | **B** (already wired) | Fetches live `scam_events` from Supabase; falls back to mock |
| `FamilyScreen` | `FAMILY_MESSAGES`, `LIFE_STORIES` | **B** (partially wired) | Messages fetched live; life stories remain mock |
| `StemScreen` | `VOICE_MEMORY` | **A** | Companion memory display; VAPI handles real conversations |
| `TodayScreen` | `VITALS` | **A** | Visual fixture; real vitals require wearable integration |
| `WachtScreen` | `CARE_VISITS` | **A** | Visual fixture; carer visit data is write-only from carer app |
| `KompasScreen` | `SAFE_ZONE`, `ELDER` | **A** | Safe zone display; real geofencing requires location permissions |
| `BuurtScreen` | `BUURT_MATCHES`, `COMMUNITY_EVENTS` | **A** | Neighbourhood discovery UI; requires real user base |
| `SettingsScreen` | `CONSENT_SETTINGS`, `FAMILIAR_VOICE_STATUS`, `DEVICE_HEALTH` | **B** | Consent should reflect real Supabase consent rows |

## Grandchild App

| Screen | Imports | Classification | Notes |
|---|---|---|---|
| `OverviewTab` | `MEDICATIONS`, `DAILY_STATUS`, `DEVICE_HEALTH`, `WEEKLY_DIGEST` | **B** | Dashboard should show real elder status when authenticated |
| `FamilyDashboard` | `DAILY_STATUS` | **B** | Status indicator should reflect live check-in data |
| `VoiceTab` | `FAMILIAR_VOICE_STATUS` | **A** | Familiar voice recording UI; works independently |
| `MedicationsTab` | `MEDICATIONS` | **B** | Should show elder's real medication schedule |
| `PrivacyTab` | `CONSENT_SETTINGS` | **B** | Should reflect real consent state |
| `AlertsTab` | `SCAM_EVENTS` | **B** | Should show real scam events for the elder |
| `CareTab` | `CARE_VISITS` | **A** | Visual fixture for care visit history |

## Carer App

| Screen | Imports | Classification | Notes |
|---|---|---|---|
| `VandaagTab` | `MEDICATIONS`, `TODAY_TASKS` | **B** | Carer's today view should show real schedule |
| `SafeguardingTab` | `SAFEGUARDING_ITEMS` | **A** | Visual fixture; safeguarding requires real incidents |
| `VisitsTab` | `CARE_VISITS` | **A** | Visual fixture; visit history display |
| `MARTab` | `MEDICATIONS`, `CARE_VISITS` | **B** | MAR recording should use real medication data |

## Top Priority Surfaces to Wire (B/C)

1. **Grandchild OverviewTab** — Shows elder daily status, meds, device health as if real
2. **Elder SettingsScreen** — Consent toggles should read/write real consent rows
3. **Grandchild MedicationsTab** — Shows elder meds; should use same live fetch as elder PillsScreen
4. **Grandchild AlertsTab** — Shows scam events; should use same live fetch as elder ShieldScreen
5. **Carer VandaagTab** — Today view with medications should fetch real schedule

## No C-class (Dangerous) Usages Found

All mock data usage follows the pattern: show fixture data when unauthenticated, attempt live fetch when authenticated. The `PillsScreen` and `ShieldScreen` in the elder app already implement this pattern correctly. Other screens should adopt the same approach.
