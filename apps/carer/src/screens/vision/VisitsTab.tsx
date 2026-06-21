// ─── Vision Carer: Bezoeken (Visit History) Tab ───
// Fetches live visit logs from Supabase, falls back to mock data when offline/unauthenticated
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
import { useAuth } from '../../auth/AuthProvider';
import { CarerClient } from '../../services/havenClient';
import { enqueueOffline } from '../../services/offlineQueue';
// DEMO: mock care visits — fallback when not authenticated
import { CARE_VISITS } from '@haven/ui/src/mockData';

interface VisitLog {
  id: string;
  elder_id: string;
  carer_id: string;
  visit_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  notes_nl: string | null;
  mood_observed: number | null;
  follow_up_required: boolean;
}

export function VisitsTab({ locale }: { locale: string }) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const [visits, setVisits] = useState<VisitLog[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0];
    if (!url || !elderId) return;

    fetch(`${url}/rest/v1/carer_visit_logs?elder_id=eq.${elderId}&order=visit_date.desc&limit=20`, {
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token,
      },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows)) setVisits(rows);
      })
      .catch(() => {});
  }, [session]);

  async function handleAddVisit() {
    const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0] ?? '00000000-0000-0000-0000-000000000001';
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!session || !supabaseUrl) {
      enqueueOffline('visit_log', { elder_id: elderId, visit_date: new Date().toISOString().slice(0, 10), notes_nl: newNote });
      Alert.alert('HAVEN', nl ? 'Bezoek lokaal opgeslagen.' : 'Visit saved locally.');
      setNewNote('');
      setShowAddForm(false);
      return;
    }

    setSubmitting(true);
    try {
      const client = new CarerClient({ supabaseUrl, accessToken: session.access_token });
      await client.visitLog({
        elder_id: elderId,
        visit_date: new Date().toISOString().slice(0, 10),
        check_in_time: new Date().toISOString(),
        notes_nl: newNote || undefined,
      });
      Alert.alert('HAVEN', nl ? 'Bezoek geregistreerd!' : 'Visit registered!');
      setNewNote('');
      setShowAddForm(false);
      // Refresh
      const res = await fetch(`${supabaseUrl}/rest/v1/carer_visit_logs?elder_id=eq.${elderId}&order=visit_date.desc&limit=20`, {
        headers: { authorization: `Bearer ${session.access_token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token },
      });
      const rows = await res.json();
      if (Array.isArray(rows)) setVisits(rows);
    } catch {
      enqueueOffline('visit_log', { elder_id: elderId, visit_date: new Date().toISOString().slice(0, 10), notes_nl: newNote });
      Alert.alert('HAVEN', nl ? 'Opslaan mislukt — lokaal bewaard.' : 'Save failed — stored locally.');
    } finally {
      setSubmitting(false);
    }
  }

  // Live data available
  if (visits && visits.length > 0) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>📅 {nl ? 'Bezoekgeschiedenis' : 'Visit history'}</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#DC2626', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>+ {nl ? 'Nieuw bezoek' : 'New visit'}</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={{ borderRadius: 16, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#DC2626', gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{nl ? 'Notitie (optioneel)' : 'Note (optional)'}</Text>
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder={nl ? 'Observaties...' : 'Observations...'}
              placeholderTextColor={colors.pewter}
              multiline
              style={{ borderRadius: 12, padding: 10, backgroundColor: colors.mist, fontSize: 13, color: colors.ink, minHeight: 48, textAlignVertical: 'top' }}
            />
            <TouchableOpacity onPress={handleAddVisit} disabled={submitting} style={{ backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 10, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{submitting ? '...' : (nl ? 'Bezoek registreren' : 'Register visit')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {visits.map((visit) => (
          <View key={visit.id} style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>
                  {new Date(visit.visit_date).toLocaleDateString(nl ? 'nl-NL' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
                <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>
                  {visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString(nl ? 'nl-NL' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  {visit.check_out_time ? ` → ${new Date(visit.check_out_time).toLocaleTimeString(nl ? 'nl-NL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </Text>
              </View>
              <StatusBadge status={visit.follow_up_required ? 'amber' : 'green'} label={visit.follow_up_required ? (nl ? 'Follow-up' : 'Follow-up') : (nl ? 'Afgerond' : 'Complete')} />
            </View>
            {visit.notes_nl && (
              <View style={{ backgroundColor: colors.mist, borderRadius: 12, padding: 10 }}>
                <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{visit.notes_nl}</Text>
              </View>
            )}
            {visit.mood_observed !== null && (
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>
                {nl ? 'Stemming' : 'Mood'}: {visit.mood_observed}/5
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  // Fallback: mock data (not authenticated or no visits yet)
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>📅 {nl ? 'Bezoekgeschiedenis' : 'Visit history'}</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#DC2626', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>+ {nl ? 'Nieuw bezoek' : 'New visit'}</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={{ borderRadius: 16, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#DC2626', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{nl ? 'Notitie (optioneel)' : 'Note (optional)'}</Text>
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder={nl ? 'Observaties...' : 'Observations...'}
            placeholderTextColor={colors.pewter}
            multiline
            style={{ borderRadius: 12, padding: 10, backgroundColor: colors.mist, fontSize: 13, color: colors.ink, minHeight: 48, textAlignVertical: 'top' }}
          />
          <TouchableOpacity onPress={handleAddVisit} disabled={submitting} style={{ backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 10, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{submitting ? '...' : (nl ? 'Bezoek registreren' : 'Register visit')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {CARE_VISITS.map((visit) => (
        <View key={visit.id} style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{visit.carerAvatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>{visit.carer}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '700' }}>
                {visit.date instanceof Date ? visit.date.toLocaleDateString('nl-NL') : String(visit.date)} · {visit.duration}
              </Text>
            </View>
            <StatusBadge status="green" label={visit.status} />
          </View>
          <View style={{ backgroundColor: colors.mist, borderRadius: 14, padding: 10 }}>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{visit.notes}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
