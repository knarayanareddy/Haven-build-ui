// ─── Vision Carer: Vandaag (Today) Tab ───
// Fetches live medication schedule + task progress from Supabase when authenticated
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { StatusBadge, ProgressBar } from '@haven/ui/src/visionComponents';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../auth/AuthProvider';
// DEMO: mock medications/tasks — fallback when not authenticated
import { MEDICATIONS, TODAY_TASKS } from '@haven/ui/src/mockData';

interface LiveMedication {
  id: string;
  name: string;
  dose: string;
  times: string[];
  taken: boolean[];
  color: string;
}

interface LiveTask {
  id: string;
  label: string;
  done: boolean;
}

interface VandaagTabProps {
  elderName: string;
  isOnline: boolean;
  offlineCount: number;
  onCompleteVisit: () => void;
  locale: string;
}

export function VandaagTab({ elderName, isOnline, offlineCount, onCompleteVisit, locale }: VandaagTabProps) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const [liveMeds, setLiveMeds] = useState<LiveMedication[] | null>(null);
  const [liveTasks, setLiveTasks] = useState<LiveTask[] | null>(null);
  const [visitCheckedIn, setVisitCheckedIn] = useState(false);

  useEffect(() => {
    if (!session) return;
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0];
    if (!url || !elderId) return;
    const headers = {
      authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token,
    };

    // Fetch medications for elder
    fetch(`${url}/rest/v1/medications?elder_id=eq.${elderId}&is_active=eq.true&select=id,name_nl,dose_description_nl,schedule_times`, { headers })
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setLiveMeds(rows.map((r: Record<string, unknown>, i: number) => ({
            id: (r.id as string) ?? String(i),
            name: (r.name_nl as string) ?? 'Medication',
            dose: (r.dose_description_nl as string) ?? '',
            times: Array.isArray(r.schedule_times) ? (r.schedule_times as string[]).map((t) => t.slice(0, 5)) : ['08:00'],
            taken: Array.isArray(r.schedule_times) ? (r.schedule_times as string[]).map(() => false) : [false],
            color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][i % 4],
          })));
        }
      })
      .catch(() => {});

    // Fetch today's care tasks
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${url}/rest/v1/tasks?elder_id=eq.${elderId}&due_date=eq.${today}&select=id,title_nl,completed`, { headers })
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setLiveTasks(rows.map((r: Record<string, unknown>, i: number) => ({
            id: (r.id as string) ?? String(i),
            label: (r.title_nl as string) ?? 'Task',
            done: (r.completed as boolean) ?? false,
          })));
        }
      })
      .catch(() => {});

    // Check if we have an active visit today
    fetch(`${url}/rest/v1/carer_visit_logs?elder_id=eq.${elderId}&visit_date=eq.${today}&check_out_time=is.null&limit=1`, { headers })
      .then((r) => r.json())
      .then((rows) => { if (Array.isArray(rows) && rows.length > 0) setVisitCheckedIn(true); })
      .catch(() => {});
  }, [session]);

  const medications = liveMeds ?? MEDICATIONS;
  const tasks = liveTasks ?? TODAY_TASKS;
  const doneTasks = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;

  const checklist = [
    { label: nl ? 'Medicatie review compleet' : 'Medication review complete', done: true, icon: '✓' },
    { label: nl ? 'Hydratatie gecheckt' : 'Hydration checked', done: true, icon: '✓' },
    { label: nl ? 'Stemming: rustig' : 'Mood: calm', done: false, icon: '○' },
    { label: visitCheckedIn ? (nl ? 'Bezoek inchecken: lopend' : 'Visit check-in: ongoing') : (nl ? 'Bezoek inchecken: niet gestart' : 'Visit check-in: not started'), done: visitCheckedIn, icon: visitCheckedIn ? '✓' : '!' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Online/offline banner */}
      {!isOnline && (
        <View style={{ backgroundColor: semanticColors.warningBg, borderWidth: 1, borderColor: semanticColors.warningBorder, borderRadius: 16, padding: 12 }}>
          <Text style={{ fontSize: 13, color: semanticColors.warningText, fontWeight: '700' }}>
            {nl ? 'Offline-first mode — notities worden lokaal opgeslagen en gesynchroniseerd zodra u weer online bent.' : 'Offline-first mode — notes are stored locally and synced when back online.'}
          </Text>
        </View>
      )}
      {offlineCount > 0 && isOnline && (
        <View style={{ backgroundColor: semanticColors.warningBg, borderWidth: 1, borderColor: semanticColors.warningBorder, borderRadius: 14, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: semanticColors.warningText, fontWeight: '700' }}>{offlineCount} offline acties wachten op sync</Text>
          <StatusBadge status="amber" label="Sync" />
        </View>
      )}

      {/* Live data indicator */}
      {liveMeds && (
        <View style={{ backgroundColor: semanticColors.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: semanticColors.successText }}>● {nl ? 'Live data' : 'Live data'}</Text>
        </View>
      )}

      {/* Current visit card */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.graphite} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>{nl ? 'Huidig bezoek' : 'Current visit'} — {elderName}</Text>
        </View>
        {checklist.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
              backgroundColor: item.done ? colors.sage : item.icon === '!' ? colors.amber : semanticColors.infoBg,
            }}>
              <Text style={{ color: item.done ? '#fff' : item.icon === '!' ? '#fff' : semanticColors.infoText, fontSize: 11, fontWeight: '900' }}>
                {item.icon}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Care plan overview */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={colors.graphite} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>{nl ? 'Zorgplan overzicht' : 'Care plan overview'}</Text>
        </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="chart-bar" size={16} color={colors.graphite} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>{nl ? 'Dagvoortgang' : 'Daily progress'}</Text>
        </View>
        <ProgressBar progress={totalTasks > 0 ? doneTasks / totalTasks : 0} color={colors.sage} showLabel />
        {liveTasks && (
          <View style={{ gap: 4 }}>
            {liveTasks.map((task) => (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: task.done ? colors.sage : colors.pewter }}>{task.done ? '✓' : '○'}</Text>
                <Text style={{ fontSize: 12, color: colors.ink, fontWeight: '600', textDecorationLine: task.done ? 'line-through' : 'none' }}>{task.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Medication schedule today */}
      <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="stethoscope" size={16} color={colors.graphite} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.graphite }}>{nl ? 'Medicijnschema vandaag' : 'Medication schedule today'}</Text>
        </View>
        {medications.map((med) => (
          <View key={med.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.mist }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: med.color }} />
              <Text style={{ fontSize: 13, color: colors.ink, fontWeight: '600' }}>{med.name} {med.dose}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {med.times.map((time, i) => (
                <View key={i} style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  backgroundColor: med.taken[i] ? semanticColors.successBg : semanticColors.warningBg,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: med.taken[i] ? semanticColors.successText : semanticColors.warningText }}>
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
        style={{ backgroundColor: semanticColors.danger, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✓ {nl ? 'Bezoek afronden & opslaan' : 'Complete visit & save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
