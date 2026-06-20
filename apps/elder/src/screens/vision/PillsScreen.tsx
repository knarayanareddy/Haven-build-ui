// ─── Vision PillsScreen ───
// Translates havenUIvision/src/components/elder/PillsScreen.tsx to React Native
// Wired to Supabase: fetches real medication_reminders, confirms via fn-voice-pipeline

import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { ProgressBar } from '@haven/ui/src/visionComponents';
import { MEDICATIONS } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';
import { HavenClient } from '../../services/havenClient';
import { enqueueOfflineAction } from '../../services/sqliteOfflineQueue';
import { classifyNetworkError } from '../../state/networkResilience';
import { translateElderError } from '../../services/errorMapper';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

type MedItem = {
  id: string; name: string; dose: string;
  descriptionNl: string; descriptionEn: string;
  time: string; status: 'taken' | 'planned' | 'snoozed';
  stock?: number;
};

function sessionUserId(session: { access_token?: string } | null): string | null {
  const directUser = (session as unknown as { user?: { id?: string } } | null)?.user?.id;
  if (directUser) return directUser;
  const token = session?.access_token;
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload))?.sub ?? null;
  } catch { return null; }
}

function mockMeds(): MedItem[] {
  return MEDICATIONS.map((m) => ({
    id: m.id, name: m.name, dose: m.dose,
    descriptionNl: m.purpose, descriptionEn: m.purpose,
    time: m.times[0], status: (m.taken[0] ? 'taken' : 'planned') as 'taken' | 'planned' | 'snoozed',
    stock: m.stock,
  }));
}

export function renderVisionPills(ctx: ScreenContext): React.ReactNode {
  return <VisionPillsInner ctx={ctx} />;
}

function VisionPillsInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, medications: ctxMeds } = ctx;
  const { session } = useAuth();
  const elderId = sessionUserId(session);
  const client = session ? new HavenClient({ supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!, accessToken: session.access_token }) : null;

  const [liveMeds, setLiveMeds] = useState<MedItem[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Try fetching real medications from Supabase; fall back to mock data
  useEffect(() => {
    if (!client || !elderId) return;
    client.rest<Array<Record<string, unknown>>>(`medication_reminders?elder_id=eq.${elderId}&select=id,medication_name,dose,reminder_time,status,stock_remaining`)
      .then((rows) => {
        if (rows && rows.length > 0) {
          setLiveMeds(rows.map((r) => ({
            id: String(r.id), name: String(r.medication_name ?? ''), dose: String(r.dose ?? ''),
            descriptionNl: String(r.medication_name ?? ''), descriptionEn: String(r.medication_name ?? ''),
            time: String(r.reminder_time ?? '08:00').slice(0, 5),
            status: r.status === 'taken' ? 'taken' : 'planned',
            stock: typeof r.stock_remaining === 'number' ? r.stock_remaining : undefined,
          })));
        }
      })
      .catch(() => { /* fall back to mock data silently */ });
  }, [!!client, elderId]);

  const baseMeds = ctxMeds.length > 0 ? ctxMeds : mockMeds();
  const meds = liveMeds ?? baseMeds;

  const taken = meds.filter((m) => m.status === 'taken').length;
  const total = meds.length;
  const progress = total > 0 ? taken / total : 0;

  const [confirmMed, setConfirmMed] = useState<string | null>(null);
  const confirmingMed = meds.find((m) => m.id === confirmMed);

  // Confirm medication via Supabase (with offline fallback)
  async function confirmMedication(medId: string) {
    setConfirming(medId);
    try {
      if (client && elderId) {
        await client.voice({ elder_id: elderId, screen_id: 'PILLS', transcript_text: 'I took it', locale: locale as 'en-GB' | 'nl-NL' });
      } else {
        enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medId, screen_id: 'PILLS' });
      }
      // Update local state to show taken
      if (liveMeds) {
        setLiveMeds((prev) => prev?.map((m) => m.id === medId ? { ...m, status: 'taken' } : m) ?? null);
      }
    } catch (error) {
      if (classifyNetworkError(error) === 'offline') {
        enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medId, screen_id: 'PILLS' });
        Alert.alert('HAVEN', locale === 'nl-NL' ? 'Offline opgeslagen — synchroniseert zodra online.' : 'Saved offline — will sync when online.');
      } else {
        Alert.alert('HAVEN', translateElderError(error));
      }
    } finally {
      setConfirming(null);
    }
  }

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
              onPress={() => { confirmMedication(confirmMed!); setConfirmMed(null); }}
              disabled={!!confirming}
              style={{ backgroundColor: colors.sage, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: confirming ? 0.6 : 1 }}
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
