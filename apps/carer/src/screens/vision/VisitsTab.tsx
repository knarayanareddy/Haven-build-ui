// ─── Vision Carer: Bezoeken (Visit History) Tab ───
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
// DEMO: mock care visits — acceptable visual fixture for hackathon
import { CARE_VISITS } from '@haven/ui/src/mockData';

export function VisitsTab({ locale }: { locale: string }) {
  const nl = locale.startsWith('nl');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>📅 {nl ? 'Bezoekgeschiedenis' : 'Visit history'}</Text>

      {CARE_VISITS.map((visit) => (
        <View
          key={visit.id}
          style={{
            borderRadius: 18, padding: 16, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: colors.mist, gap: 10,
          }}
        >
          {/* Carer info + status */}
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

          {/* Notes */}
          <View style={{ backgroundColor: colors.mist, borderRadius: 14, padding: 10 }}>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{visit.notes}</Text>
          </View>

          {/* Handover details */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(visit.handover).slice(0, 4).map(([key, val]) => (
              <View key={key} style={{ width: '48%', backgroundColor: colors.mist, borderRadius: 10, padding: 8 }}>
                <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '700', textTransform: 'capitalize' }}>{key}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }} numberOfLines={2}>{val}</Text>
              </View>
            ))}
          </View>

          {/* MAR entries if present */}
          {visit.marEntries.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.sage }}>💊 MAR</Text>
              {visit.marEntries.map((entry, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: colors.sage, fontSize: 12 }}>✓</Text>
                  <Text style={{ fontSize: 12, color: colors.ink, fontWeight: '600' }}>
                    {entry.time} — {entry.medication} ({entry.status})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
