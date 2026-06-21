// ─── Vision Carer: Vandaag (Today) Tab ───
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
// DEMO: mock medications/tasks — should fetch live schedule when authenticated
import { MEDICATIONS, TODAY_TASKS } from '@haven/ui/src/mockData';

interface VandaagTabProps {
  elderName: string;
  isOnline: boolean;
  offlineCount: number;
  onCompleteVisit: () => void;
  locale: string;
}

export function VandaagTab({ elderName, isOnline, offlineCount, onCompleteVisit, locale }: VandaagTabProps) {
  const nl = locale.startsWith('nl');
  const checklist = [
    { label: nl ? 'Medicatie review compleet' : 'Medication review complete', done: true, icon: '✓' },
    { label: nl ? 'Hydratatie gecheckt' : 'Hydration checked', done: true, icon: '✓' },
    { label: nl ? 'Stemming: rustig' : 'Mood: calm', done: false, icon: '○' },
    { label: nl ? 'Bezoek inchecken: 10:00 — lopend' : 'Visit check-in: 10:00 — ongoing', done: false, icon: '!' },
  ];

  const doneTasks = TODAY_TASKS.filter((t) => t.done).length;
  const totalTasks = TODAY_TASKS.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Online/offline banner */}
      {!isOnline && (
        <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 12 }}>
          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '700' }}>
            📴 {nl ? 'Offline-first mode — notities worden lokaal opgeslagen en gesynchroniseerd zodra u weer online bent.' : 'Offline-first mode — notes are stored locally and synced when back online.'}
          </Text>
        </View>
      )}
      {offlineCount > 0 && isOnline && (
        <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 14, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700' }}>{offlineCount} offline acties wachten op sync</Text>
          <StatusBadge status="amber" label="Sync" />
        </View>
      )}

      {/* Current visit card */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>📅 {nl ? 'Huidig bezoek' : 'Current visit'} — {elderName}</Text>
        {checklist.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
              backgroundColor: item.done ? colors.sage : item.icon === '!' ? colors.amber : '#DBEAFE',
            }}>
              <Text style={{ color: item.done ? '#fff' : item.icon === '!' ? '#fff' : '#2563EB', fontSize: 11, fontWeight: '900' }}>
                {item.icon}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Care plan overview */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>📋 {nl ? 'Zorgplan overzicht' : 'Care plan overview'}</Text>
        {(nl ? [
          '• Mobiliteit: gang-kleed opgelost',
          '• Voeding: ontbijt gelogd',
          '• Volgende review: binnen 30 dagen',
          '• Bloeddruk monitoring: 2x per week',
        ] : [
          '• Mobility: rug issue resolved',
          '• Nutrition: breakfast logged',
          '• Next review: within 30 days',
          '• Blood pressure monitoring: 2x per week',
        ]).map((line, i) => (
          <Text key={i} style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{line}</Text>
        ))}
      </View>

      {/* Today's task progress */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>📊 {nl ? 'Dagvoortgang' : 'Daily progress'}</Text>
        <ProgressBar progress={totalTasks > 0 ? doneTasks / totalTasks : 0} color={colors.sage} showLabel />
      </View>

      {/* Medication schedule today */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>🩺 {nl ? 'Medicijnschema vandaag' : 'Medication schedule today'}</Text>
        {MEDICATIONS.map((med) => (
          <View key={med.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.mist }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: med.color }} />
              <Text style={{ fontSize: 13, color: colors.ink, fontWeight: '600' }}>{med.name} {med.dose}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {med.times.map((time, i) => (
                <View key={i} style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  backgroundColor: med.taken[i] ? '#D1FAE5' : '#FEF3C7',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: med.taken[i] ? '#065F46' : '#92400E' }}>
                    {time} {med.taken[i] ? '✓' : '○'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Complete visit button */}
      <TouchableOpacity
        onPress={onCompleteVisit}
        style={{ backgroundColor: '#DC2626', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✓ {nl ? 'Bezoek afronden & opslaan' : 'Complete visit & save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
