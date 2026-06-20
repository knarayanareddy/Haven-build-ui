import React from 'react';
import Link from 'next/link';
import { DashboardCard } from '../../components/DashboardCard';
import { HaloStatus } from '../../components/HaloStatus';
import { MedicationList } from '../../components/MedicationList';
import { AlertList, AlertRow } from '../../components/AlertList';
import { DailyStatusPill } from '../../components/DailyStatusPill';
import { TrustSignalPanel } from '../../components/TrustSignalPanel';
import { CallButton } from '../../components/CallButton';
import { familyDashboardSummary } from '../../services/dashboard';
import type { ReminderStatus } from '@haven/contracts/src/haven';

type DashboardData = {
  elderId: string;
  elderName: string;
  dailyStatus: { status: 'green' | 'amber' | 'red'; reasons: string[]; generated_at: string };
  haloAxes: Array<{ label: string; level: 'green' | 'amber' | 'red' | 'grey'; detail: string }>;
  medications: Array<{ id: string; medication_id: string; elder_id: string; scheduled_time: string; status: ReminderStatus; snooze_count: number; confirmed_at: string | null; medication_name_nl: string }>;
  alerts: AlertRow[];
  buurt: { nearbyCount: number; tags: string[]; walkBuddyCount: number };
  visits: Array<{ date: string; carer: string; note: string }>;
  weeklyDigest: { week: string; scamEvents: number; amber: number; red: number; black: number; medsPct: number; familyInteractions: number; summary: string };
  trustDevices: Array<{ profile_id: string; last_seen_at: string | null; battery_pct: number | null; network_type: string | null; location_permission: string | null; microphone_permission: string | null; push_token_ok: boolean | null }>;
  trustEvents: Array<{ id: string; severity: 'info' | 'warn' | 'p1' | 'p0'; event_key: string; message_nl: string; message_en: string; created_at: string }>;
  actionButtons: Array<{ id: string; label_nl: string; label_en: string; tone: 'primary' | 'secondary' | 'safe' }>;
};

async function loadDashboard(): Promise<{ data: DashboardData | null; error: string | null; accessToken: string | null; supabaseUrl: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessToken = process.env.HAVEN_FAMILY_ACCESS_TOKEN ?? null;
  const elderId = process.env.HAVEN_FAMILY_ELDER_ID ?? null;

  if (!supabaseUrl || !accessToken || !elderId) {
    return { data: null, error: 'Family dashboard requires NEXT_PUBLIC_SUPABASE_URL, HAVEN_FAMILY_ELDER_ID, and HAVEN_FAMILY_ACCESS_TOKEN.', accessToken, supabaseUrl };
  }

  try {
    const summary = await familyDashboardSummary({ supabaseUrl, supabaseAnonKey, accessToken }, elderId) as {
      elder_id?: string;
      medications_today?: number;
      medications_taken_today?: number;
      unread_messages?: number;
      recent_rood_or_zwart_alerts?: number;
      last_location_event_at?: string | null;
    };

    const medsTotal = Number(summary.medications_today ?? 0);
    const medsTaken = Number(summary.medications_taken_today ?? 0);
    const unreadMessages = Number(summary.unread_messages ?? 0);
    const severeAlerts = Number(summary.recent_rood_or_zwart_alerts ?? 0);
    const medsPct = medsTotal > 0 ? Math.round((medsTaken / medsTotal) * 100) : 100;
    const status = severeAlerts > 0 ? 'red' : medsTotal > medsTaken ? 'amber' : 'green';

    return {
      accessToken,
      supabaseUrl,
      error: null,
      data: {
        elderId: summary.elder_id ?? elderId,
        elderName: process.env.HAVEN_FAMILY_ELDER_NAME ?? 'Elder',
        dailyStatus: {
          status,
          reasons: [
            severeAlerts > 0 ? `${severeAlerts} ernstige veiligheidsmelding(en)` : 'Geen ernstige veiligheidsmeldingen',
            medsTotal > 0 ? `${medsTaken}/${medsTotal} medicatieherinneringen bevestigd` : 'Geen medicatieherinneringen vandaag',
          ],
          generated_at: new Date().toISOString(),
        },
        haloAxes: [
          { label: 'Pillen', level: medsTotal > medsTaken ? 'amber' : 'green', detail: `${medsTaken}/${medsTotal} bevestigd` },
          { label: 'Veiligheid', level: severeAlerts > 0 ? 'red' : 'green', detail: `${severeAlerts} rood/zwart in 7 dagen` },
          { label: 'Familie', level: unreadMessages > 0 ? 'amber' : 'green', detail: `${unreadMessages} ongelezen bericht(en)` },
        ],
        medications: [],
        alerts: [],
        buurt: { nearbyCount: 0, tags: [], walkBuddyCount: 0 },
        visits: [],
        weeklyDigest: {
          week: new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date()),
          scamEvents: severeAlerts,
          amber: 0,
          red: severeAlerts,
          black: 0,
          medsPct,
          familyInteractions: unreadMessages,
          summary: `${severeAlerts} ernstige meldingen. Medicijnen ${medsPct}% bevestigd.`,
        },
        trustDevices: [
          { profile_id: elderId, last_seen_at: summary.last_location_event_at ?? null, battery_pct: null, network_type: null, location_permission: null, microphone_permission: null, push_token_ok: null },
        ],
        trustEvents: [],
        actionButtons: [
          { id: 'send-heart', label_nl: 'Stuur een hart', label_en: 'Send a heart', tone: 'primary' },
          { id: 'send-voice', label_nl: 'Spraakbericht', label_en: 'Voice message', tone: 'secondary' },
          { id: 'checkin-now', label_nl: 'Vriendelijke check-in', label_en: 'Gentle check-in', tone: 'safe' },
          { id: 'video-call', label_nl: 'Bel nu (video)', label_en: 'Call now (video)', tone: 'safe' },
        ],
      },
    };
  } catch (error) {
    return { data: null, error: String((error as Error).message ?? error), accessToken, supabaseUrl };
  }
}

