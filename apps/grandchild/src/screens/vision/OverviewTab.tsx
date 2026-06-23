// ─── Vision Family Dashboard: Overview Tab ───
// Uses auth session for live Supabase fetch, mock data as fallback
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { havenIcons } from '@haven/ui/src/icons';
import { MEDICATIONS, DAILY_STATUS, DEVICE_HEALTH, WEEKLY_DIGEST } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';

interface OverviewTabProps {
  locale: string;
  elderName: string;
  familyName: string;
  onSendAction: (action: string) => Promise<void> | void;
}

const STATUS_CONFIG = {
  green: { bg: semanticColors.successBg, border: semanticColors.successBorder, text: semanticColors.successText, dot: '#22C55E', label_nl: 'Alles goed', label_en: 'All well' },
  amber: { bg: semanticColors.warningBg, border: semanticColors.warningBorder, text: semanticColors.warningText, dot: '#F59E0B', label_nl: 'Aandacht', label_en: 'Attention' },
  red: { bg: semanticColors.dangerBg, border: semanticColors.dangerBorder, text: semanticColors.dangerText, dot: '#EF4444', label_nl: 'Actie nodig', label_en: 'Action needed' },
};

type LiveMedStatus = { taken: number; total: number; adherence: number };
type LiveScores = { schild: number; wellbeing: string; buurt: number };

