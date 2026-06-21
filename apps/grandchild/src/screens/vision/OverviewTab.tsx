// ─── Vision Family Dashboard: Overview Tab ───
// Uses auth session for live Supabase fetch, mock data as fallback
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
import { MEDICATIONS, DAILY_STATUS, DEVICE_HEALTH, WEEKLY_DIGEST } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';

interface OverviewTabProps {
  locale: string;
  elderName: string;
  familyName: string;
  onSendAction: (action: string) => Promise<void> | void;
}

const STATUS_CONFIG = {
  green: { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', dot: '#22C55E', label_nl: 'Alles goed', label_en: 'All well' },
  amber: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', dot: '#F59E0B', label_nl: 'Aandacht', label_en: 'Attention' },
  red: { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', dot: '#EF4444', label_nl: 'Actie nodig', label_en: 'Action needed' },
};

type LiveMedStatus = { taken: number; total: number; adherence: number };

function useLiveMedStatus(): LiveMedStatus | null {
  const { session } = useAuth();
  const [live, setLive] = useState<LiveMedStatus | null>(null);
  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    // Use auth session token (preferred) or env var fallback
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;
    if (!url || !token || !elderId) return;
    fetch(`${url}/rest/v1/medication_reminders?elder_id=eq.${elderId}&select=status&scheduled_time=gte.${new Date().toISOString().slice(0, 10)}`, {
      headers: { authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token },
    })
      .then((r) => r.json())
      .then((rows: Array<{ status: string }>) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const taken = rows.filter((r) => r.status === 'taken').length;
          setLive({ taken, total: rows.length, adherence: Math.round((taken / rows.length) * 100) });
        }
      })
      .catch(() => {});
  }, [session]);
  return live;
}