export default async function DashboardPage() {
  const { data, error, accessToken, supabaseUrl } = await loadDashboard();

  if (!data) {
    return (
      <main style={{ display: 'grid', gap: 24, padding: 32, background: '#F5F3EE', minHeight: '100vh', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1A1F2E' }}>
        <header>
          <h1 style={{ margin: 0, fontSize: 36 }}>HAVEN</h1>
          <p style={{ color: '#6B7490', fontWeight: 700, marginTop: 6 }}>Dashboardconfiguratie is vereist voordat live familiegegevens kunnen worden getoond.</p>
        </header>
        <DashboardCard title="Configuratie nodig" subtitle="Geen demo-gegevens geladen" tone="amber">
          <p style={{ margin: 0, fontWeight: 700 }}>{error}</p>
        </DashboardCard>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24, padding: 32, background: '#F5F3EE', minHeight: '100vh', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1A1F2E' }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 36 }}>HAVEN — {data.elderName}</h1>
        <p style={{ color: '#6B7490', fontWeight: 700, marginTop: 6 }}>Toestemming-gebaseerde mantelzorg-dashboard. Precieze locatie wordt nooit getoond.</p>
      </header>

      <DailyStatusPill status={data.dailyStatus} />

      <DashboardCard title="Bellen" subtitle={`Eén tik om een videogesprek te starten met ${data.elderName}`} tone="safe">
        {supabaseUrl && accessToken ? (
          <CallButton elderId={data.elderId} elderName={data.elderName} supabaseUrl={supabaseUrl} accessToken={accessToken} />
        ) : (
          <p style={{ color: '#6B7490', fontWeight: 700, fontSize: 14, marginTop: 12 }}>Videobellen vereist een geauthenticeerde familiesessie.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Halo" subtitle="Drie dimensies, één rustig beeld">
        <HaloStatus axes={data.haloAxes} />
      </DashboardCard>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <DashboardCard title="Veiligheidsmeldingen" subtitle="SCHILD — uitleg in plaats van paniek" tone="amber">
          <AlertList alerts={data.alerts} />
        </DashboardCard>

        <DashboardCard title="Medicatie vandaag" subtitle="ANKER — alleen zichtbaar met can_view_medications" tone="safe">
          <MedicationList medications={data.medications} />
        </DashboardCard>

        <DashboardCard title="Buurtverbindingen" subtitle="BUURT — alleen zichtbaar als oudere toestemming heeft gegeven" tone="teal">
          <p style={{ margin: 0, fontWeight: 700 }}>{data.buurt.nearbyCount} HAVEN-gebruikers zichtbaar binnen toestemming</p>
          <p style={{ margin: '8px 0', fontWeight: 700 }}>{data.buurt.tags.length ? data.buurt.tags.join(' · ') : 'Geen gedeelde interesses'}</p>
          <p style={{ margin: 0, color: '#4A7B5A', fontWeight: 700 }}>{data.buurt.walkBuddyCount} wandelmaatje-kandidaten wachten op dubbele bevestiging.</p>
        </DashboardCard>

        <DashboardCard title="Zorgnotities" subtitle="WACHT — bezoeken en incidenten">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {data.visits.map((visit, idx) => (
              <li key={idx} style={{ padding: 12, borderRadius: 14, background: '#EAF6F4', border: '1px solid #A7D6CD' }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{visit.carer}</div>
                <div style={{ fontSize: 14, color: '#6B7490' }}>{visit.date}</div>
                <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{visit.note}</p>
              </li>
            ))}
          </ul>
        </DashboardCard>

        <DashboardCard title="Weekoverzicht" subtitle="Wekelijkse safety digest voor familie">
          <p style={{ margin: 0, fontWeight: 700 }}>{data.weeklyDigest.summary}</p>
          <ul style={{ marginTop: 8, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
            <li>Meldingen: {data.weeklyDigest.scamEvents} (amber {data.weeklyDigest.amber}, rood {data.weeklyDigest.red}, zwart {data.weeklyDigest.black})</li>
            <li>Medicatie: {data.weeklyDigest.medsPct}% ingenomen</li>
            <li>Familiecontact: {data.weeklyDigest.familyInteractions} berichten</li>
          </ul>
        </DashboardCard>
      </div>

      <DashboardCard title={`Acties voor ${data.elderName}`} subtitle="Twee-weg knoppen — wat u doet, hoort de oudere meteen">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {data.actionButtons.map((btn) => (
            <button key={btn.id} data-action={btn.id} style={actionButtonStyle(btn.tone)}>{btn.label_nl}</button>
          ))}
        </div>
      </DashboardCard>

      <TrustSignalPanel devices={data.trustDevices} recentEvents={data.trustEvents} />

      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dashboard/meldingen" style={navLinkStyle}>Meldingen</Link>
        <Link href="/dashboard/medicijnen" style={navLinkStyle}>Medicijnen</Link>
        <Link href="/dashboard/locatie" style={navLinkStyle}>Locatie</Link>
        <Link href="/dashboard/buurt" style={navLinkStyle}>Buurt</Link>
        <Link href="/dashboard/wacht" style={navLinkStyle}>Zorg</Link>
        <Link href="/dashboard/familiar-voice" style={navLinkStyle}>Vertrouwde stem</Link>
      </nav>
    </main>
  );
}

function actionButtonStyle(tone: 'primary' | 'secondary' | 'safe'): React.CSSProperties {
  const bg = tone === 'primary' ? '#2C3E6B' : tone === 'safe' ? '#4A7B5A' : '#FFFFFF';
  const fg = tone === 'secondary' ? '#2C3E6B' : '#FFFFFF';
  return { background: bg, color: fg, padding: '12px 18px', borderRadius: 18, fontWeight: 900, border: tone === 'secondary' ? '2px solid #2C3E6B' : 'none', minHeight: 56, cursor: 'pointer' };
}

const navLinkStyle: React.CSSProperties = {
  background: '#2C3E6B',
  color: '#FFFFFF',
  padding: '12px 18px',
  borderRadius: 18,
  fontWeight: 900,
  textDecoration: 'none',
  minHeight: 56,
  display: 'inline-flex',
  alignItems: 'center',
};
