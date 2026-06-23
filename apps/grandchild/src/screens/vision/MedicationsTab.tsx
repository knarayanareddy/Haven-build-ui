// ─── Vision Family Dashboard: Medications Tab ───
// Uses auth session for live Supabase fetch + CRUD, mock data as fallback
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
import { MEDICATIONS } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface MedicationsTabProps {
  locale: string;
}

type LiveMed = { id: string; name: string; dose: string; times: string[]; taken: boolean[]; color: string; purpose: string; prescriber: string; nextRefill: string; stock: number };

function useLiveMedications(): { meds: LiveMed[] | null; loading: boolean; error: string | null; refetch: () => void } {
  const { session } = useAuth();
  const [live, setLive] = useState<LiveMed[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;
    if (!url || !token || !elderId) return;
    setLoading(true);
    setError(null);
    fetch(`${url}/rest/v1/medications?elder_id=eq.${elderId}&is_active=eq.true&select=id,name_nl,name_en,dose_description_nl,schedule_times,current_stock&order=name_nl.asc`, {
      headers: { authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token },
    })
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown>>) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        setLive(rows.map((r) => {
          const name = String(r.name_nl ?? '');
          const times = Array.isArray(r.schedule_times) ? r.schedule_times.map((t: unknown) => String(t).slice(0, 5)) : ['08:00'];
          return {
            id: String(r.id), name, dose: String(r.dose_description_nl ?? ''),
            times, taken: times.map(() => false), color: '#4CAF50',
            purpose: name, prescriber: '', nextRefill: '',
            stock: typeof r.current_stock === 'number' ? r.current_stock : 30,
          };
        }));
      })
      .catch(() => setError('Failed to load medications'))
      .finally(() => setLoading(false));
  }, [session, trigger]);

  return { meds: live, loading, error, refetch: () => setTrigger((t) => t + 1) };
}