export function OverviewTab({ locale, elderName, familyName, onSendAction }: OverviewTabProps) {
  const nl = locale.startsWith('nl');
  const [actionSent, setActionSent] = useState<string | null>(null);
  const [actionSending, setActionSending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sc = STATUS_CONFIG[DAILY_STATUS.status as keyof typeof STATUS_CONFIG];

  const liveMeds = useLiveMedStatus();
  const medicsTaken = liveMeds?.taken ?? MEDICATIONS.reduce((a, m) => a + m.taken.filter(Boolean).length, 0);
  const medicsTotal = liveMeds?.total ?? MEDICATIONS.reduce((a, m) => a + m.taken.length, 0);
  const adherence = liveMeds?.adherence ?? (medicsTotal > 0 ? Math.round((medicsTaken / medicsTotal) * 100) : 0);

  async function handleAction(action: string) {
    setActionSending(action);
    setActionError(null);
    try {
      await onSendAction(action);
      setActionSent(action);
      setTimeout(() => setActionSent(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send';
      setActionError(msg);
      Alert.alert(
        locale.startsWith('nl') ? 'Verzenden mislukt' : 'Send failed',
        msg,
      );
    } finally {
      setActionSending(null);
    }
  }

  const stats = [
    { label: nl ? 'Med. naleving' : 'Med adherence', value: `${adherence}%`, icon: '💊', color: '#059669', sub: `${medicsTaken}/${medicsTotal} ${nl ? 'genomen vandaag' : 'taken today'}` },
    { label: nl ? 'Schild score' : 'Shield score', value: '82', icon: '🛡️', color: '#7C3AED', sub: nl ? 'Geen actieve dreigingen' : 'No active scam threats' },
    { label: nl ? 'Welzijn gem.' : 'Wellbeing avg', value: '4.1/5', icon: '❤️', color: '#E11D48', sub: nl ? 'Deze week' : 'This week' },
    { label: 'BUURT', value: `3 ${nl ? 'dichtbij' : 'nearby'}`, icon: '🏘️', color: '#0D9488', sub: nl ? 'Interesse matches' : 'Interest matches' },
  ];

  const actions = [
    { icon: '❤️', label: nl ? 'Stuur hartje' : 'Send heart', action: 'heart' },
    { icon: '💬', label: nl ? 'Spraakbericht' : 'Voice message', action: 'voice' },
    { icon: '✅', label: nl ? 'Vriendelijk inchecken' : 'Gentle check-in', action: 'checkin' },
    { icon: '📹', label: nl ? 'Video bellen' : 'Video call', action: 'video' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Daily status pill */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sc.dot }} />
              <Text style={{ fontSize: 15, fontWeight: '900', color: sc.text }}>
                {nl ? 'Dagstatus' : 'Daily Status'}: {nl ? sc.label_nl : sc.label_en}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: sc.text, fontWeight: '600' }}>{DAILY_STATUS.summary}</Text>
            <Text style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>{nl ? 'Waarom' : 'Why'}: {DAILY_STATUS.why}</Text>
            <Text style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>{nl ? 'Wat nu' : 'What next'}: {DAILY_STATUS.whatNext}</Text>
          </View>
          <Text style={{ fontSize: 28 }}>{DAILY_STATUS.status === 'green' ? '🟢' : DAILY_STATUS.status === 'amber' ? '🟡' : '🔴'}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map((stat) => (
          <View key={stat.label} style={{ width: '47%', borderRadius: 16, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: stat.color }}>{stat.value}</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.ink }}>{stat.label}</Text>
            <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600' }}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {/* Trust Signal */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>📡 {nl ? 'Vertrouwenssignaal' : 'Trust Signal'}</Text>
        {[
          { label: nl ? 'Apparaat laatst gezien' : 'Device last seen', value: `${Math.floor((Date.now() - DEVICE_HEALTH.lastSeen.getTime()) / 60000)} min ${nl ? 'geleden' : 'ago'}`, color: '#059669' },
          { label: nl ? 'Batterij' : 'Battery', value: `${DEVICE_HEALTH.batteryLevel}%`, color: DEVICE_HEALTH.batteryLevel > 30 ? '#059669' : '#DC2626' },
          { label: nl ? 'Netwerk' : 'Network', value: DEVICE_HEALTH.networkStatus, color: '#059669' },
          { label: nl ? 'App versie' : 'App version', value: DEVICE_HEALTH.appVersion, color: colors.ink },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: row.color }}>{row.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{nl ? 'Machtigingen' : 'Permissions'}</Text>
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {DEVICE_HEALTH.permissionsGranted.map((p) => (
              <StatusBadge key={p} status="green" label={p} />
            ))}
          </View>
        </View>
      </View>

      {/* Send to elder actions */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>
          {nl ? `Stuur naar ${elderName}` : `Send to ${elderName}`}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {actions.map((act) => (
            <TouchableOpacity
              key={act.action}
              onPress={() => handleAction(act.action)}
              style={{
                width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
                padding: 12, borderRadius: 14,
                backgroundColor: actionSent === act.action ? '#D1FAE5' : actionSending === act.action ? '#EFF6FF' : colors.paper,
                borderWidth: 1, borderColor: actionSent === act.action ? '#6EE7B7' : actionSending === act.action ? '#93C5FD' : colors.mist,
                opacity: actionSending === act.action ? 0.7 : 1,
              }}
            >
              <Text style={{ fontSize: 16 }}>{actionSending === act.action ? '...' : actionSent === act.action ? '✓' : act.icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: actionSent === act.action ? '#065F46' : colors.ink }}>
                {actionSending === act.action ? (nl ? 'Verzenden...' : 'Sending...') : actionSent === act.action ? (nl ? 'Verzonden!' : 'Sent!') : act.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {actionError && (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FECACA' }}>
            <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '700' }}>
              {nl ? 'Fout' : 'Error'}: {actionError}
            </Text>
          </View>
        )}
      </View>

      {/* Weekly digest */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>📊 {nl ? 'Weekoverzicht' : 'Weekly Digest'} — {WEEKLY_DIGEST.period}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: nl ? 'Oplichting dreigingen' : 'Scam threats', value: WEEKLY_DIGEST.scamEvents.toString(), icon: '🛡️', color: '#059669' },
            { label: nl ? 'Med. naleving' : 'Med adherence', value: `${WEEKLY_DIGEST.medicationAdherence}%`, icon: '💊', color: '#2563EB' },
            { label: nl ? 'Familie interacties' : 'Family interactions', value: WEEKLY_DIGEST.familyInteractions.toString(), icon: '💬', color: '#7C3AED' },
            { label: nl ? 'Zorgbezoeken' : 'Carer visits', value: WEEKLY_DIGEST.carerVisits.toString(), icon: '👩‍⚕️', color: '#E11D48' },
          ].map((item) => (
            <View key={item.label} style={{ width: '47%', backgroundColor: colors.mist, borderRadius: 14, padding: 10 }}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: item.color, marginTop: 4 }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600' }}>{item.label}</Text>
            </View>
          ))}
        </View>
        {WEEKLY_DIGEST.highlightMoment && (
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10 }}>
            <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700' }}>✨ {nl ? 'Hoogtepunt' : 'Highlight'}: {WEEKLY_DIGEST.highlightMoment}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