function useLiveMedStatus(): { data: LiveMedStatus | null; loading: boolean; error: string | null } {
  const { session } = useAuth();
  const [live, setLive] = useState<LiveMedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;
    if (!url || !token || !elderId) return;
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${url}/rest/v1/medication_reminders?elder_id=eq.${elderId}&select=status&scheduled_time=gte.${today}T00:00:00&scheduled_time=lt.${today}T23:59:59`, {
      headers: { authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token },
    })
      .then((r) => r.json())
      .then((rows: Array<{ status: string }>) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const taken = rows.filter((r) => r.status === 'ingenomen' || r.status === 'laat_ingenomen').length;
          setLive({ taken, total: rows.length, adherence: Math.round((taken / rows.length) * 100) });
        }
      })
      .catch(() => setError('Failed to load medication status'))
      .finally(() => setLoading(false));
  }, [session]);
  return { data: live, loading, error };
}

function useLiveScores(): { data: LiveScores | null; loading: boolean; error: string | null } {
  const { session } = useAuth();
  const [scores, setScores] = useState<LiveScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;
    if (!url || !token || !elderId) return;
    setLoading(true);
    setError(null);
    const headers = { authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token };
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    Promise.all([
      fetch(`${url}/rest/v1/scam_events?elder_id=eq.${elderId}&created_at=gte.${weekAgo}&select=id`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${url}/rest/v1/wellness_checkins?elder_id=eq.${elderId}&checked_in_at=gte.${weekAgo}&select=mood_score`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${url}/rest/v1/neighbourhood_connections?or=(initiator_elder_id.eq.${elderId},recipient_elder_id.eq.${elderId})&status=eq.accepted&select=id`, { headers }).then((r) => r.json()).catch(() => []),
    ]).then(([scams, checkins, buurt]) => {
      const scamCount = Array.isArray(scams) ? scams.length : 0;
      const schildScore = Math.max(0, 100 - scamCount * 18);
      let wellbeing = '4.0/5';
      if (Array.isArray(checkins) && checkins.length > 0) {
        const avg = checkins.reduce((s: number, c: Record<string, unknown>) => s + (Number(c.mood_score) || 3), 0) / checkins.length;
        wellbeing = `${avg.toFixed(1)}/5`;
      }
      const buurtCount = Array.isArray(buurt) ? buurt.length : 0;
      setScores({ schild: schildScore, wellbeing, buurt: buurtCount });
    })
      .catch(() => setError('Failed to load scores'))
      .finally(() => setLoading(false));
  }, [session]);
  return { data: scores, loading, error };
}

export function OverviewTab({ locale, elderName, familyName, onSendAction }: OverviewTabProps) {
  const nl = locale.startsWith('nl');
  const [actionSent, setActionSent] = useState<string | null>(null);
  const [actionSending, setActionSending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sc = STATUS_CONFIG[DAILY_STATUS.status as keyof typeof STATUS_CONFIG];

  const { data: liveMeds, loading: medsLoading, error: medsError } = useLiveMedStatus();
  const { data: liveScores, loading: scoresLoading, error: scoresError } = useLiveScores();
  const isLoading = medsLoading || scoresLoading;
  const fetchError = medsError ?? scoresError;
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

  const schildScore = liveScores?.schild ?? 82;
  const wellbeingVal = liveScores?.wellbeing ?? '4.1/5';
  const buurtCount = liveScores?.buurt ?? 3;
  const schildSub = schildScore >= 80
    ? (nl ? 'Geen actieve dreigingen' : 'No active scam threats')
    : (nl ? 'Recente meldingen gedetecteerd' : 'Recent threats detected');

  const stats = [
    { label: nl ? 'Med. naleving' : 'Med adherence', value: `${adherence}%`, icon: havenIcons.pills, color: '#059669', sub: `${medicsTaken}/${medicsTotal} ${nl ? 'genomen vandaag' : 'taken today'}` },
    { label: nl ? 'Schild score' : 'Shield score', value: String(schildScore), icon: havenIcons.shield, color: '#7C3AED', sub: schildSub },
    { label: nl ? 'Welzijn gem.' : 'Wellbeing avg', value: wellbeingVal, icon: havenIcons.heart, color: '#E11D48', sub: nl ? 'Deze week' : 'This week' },
    { label: 'BUURT', value: `${buurtCount} ${nl ? 'dichtbij' : 'nearby'}`, icon: havenIcons.neighbourhood, color: '#0D9488', sub: nl ? 'Interesse matches' : 'Interest matches' },
  ];

  const actions = [
    { icon: 'heart-outline', label: nl ? 'Stuur hartje' : 'Send heart', action: 'heart' },
    { icon: 'chat-outline', label: nl ? 'Spraakbericht' : 'Voice message', action: 'voice' },
    { icon: 'check-circle-outline', label: nl ? 'Vriendelijk inchecken' : 'Gentle check-in', action: 'checkin' },
    { icon: 'video-outline', label: nl ? 'Video bellen' : 'Video call', action: 'video' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {isLoading && (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '700', fontFamily: 'Nunito-Bold', marginTop: 8 }}>{nl ? 'Laden...' : 'Loading...'}</Text>
        </View>
      )}
      {fetchError && (
        <View style={{ backgroundColor: semanticColors.dangerBg, borderWidth: 1, borderColor: semanticColors.dangerBorder, borderRadius: 16, padding: 12 }}>
          <Text style={{ fontSize: 14, color: semanticColors.dangerText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>{fetchError}</Text>
        </View>
      )}
      {/* Daily status pill */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sc.dot }} />
              <Text style={{ fontSize: 15, fontWeight: '900', fontFamily: 'Nunito-Black', color: sc.text }}>
                {nl ? 'Dagstatus' : 'Daily Status'}: {nl ? sc.label_nl : sc.label_en}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: sc.text, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{DAILY_STATUS.summary}</Text>
            <Text style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>{nl ? 'Waarom' : 'Why'}: {DAILY_STATUS.why}</Text>
            <Text style={{ fontSize: 12, color: sc.text, opacity: 0.8 }}>{nl ? 'Wat nu' : 'What next'}: {DAILY_STATUS.whatNext}</Text>
          </View>
          <MaterialCommunityIcons name="circle" size={28} color={sc.dot} />
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map((stat) => (
          <View key={stat.label} style={{ width: '47%', borderRadius: 16, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <MaterialCommunityIcons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: 'Nunito-Black', color: stat.color }}>{stat.value}</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{stat.label}</Text>
            <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {/* Trust Signal */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="access-point" size={16} color={colors.ink} />
          <Text style={{ fontSize: 15, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>{nl ? 'Vertrouwenssignaal' : 'Trust Signal'}</Text>
        </View>
        {[
          { label: nl ? 'Apparaat laatst gezien' : 'Device last seen', value: `${Math.floor((Date.now() - DEVICE_HEALTH.lastSeen.getTime()) / 60000)} min ${nl ? 'geleden' : 'ago'}`, color: '#059669' },
          { label: nl ? 'Batterij' : 'Battery', value: `${DEVICE_HEALTH.batteryLevel}%`, color: DEVICE_HEALTH.batteryLevel > 30 ? '#059669' : semanticColors.danger },
          { label: nl ? 'Netwerk' : 'Network', value: DEVICE_HEALTH.networkStatus, color: '#059669' },
          { label: nl ? 'App versie' : 'App version', value: DEVICE_HEALTH.appVersion, color: colors.ink },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', fontFamily: 'Nunito-Bold', color: row.color }}>{row.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{nl ? 'Machtigingen' : 'Permissions'}</Text>
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {DEVICE_HEALTH.permissionsGranted.map((p) => (
              <StatusBadge key={p} status="green" label={p} />
            ))}
          </View>
        </View>
      </View>

      {/* Send to elder actions */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>
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
                backgroundColor: actionSent === act.action ? semanticColors.successBg : actionSending === act.action ? '#EFF6FF' : colors.paper,
                borderWidth: 1, borderColor: actionSent === act.action ? semanticColors.successBorder : actionSending === act.action ? '#93C5FD' : colors.mist,
                opacity: actionSending === act.action ? 0.7 : 1,
              }}
            >
              {actionSending === act.action ? <Text style={{ fontSize: 16 }}>...</Text> : actionSent === act.action ? <MaterialCommunityIcons name="check" size={16} color={semanticColors.successText} /> : <MaterialCommunityIcons name={act.icon as any} size={16} color={colors.ink} />}
              <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: 'Nunito-Bold', color: actionSent === act.action ? semanticColors.successText : colors.ink }}>
                {actionSending === act.action ? (nl ? 'Verzenden...' : 'Sending...') : actionSent === act.action ? (nl ? 'Verzonden!' : 'Sent!') : act.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {actionError && (
          <View style={{ backgroundColor: semanticColors.dangerBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: semanticColors.dangerBorder }}>
            <Text style={{ fontSize: 12, color: semanticColors.dangerText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>
              {nl ? 'Fout' : 'Error'}: {actionError}
            </Text>
          </View>
        )}
      </View>

      {/* Weekly digest */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="chart-bar" size={16} color={colors.ink} />
          <Text style={{ fontSize: 15, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>{nl ? 'Weekoverzicht' : 'Weekly Digest'} — {WEEKLY_DIGEST.period}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: nl ? 'Oplichting dreigingen' : 'Scam threats', value: WEEKLY_DIGEST.scamEvents.toString(), icon: havenIcons.shield, color: '#059669' },
            { label: nl ? 'Med. naleving' : 'Med adherence', value: `${WEEKLY_DIGEST.medicationAdherence}%`, icon: havenIcons.pills, color: '#2563EB' },
            { label: nl ? 'Familie interacties' : 'Family interactions', value: WEEKLY_DIGEST.familyInteractions.toString(), icon: havenIcons.chat, color: '#7C3AED' },
            { label: nl ? 'Zorgbezoeken' : 'Carer visits', value: WEEKLY_DIGEST.carerVisits.toString(), icon: havenIcons.stethoscope, color: '#E11D48' },
          ].map((item) => (
            <View key={item.label} style={{ width: '47%', backgroundColor: colors.mist, borderRadius: 14, padding: 10 }}>
              <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
              <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: 'Nunito-Black', color: item.color, marginTop: 4 }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{item.label}</Text>
            </View>
          ))}
        </View>
        {WEEKLY_DIGEST.highlightMoment && (
          <View style={{ backgroundColor: semanticColors.warningBg, borderRadius: 12, padding: 10 }}>
            <Text style={{ fontSize: 12, color: semanticColors.warningText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>{nl ? 'Hoogtepunt' : 'Highlight'}: {WEEKLY_DIGEST.highlightMoment}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
