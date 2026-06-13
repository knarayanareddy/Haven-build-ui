import type { MedicationReminder, AlertLevel, AlertRow } from '@haven/contracts/src/haven';

export interface DashboardFixture {
  elderId: string;
  elderName: string;
  dailyStatus: { status: 'green' | 'amber' | 'red'; reasons: string[]; generated_at: string };
  haloAxes: Array<{ label: string; level: 'green' | 'amber' | 'red' | 'grey'; detail: string }>;
  medications: Array<MedicationReminder & { medication_name_nl: string }>;
  alerts: AlertRow[];
  buurt: { nearbyCount: number; tags: string[]; walkBuddyCount: number; events: Array<{ id: string; title: string; date: string; distance: string }> };
  visits: Array<{ date: string; carer: string; note: string }>;
  weeklyDigest: { week: string; scamEvents: number; amber: number; red: number; black: number; medsPct: number; familyInteractions: number; summary: string };
  trustDevices: Array<{ profile_id: string; last_seen_at: string | null; battery_pct: number | null; network_type: string | null; location_permission: string | null; microphone_permission: string | null; push_token_ok: boolean | null }>;
  trustEvents: Array<{ id: string; severity: 'info' | 'warn' | 'p1' | 'p0'; event_key: string; message_nl: string; message_en: string; created_at: string }>;
  familiarVoice: { available: boolean; use_familiar_voice: boolean; owner_name: string | null; status: 'pending' | 'ready' | 'failed' | 'revoked' | null };
  actionButtons: Array<{ id: string; label_nl: string; label_en: string; tone: 'primary' | 'secondary' | 'safe'; href?: string }>;
}

const DEMO_ELDER_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_DASHBOARD: DashboardFixture = {
  elderId: DEMO_ELDER_ID,
  elderName: 'Margreet Bakker',
  dailyStatus: {
    status: 'amber',
    reasons: ['Minder stemacties vandaag dan normaal', 'Eén medicatie nog niet bevestigd'],
    generated_at: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  haloAxes: [
    { label: 'Pillen',     level: 'amber', detail: '94% ingenomen — 1 herinnering open' },
    { label: 'Veiligheid', level: 'green', detail: 'Geen nieuwe scams vandaag' },
    { label: 'Familie',    level: 'green', detail: '6 berichten vandaag' },
  ],
  medications: [
    { id: 'rem-1', medication_id: 'med-1', elder_id: DEMO_ELDER_ID, scheduled_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(), status: 'gepland',   snooze_count: 0, confirmed_at: null, medication_name_nl: 'Metformine 500 mg' },
    { id: 'rem-2', medication_id: 'med-2', elder_id: DEMO_ELDER_ID, scheduled_time: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), status: 'gepland', snooze_count: 0, confirmed_at: null, medication_name_nl: 'Lisinopril 10 mg' },
    { id: 'rem-3', medication_id: 'med-3', elder_id: DEMO_ELDER_ID, scheduled_time: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'ingenomen', snooze_count: 0, confirmed_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), medication_name_nl: 'Vitamine D 20 mcg' },
  ],
  alerts: [
    { id: 'alert-1', level: 'amber' as AlertLevel, channel: 'phone',    score: 52, explanation_nl: 'lemand belde en vroeg naar uw bankpas. Geef nooit codes door.', explanation_en: 'A caller asked about your bank card. Never share codes.', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), family_notified: true },
    { id: 'alert-2', level: 'rood'  as AlertLevel, channel: 'whatsapp', score: 82, explanation_nl: 'Een bekende lijkt in nood maar het account is mogelijk overgenomen. Bel uw familie eerst.', explanation_en: 'A contact appears in need but the account may be hijacked. Call family first.', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(), family_notified: true },
  ],
  buurt: {
    nearbyCount: 3,
    tags: ['Tuinieren', 'Wandelen', 'Lezen', 'Muziek', 'Koken'],
    walkBuddyCount: 2,
    events: [
      { id: 'evt-1', title: 'Gratis koffieochtend',     date: 'Vrijdag 10:00', distance: '600 m' },
      { id: 'evt-2', title: 'Wandelgroep ouderen',     date: 'Zondag 14:00',  distance: '1.2 km' },
    ],
  },
  visits: [
    { date: 'Gisteren',  carer: 'Nurse Eva de Boer (Buurtzorg)', note: 'Medicatiecontrole afgerond. Stemming rustig.' },
    { date: '8 dagen geleden', carer: 'Nurse Eva de Boer (Buurtzorg)', note: 'Refill Metformine aangevraagd.' },
  ],
  weeklyDigest: {
    week: 'Week van 9 juni 2026',
    scamEvents: 2,
    amber: 1,
    red: 1,
    black: 0,
    medsPct: 94,
    familyInteractions: 6,
    summary: '1 amber melding, 1 rood incident. Medicijnen 94% ingenomen.',
  },
  trustDevices: [
    { profile_id: DEMO_ELDER_ID, last_seen_at: new Date(Date.now() - 30 * 60_000).toISOString(), battery_pct: 62, network_type: 'wifi', location_permission: 'while_in_use', microphone_permission: 'granted', push_token_ok: true },
  ],
  trustEvents: [
    { id: 'dev-evt-1', severity: 'info', event_key: 'app_open', message_nl: 'HAVEN is geopend.', message_en: 'HAVEN opened.', created_at: new Date(Date.now() - 30 * 60_000).toISOString() },
  ],
  familiarVoice: { available: false, use_familiar_voice: false, owner_name: null, status: null },
  actionButtons: [
    { id: 'send-heart',    label_nl: 'Stuur een hart',   label_en: 'Send a heart',         tone: 'primary' },
    { id: 'send-voice',    label_nl: 'Spraakbericht',    label_en: 'Voice message',       tone: 'secondary' },
    { id: 'checkin-now',   label_nl: 'Vriendelijke check-in', label_en: 'Gentle check-in', tone: 'safe' },
    { id: 'video-call',    label_nl: 'Bel nu (video)',   label_en: 'Call now (video)',    tone: 'safe' },
  ],
};
