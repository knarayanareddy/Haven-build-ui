// ─── Vision PillsScreen ───
// Translates havenUIvision/src/components/elder/PillsScreen.tsx to React Native

import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { ProgressBar } from '@haven/ui/src/visionComponents';
import { MEDICATIONS } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionPills(ctx: ScreenContext): React.ReactNode {
  return <VisionPillsInner ctx={ctx} />;
}

function VisionPillsInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, medications: ctxMeds } = ctx;
  const meds = ctxMeds.length > 0 ? ctxMeds : MEDICATIONS.map((m) => ({
    id: m.id, name: m.name, dose: m.dose,
    descriptionNl: m.purpose, descriptionEn: m.purpose,
    time: m.times[0], status: (m.taken[0] ? 'taken' : 'planned') as 'taken' | 'planned' | 'snoozed',
    stock: m.stock,
  }));

  const taken = meds.filter((m) => m.status === 'taken').length;
  const total = meds.length;
  const progress = total > 0 ? taken / total : 0;

  const [confirmMed, setConfirmMed] = useState<string | null>(null);
  const confirmingMed = meds.find((m) => m.id === confirmMed);

  return (
    <View style={{ gap: 14 }}>
      {/* Progress */}
      <View style={{ borderRadius: 22, padding: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Voortgang vandaag' : 'Today\'s progress'}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.sage }}>{taken}/{total}</Text>
        </View>
        <ProgressBar progress={progress} color={colors.sage} height={10} />
      </View>

      {/* Medication cards */}
      {meds.map((med) => {
        const isTaken = med.status === 'taken';
        const isLowStock = (med.stock ?? 99) < 7;
        return (
          <View key={med.id} style={{
            borderRadius: 22, padding: 18, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: isTaken ? colors.sage : colors.mist,
            opacity: isTaken ? 0.7 : 1, gap: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: isTaken ? colors.sage : colors.amber }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>{med.name}</Text>
                <Text style={{ fontSize: 15, color: colors.pewter, fontWeight: '700' }}>{med.dose} — {locale === 'nl-NL' ? med.descriptionNl : med.descriptionEn}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', color: isTaken ? colors.sage : colors.slate }}>
                {isTaken ? '✓' : med.time}
              </Text>
            </View>

            {isLowStock && !isTaken && (
              <View style={{ backgroundColor: colors.amberPale, borderRadius: 10, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.amber }}>
                  {locale === 'nl-NL' ? `Nog ${med.stock} over — bestel bij` : `${med.stock} left — reorder soon`}
                </Text>
              </View>
            )}

            {!isTaken && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${locale === 'nl-NL' ? 'Neem' : 'Take'} ${med.name}`}
                  onPress={() => setConfirmMed(med.id)}
                  style={{ flex: 1, backgroundColor: colors.sage, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
                    {locale === 'nl-NL' ? 'Ingenomen ✓' : 'Taken ✓'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => ctx.onPrimaryAction(`SNOOZE:${med.id}`)}
                  style={{ flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.slate, fontSize: 16, fontWeight: '900' }}>
                    {locale === 'nl-NL' ? 'Later' : 'Later'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* OCR scan placeholder */}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => ctx.onPrimaryAction('SCAN_MED')}
        style={{ borderRadius: 18, padding: 16, backgroundColor: colors.slatePale, borderWidth: 1, borderColor: colors.mist, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Text style={{ fontSize: 22 }}>📷</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.slate }}>
          {locale === 'nl-NL' ? 'Scan nieuw medicijn' : 'Scan new medication'}
        </Text>
      </TouchableOpacity>

      {/* Confirm modal */}
      <Modal visible={!!confirmMed} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ borderRadius: 22, padding: 24, backgroundColor: colors.paper, gap: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink }}>
              {locale === 'nl-NL' ? 'Bevestig medicatie' : 'Confirm medication'}
            </Text>
            <Text style={{ fontSize: 18, color: colors.graphite, fontWeight: '700' }}>
              {locale === 'nl-NL'
                ? `Heeft u ${confirmingMed?.name} ${confirmingMed?.dose} zojuist ingenomen?`
                : `Have you just taken ${confirmingMed?.name} ${confirmingMed?.dose}?`}
            </Text>
            <TouchableOpacity
              onPress={() => { ctx.onPrimaryAction(`TAKE:${confirmMed}`); setConfirmMed(null); }}
              style={{ backgroundColor: colors.sage, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>
                {locale === 'nl-NL' ? 'Ja, ingenomen ✓' : 'Yes, taken ✓'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmMed(null)}
              style={{ backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: colors.slate, fontSize: 18, fontWeight: '900' }}>
                {locale === 'nl-NL' ? 'Annuleer' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
