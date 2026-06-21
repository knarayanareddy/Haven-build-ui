// ─── Vision Carer: MAR-light Tab ───
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
// DEMO: mock MAR data — should use live medication_reminders when carer is authenticated
import { MEDICATIONS, CARE_VISITS } from '@haven/ui/src/mockData';

type MARStatus = 'given' | 'refused' | 'not_available';

export function MARTab({ locale }: { locale: string }) {
  const nl = locale.startsWith('nl');
  const [selectedMed, setSelectedMed] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [status, setStatus] = useState<MARStatus>('given');
  const [saved, setSaved] = useState(false);

  const TIME_OPTIONS = ['06:00', '08:00', '10:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

  const statusOptions: Array<{ value: MARStatus; label: string; color: string; bg: string }> = [
    { value: 'given', label: nl ? 'Gegeven' : 'Given', color: '#065F46', bg: '#D1FAE5' },
    { value: 'refused', label: nl ? 'Geweigerd' : 'Refused', color: '#92400E', bg: '#FEF3C7' },
    { value: 'not_available', label: nl ? 'Niet beschikbaar' : 'Not available', color: '#991B1B', bg: '#FEE2E2' },
  ];

  function handleSave() {
    if (!selectedMed) {
      Alert.alert('HAVEN', nl ? 'Selecteer een medicijn' : 'Select a medication');
      return;
    }
    setSaved(true);
    Alert.alert('HAVEN', nl ? 'MAR-registratie opgeslagen!' : 'MAR entry saved!');
    setTimeout(() => setSaved(false), 3000);
  }

  const previousEntries = CARE_VISITS[0]?.marEntries ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#9F1239' }}>💊 MAR-light ({nl ? 'Medicatietoediening' : 'Medication Administration'})</Text>
        <Text style={{ fontSize: 12, color: '#BE123C', fontWeight: '600' }}>
          {nl ? 'Registreer de toediening van medicatie. Wordt gekoppeld aan medication_reminders indien mogelijk.' : 'Record medication administration. Will be linked to medication_reminders if possible.'}
        </Text>
      </View>

      {/* Success banner */}
      {saved && (
        <View style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 14, padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#065F46' }}>✓ {nl ? 'MAR-registratie opgeslagen!' : 'MAR entry saved!'}</Text>
        </View>
      )}

      {/* Medication selector */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{nl ? 'Medicijn' : 'Medication'}</Text>
        {MEDICATIONS.map((med) => (
          <TouchableOpacity
            key={med.id}
            onPress={() => setSelectedMed(med.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
              backgroundColor: selectedMed === med.id ? '#FFF1F2' : colors.paper,
              borderWidth: 1, borderColor: selectedMed === med.id ? '#FECDD3' : colors.mist,
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: med.color }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{med.name} {med.dose}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time selector */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{nl ? 'Tijdstip toediening' : 'Administration time'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {TIME_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setSelectedTime(t)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                backgroundColor: selectedTime === t ? '#DC2626' : colors.paper,
                borderWidth: 1, borderColor: selectedTime === t ? '#DC2626' : colors.mist,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: selectedTime === t ? '#fff' : colors.ink }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status selector */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>Status</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {statusOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setStatus(opt.value)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
                backgroundColor: status === opt.value ? opt.bg : colors.paper,
                borderWidth: 1, borderColor: status === opt.value ? opt.color : colors.mist,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: status === opt.value ? opt.color : colors.graphite }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: '#DC2626', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>💊 {nl ? 'MAR-registratie opslaan' : 'Save MAR entry'}</Text>
      </TouchableOpacity>

      {/* Previous entries */}
      {previousEntries.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>{nl ? 'Eerdere registraties vandaag' : 'Previous entries today'}</Text>
          {previousEntries.map((entry, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              borderRadius: 14, padding: 12, backgroundColor: colors.paper,
              borderWidth: 1, borderColor: colors.mist,
            }}>
              <Text style={{ color: colors.sage, fontSize: 16 }}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{entry.medication}</Text>
                <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600' }}>@ {entry.time} · {entry.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
