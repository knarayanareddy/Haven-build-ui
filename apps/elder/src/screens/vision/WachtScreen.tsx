// ─── Vision WachtScreen ───
import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
// DEMO: mock care visits — acceptable visual fixture for hackathon
import { CARE_VISITS } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionWacht(ctx: ScreenContext): React.ReactNode {
  const { locale, visits: ctxVisits } = ctx;
  const visits = ctxVisits.length > 0
    ? ctxVisits.map((v, i) => ({ ...v, id: `visit-ctx-${i}`, carer: v.carer, carerAvatar: '👩‍⚕️', duration: '30 min', notes: v.note, handover: { appetite: '', mood: '', mobility: '', concerns: '', administered: '' }, marEntries: [] as Array<{ medication: string; time: string; status: 'given' }>, status: 'completed' as const }))
    : CARE_VISITS;

  return (
    <View style={{ gap: 14 }}>
      {/* Next visit */}
      <View style={{ borderRadius: 22, padding: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.sage, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Volgend bezoek' : 'Next visit'}
          </Text>
          <StatusBadge status="green" label={locale === 'nl-NL' ? 'Bevestigd' : 'Confirmed'} />
        </View>
        <Text style={{ fontSize: 16, color: colors.graphite, fontWeight: '700' }}>
          {locale === 'nl-NL' ? 'Morgen 09:00 — Verpleegkundige Eva Jansen' : 'Tomorrow 09:00 — Nurse Eva Jansen'}
        </Text>
      </View>

      {/* Visit history */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Bezoekgeschiedenis' : 'Visit history'}
      </Text>
      {visits.map((visit) => (
        <View key={visit.id ?? visit.carer + visit.date} style={{
          borderRadius: 18, padding: 16, backgroundColor: colors.paper,
          borderWidth: 1, borderColor: colors.mist, gap: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sagePale, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>{visit.carerAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink }}>{visit.carer}</Text>
              <Text style={{ fontSize: 13, color: colors.pewter, fontWeight: '700' }}>
                {visit.date instanceof Date ? visit.date.toLocaleDateString(locale) : visit.date} · {visit.duration}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, color: colors.graphite, fontWeight: '600' }}>{visit.notes}</Text>

          {/* Handover details */}
          {visit.handover && visit.handover.appetite ? (
            <View style={{ borderRadius: 14, padding: 12, backgroundColor: colors.mist, gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.ink }}>
                {locale === 'nl-NL' ? 'Overdracht' : 'Handover'}
              </Text>
              {Object.entries(visit.handover).filter(([, v]) => v).map(([key, val]) => (
                <Text key={key} style={{ fontSize: 12, color: colors.graphite, fontWeight: '600' }}>
                  <Text style={{ fontWeight: '800' }}>{key}: </Text>{val}
                </Text>
              ))}
            </View>
          ) : null}

          {/* MAR entries */}
          {visit.marEntries.length > 0 && (
            <View style={{ borderRadius: 14, padding: 12, backgroundColor: colors.sagePale, gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.sage }}>MAR</Text>
              {visit.marEntries.map((entry, idx) => (
                <Text key={idx} style={{ fontSize: 12, color: colors.ink, fontWeight: '600' }}>
                  {entry.time} — {entry.medication} ({entry.status})
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
