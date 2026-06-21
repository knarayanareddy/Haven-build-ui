// ─── Vision Carer: Veiligheid (Safeguarding) Tab ───
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
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
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>⚠️ {nl ? 'Meldcode Huiselijk Geweld en Kindermishandeling' : 'Domestic Violence & Child Abuse Reporting Code'}</Text>
        <Text style={{ fontSize: 12, color: '#A16207', fontWeight: '600' }}>
          {nl ? 'Stap-voor-stap begeleiding bij meldingen. Incidentrapporten via fn-incident-report.' : 'Step-by-step guidance for reporting. Incident reports via fn-incident-report.'}
        </Text>
      </View>

      {/* Safeguarding items */}
      {SAFEGUARDING_ITEMS.map((item) => (
        <View
          key={item.id}
          style={{
            borderRadius: 18, padding: 16, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: item.status === 'resolved' ? '#BBF7D0' : '#FDE68A',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{item.status === 'resolved' ? '✅' : '⚠️'}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>{item.description}</Text>
              <StatusBadge
                status={item.status === 'resolved' ? 'green' : 'amber'}
                label={item.status}
              />
            </View>
          </View>
          {item.resolution && (
            <View style={{ backgroundColor: '#D1FAE5', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '700' }}>✓ {item.resolution}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Meldcode steps */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{nl ? 'Meldcode stappen' : 'Reporting code steps'}</Text>
        {MELDCODE_STEPS.map((step) => (
          <View key={step.step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
              backgroundColor: step.done ? colors.sage : colors.mist,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: step.done ? '#fff' : colors.graphite }}>
                {step.done ? '✓' : step.step}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{step.title}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* New report button */}
      <TouchableOpacity
        style={{ backgroundColor: colors.amber, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>+ {nl ? 'Nieuwe veiligheidsmelding aanmaken' : 'Create new safeguarding report'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
