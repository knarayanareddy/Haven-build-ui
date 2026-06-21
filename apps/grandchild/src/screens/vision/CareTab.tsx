// ─── Vision Family Dashboard: Care Tab ───
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
// DEMO: mock care visits — acceptable visual fixture for hackathon
import { CARE_VISITS } from '@haven/ui/src/mockData';

interface CareTabProps {
  locale: string;
}

export function CareTab({ locale }: CareTabProps) {
  const nl = locale.startsWith('nl');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>
        🩺 WACHT — {nl ? 'Zorg Overdracht' : 'Care Handover'}
      </Text>

      {CARE_VISITS.map((visit) => (
        <View key={visit.id} style={{
          borderRadius: 18, padding: 16, backgroundColor: colors.paper,
          borderWidth: 1, borderColor: colors.mist, gap: 10,
        }}>
          {/* Carer + status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{visit.carerAvatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>{visit.carer}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '700' }}>
                {visit.date instanceof Date ? visit.date.toLocaleDateString(nl ? 'nl-NL' : 'en-GB') : String(visit.date)} · {visit.duration}
              </Text>
            </View>
            <StatusBadge status="green" label={visit.status} />
          </View>

          {/* Notes */}
          <View style={{ backgroundColor: colors.mist, borderRadius: 14, padding: 10 }}>
            <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600' }}>{visit.notes}</Text>
          </View>

          {/* Handover details grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(visit.handover).slice(0, 4).map(([key, val]) => (
              <View key={key} style={{ width: '48%', backgroundColor: colors.mist, borderRadius: 10, padding: 8 }}>
                <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '700', textTransform: 'capitalize' }}>{key}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }} numberOfLines={2}>{val}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
