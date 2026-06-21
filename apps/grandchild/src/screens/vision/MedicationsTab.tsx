// ─── Vision Family Dashboard: Medications Tab ───
// Uses auth session for live Supabase fetch, mock data as fallback
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
import { MEDICATIONS } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';

interface MedicationsTabProps {
  locale: string;
}

type LiveMed = { id: string; name: string; dose: string; times: string[]; taken: boolean[]; color: string; purpose: string; prescriber: string; nextRefill: string; stock: number };

function useLiveMedications(): LiveMed[] | null {
  const { session } = useAuth();
  const [live, setLive] = useState<LiveMed[] | null>(null);
  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    // Use auth session token (preferred) or env var fallback
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;
    if (!url || !token || !elderId) return;
    fetch(`${url}/rest/v1/medication_reminders?elder_id=eq.${elderId}&select=id,medication_name,dose,reminder_time,status,stock_remaining&order=reminder_time.asc`, {
      headers: { authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token },
    })
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown>>) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const grouped = new Map<string, LiveMed>();
        for (const r of rows) {
          const name = String(r.medication_name ?? '');
          const key = `${name}-${r.dose ?? ''}`;
          const existing = grouped.get(key);
          const time = String(r.reminder_time ?? '08:00').slice(0, 5);
          const taken = r.status === 'taken';
          if (existing) {
            existing.times.push(time);
            existing.taken.push(taken);
          } else {
            grouped.set(key, {
              id: String(r.id), name, dose: String(r.dose ?? ''),
              times: [time], taken: [taken], color: '#4CAF50',
              purpose: name, prescriber: '', nextRefill: '',
              stock: typeof r.stock_remaining === 'number' ? r.stock_remaining : 30,
            });
          }
        }
        setLive([...grouped.values()]);
      })
      .catch(() => {});
  }, [session]);
  return live;
}

export function MedicationsTab({ locale }: MedicationsTabProps) {
  const nl = locale.startsWith('nl');
  const meds = useLiveMedications() ?? MEDICATIONS;
  const medicsTaken = meds.reduce((a, m) => a + m.taken.filter(Boolean).length, 0);
  const medicsTotal = meds.reduce((a, m) => a + m.taken.length, 0);
  const adherence = medicsTotal > 0 ? Math.round((medicsTaken / medicsTotal) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Consent notice */}
      <View style={{ backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 16, padding: 12 }}>
        <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '700' }}>
          🔒 {nl ? 'Medicatieweergave verleend door toestemming van Margaret.' : 'Medication view granted by Margaret\'s consent.'}
        </Text>
      </View>

      {/* Adherence banner */}
      <View style={{
        borderRadius: 16, padding: 12, borderWidth: 1,
        backgroundColor: adherence >= 90 ? '#D1FAE5' : '#FEF3C7',
        borderColor: adherence >= 90 ? '#6EE7B7' : '#FDE68A',
      }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: adherence >= 90 ? '#065F46' : '#92400E' }}>
          {adherence}% {nl ? 'naleving vandaag' : 'adherence today'} — {medicsTaken}/{medicsTotal} {nl ? 'doses genomen' : 'doses taken'}
        </Text>
      </View>

      {/* Medication cards */}
      {meds.map((med) => (
        <View key={med.id} style={{
          borderRadius: 18, padding: 16, backgroundColor: colors.paper,
          borderWidth: 1, borderColor: colors.mist, gap: 10,
        }}>
          {/* Medication header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 6, height: 40, borderRadius: 3, backgroundColor: med.color }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>{med.name} {med.dose}</Text>
                <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>{med.stock} {nl ? 'over' : 'left'}</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>
                {med.purpose} · {med.prescriber}
              </Text>
            </View>
          </View>

          {/* Time slots */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {med.times.map((time, i) => (
              <View key={i} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                paddingVertical: 8, borderRadius: 12,
                backgroundColor: med.taken[i] ? '#D1FAE5' : '#FEF3C7',
                borderWidth: 1, borderColor: med.taken[i] ? '#6EE7B7' : '#FDE68A',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: med.taken[i] ? '#065F46' : '#92400E' }}>
                  {med.taken[i] ? '✓' : '○'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: med.taken[i] ? '#065F46' : '#92400E' }}>
                  {time}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: med.taken[i] ? '#065F46' : '#92400E' }}>
                  {med.taken[i] ? (nl ? 'genomen' : 'taken') : (nl ? 'verwacht' : 'due')}
                </Text>
              </View>
            ))}
          </View>

          {/* Low stock warning */}
          {med.stock < 15 && (
            <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700' }}>
              ⚠️ {nl ? 'Lage voorraad — bijvullen voor' : 'Low stock — refill by'} {med.nextRefill}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