export function MedicationsTab({ locale }: MedicationsTabProps) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const { meds: liveMeds, loading: medsLoading, error: medsError, refetch } = useLiveMedications();
  const meds = liveMeds ?? MEDICATIONS;
  const medicsTaken = meds.reduce((a, m) => a + m.taken.filter(Boolean).length, 0);
  const medicsTotal = meds.reduce((a, m) => a + m.taken.length, 0);
  const adherence = medicsTotal > 0 ? Math.round((medicsTaken / medicsTotal) * 100) : 0;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);

  async function handleAddMedication() {
    if (!newName.trim()) {
      Alert.alert('HAVEN', nl ? 'Voer een medicijnnaam in.' : 'Enter a medication name.');
      return;
    }
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const token = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID;

    if (!url || !token || !elderId) {
      Alert.alert('HAVEN', nl ? 'Niet verbonden — log eerst in.' : 'Not connected — please log in first.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${url}/rest/v1/medications`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? token,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          elder_id: elderId,
          name_nl: newName.trim(),
          name_en: newName.trim(),
          dose_description_nl: newDose.trim() || '1 tablet',
          dose_description_en: newDose.trim() || '1 tablet',
          frequency: 'dagelijks',
          schedule_times: [`${newTime}:00`],
          is_active: true,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      Alert.alert('HAVEN', nl ? 'Medicijn toegevoegd!' : 'Medication added!');
      setNewName('');
      setNewDose('');
      setNewTime('08:00');
      setShowAddForm(false);
      refetch();
    } catch {
      Alert.alert('HAVEN', nl ? 'Toevoegen mislukt.' : 'Failed to add medication.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {medsLoading && (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '700', fontFamily: 'Nunito-Bold', marginTop: 8 }}>{nl ? 'Laden...' : 'Loading...'}</Text>
        </View>
      )}
      {medsError && (
        <View style={{ backgroundColor: semanticColors.dangerBg, borderWidth: 1, borderColor: semanticColors.dangerBorder, borderRadius: 16, padding: 12 }}>
          <Text style={{ fontSize: 14, color: semanticColors.dangerText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>{medsError}</Text>
        </View>
      )}
      {/* Consent notice */}
      <View style={{ backgroundColor: semanticColors.infoBg, borderWidth: 1, borderColor: '#93C5FD', borderRadius: 16, padding: 12 }}>
        <Text style={{ fontSize: 12, color: semanticColors.infoText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>
          {nl ? 'Medicatieweergave verleend door toestemming van Margaret.' : 'Medication view granted by Margaret\'s consent.'}
        </Text>
      </View>

      {/* Adherence banner */}
      <View style={{
        borderRadius: 16, padding: 12, borderWidth: 1,
        backgroundColor: adherence >= 90 ? semanticColors.successBg : semanticColors.warningBg,
        borderColor: adherence >= 90 ? semanticColors.successBorder : semanticColors.warningBorder,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '900', fontFamily: 'Nunito-Black', color: adherence >= 90 ? semanticColors.successText : semanticColors.warningText }}>
          {adherence}% {nl ? 'naleving vandaag' : 'adherence today'} — {medicsTaken}/{medicsTotal} {nl ? 'doses genomen' : 'doses taken'}
        </Text>
      </View>

      {/* Add medication button */}
      <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1E3A5F', borderRadius: 14, paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold' }}>+ {nl ? 'Medicijn toevoegen' : 'Add medication'}</Text>
      </TouchableOpacity>

      {/* Add form */}
      {showAddForm && (
        <View style={{ borderRadius: 16, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#1E3A5F', gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Naam' : 'Name'} *</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={nl ? 'Bijv. Metformin' : 'E.g. Metformin'}
              placeholderTextColor={colors.pewter}
              style={{ borderRadius: 10, padding: 10, backgroundColor: colors.linen, borderWidth: 1, borderColor: colors.mist, fontSize: 14, color: colors.ink }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Dosis' : 'Dose'}</Text>
              <TextInput
                value={newDose}
                onChangeText={setNewDose}
                placeholder="500mg"
                placeholderTextColor={colors.pewter}
                style={{ borderRadius: 10, padding: 10, backgroundColor: colors.linen, borderWidth: 1, borderColor: colors.mist, fontSize: 14, color: colors.ink }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Tijd' : 'Time'}</Text>
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="08:00"
                placeholderTextColor={colors.pewter}
                style={{ borderRadius: 10, padding: 10, backgroundColor: colors.linen, borderWidth: 1, borderColor: colors.mist, fontSize: 14, color: colors.ink }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setShowAddForm(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.mist }}>
              <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.graphite }}>{nl ? 'Annuleren' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddMedication} disabled={submitting} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#1E3A5F', opacity: submitting ? 0.6 : 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#fff' }}>{submitting ? '...' : (nl ? 'Toevoegen' : 'Add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Live data indicator */}
      {liveMeds && (
        <View style={{ backgroundColor: semanticColors.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', fontFamily: 'Nunito-Bold', color: semanticColors.successText }}>● {nl ? 'Live data' : 'Live data'}</Text>
        </View>
      )}

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
                <Text style={{ fontSize: 16, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>{med.name} {med.dose}</Text>
                <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{med.stock} {nl ? 'over' : 'left'}</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>
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
                backgroundColor: med.taken[i] ? semanticColors.successBg : semanticColors.warningBg,
                borderWidth: 1, borderColor: med.taken[i] ? semanticColors.successBorder : semanticColors.warningBorder,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: 'Nunito-Bold', color: med.taken[i] ? semanticColors.successText : semanticColors.warningText }}>
                  {med.taken[i] ? '✓' : '○'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: 'Nunito-Bold', color: med.taken[i] ? semanticColors.successText : semanticColors.warningText }}>
                  {time}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: med.taken[i] ? semanticColors.successText : semanticColors.warningText }}>
                  {med.taken[i] ? (nl ? 'genomen' : 'taken') : (nl ? 'verwacht' : 'due')}
                </Text>
              </View>
            ))}
          </View>

          {/* Low stock warning */}
          {med.stock < 15 && (
            <Text style={{ fontSize: 12, color: semanticColors.warningText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>
              ⚠️ {nl ? 'Lage voorraad — bijvullen voor' : 'Low stock — refill by'} {med.nextRefill}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
