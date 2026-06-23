// ─── Vision Carer: Veiligheid (Safeguarding) Tab ───
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
import { useAuth } from '../../auth/AuthProvider';
import { useCarerClient } from '../../hooks/useCarerClient';
import { enqueueOffline } from '../../services/offlineQueue';
// DEMO: mock safeguarding — acceptable visual fixture for hackathon
import { SAFEGUARDING_ITEMS } from '@haven/ui/src/mockData';

const MELDCODE_STEPS = [
  { step: 1, title: 'In kaart brengen', desc: 'Signalen en feiten vastleggen', done: true },
  { step: 2, title: 'Collegiale consultatie', desc: 'Overleg met collega of leidinggevende', done: true },
  { step: 3, title: 'Gesprek met cliënt', desc: 'Situatie bespreken met cliënt', done: false },
  { step: 4, title: 'Weeg de situatie', desc: 'Is melden bij Veilig Thuis nodig?', done: false },
  { step: 5, title: 'Beslissing', desc: 'Melden of hulp organiseren', done: false },
];

export function SafeguardingTab({ locale }: { locale: string }) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const carerClient = useCarerClient();
  const [showForm, setShowForm] = useState(false);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitReport() {
    if (!summary.trim()) {
      Alert.alert('HAVEN', nl ? 'Voer een beschrijving in.' : 'Please enter a description.');
      return;
    }
    const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0] ?? '00000000-0000-0000-0000-000000000001';
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    setSubmitting(true);
    try {
      if (!session || !supabaseUrl) {
        enqueueOffline('incident_report', { elder_id: elderId, severity, summary_nl: summary });
        Alert.alert('HAVEN', nl ? 'Lokaal opgeslagen — synchroniseert zodra online.' : 'Saved locally — will sync when online.');
      } else {
        const carerId = (() => { try { const [, p] = session.access_token.split('.'); return JSON.parse(atob(p))?.sub; } catch { return undefined; } })();
        await carerClient!.incidentReport({ elder_id: elderId, severity, summary_nl: summary, reported_by_id: carerId });
        Alert.alert('HAVEN', nl ? 'Veiligheidsmelding ingediend!' : 'Safeguarding report submitted!');
      }
      setSummary('');
      setShowForm(false);
    } catch {
      enqueueOffline('incident_report', { elder_id: elderId, severity, summary_nl: summary });
      Alert.alert('HAVEN', nl ? 'Verzenden mislukt — lokaal opgeslagen.' : 'Send failed — saved locally.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: semanticColors.warningBg, borderWidth: 1, borderColor: semanticColors.warningBorder, borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: semanticColors.warningText }}>⚠️ {nl ? 'Meldcode Huiselijk Geweld en Kindermishandeling' : 'Domestic Violence & Child Abuse Reporting Code'}</Text>
        <Text style={{ fontSize: 12, color: '#A16207', fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>
          {nl ? 'Stap-voor-stap begeleiding bij meldingen. Incidentrapporten via fn-incident-report.' : 'Step-by-step guidance for reporting. Incident reports via fn-incident-report.'}
        </Text>
      </View>

      {/* Safeguarding items */}
      {SAFEGUARDING_ITEMS.map((item) => (
        <View
          key={item.id}
          style={{
            borderRadius: 18, padding: 16, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: item.status === 'resolved' ? '#BBF7D0' : semanticColors.warningBorder,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <MaterialCommunityIcons name={item.status === 'resolved' ? 'check-circle' : 'alert-outline'} size={18} color={item.status === 'resolved' ? colors.sage : colors.amber} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{item.description}</Text>
              <StatusBadge
                status={item.status === 'resolved' ? 'green' : 'amber'}
                label={item.status}
              />
            </View>
          </View>
          {item.resolution && (
            <View style={{ backgroundColor: semanticColors.successBg, borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 12, color: semanticColors.successText, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>✓ {item.resolution}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Meldcode steps */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Meldcode stappen' : 'Reporting code steps'}</Text>
        {MELDCODE_STEPS.map((step) => (
          <View key={step.step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
              backgroundColor: step.done ? colors.sage : colors.mist,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '900', fontFamily: 'Nunito-Black', color: step.done ? '#fff' : colors.graphite }}>
                {step.done ? '✓' : step.step}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{step.title}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* New report form */}
      {showForm && (
        <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: semanticColors.warningBorder, gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Ernst' : 'Severity'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setSeverity(s)} style={{
                flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                backgroundColor: severity === s ? (s === 'critical' ? semanticColors.danger : s === 'high' ? '#F59E0B' : s === 'medium' ? '#3B82F6' : '#22C55E') : colors.mist,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', fontFamily: 'Nunito-Bold', color: severity === s ? '#fff' : colors.graphite }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Beschrijving' : 'Description'}</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder={nl ? 'Beschrijf het incident...' : 'Describe the incident...'}
            placeholderTextColor={colors.pewter}
            multiline numberOfLines={4}
            style={{ borderRadius: 14, padding: 12, backgroundColor: colors.linen, borderWidth: 1, borderColor: colors.mist, fontSize: 14, color: colors.ink, minHeight: 80, textAlignVertical: 'top' }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: colors.mist }}>
              <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.graphite }}>{nl ? 'Annuleren' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmitReport} disabled={submitting} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: semanticColors.danger, opacity: submitting ? 0.6 : 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#fff' }}>{submitting ? '...' : (nl ? 'Indienen' : 'Submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New report button */}
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={{ backgroundColor: colors.amber, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'Nunito-Black' }}>+ {nl ? 'Nieuwe veiligheidsmelding aanmaken' : 'Create new safeguarding report'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
