import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { productionScreens } from '@haven/schema/src/screenSchema';
import { useTranslation } from '@haven/i18n';
import type { Locale } from '@haven/contracts/src/haven';
import { ScreenRenderer, ScreenContext, ElderProfile, FamilyMember, MedicationRow, TaskRow, MessageRow, ScamEventRow, BuurtRow, VisitLogRow } from '../renderer/ScreenRenderer';
import { useHavenActions } from '../hooks/useHavenActions';
import { useElderData } from '../hooks/useElderData';
import { useAuth } from '../auth/AuthProvider';
import { initializeAndroidDozeGuard } from '../services/dozeGuard';

interface Props {
  screenId: string;
  onNavigate: (screenId: string) => void;
  onBack?: () => void;
}

function sessionUserId(session: { access_token?: string } | null): string | null {
  const directUser = (session as unknown as { user?: { id?: string } } | null)?.user?.id;
  if (directUser) return directUser;
  const token = session?.access_token;
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload))?.sub ?? null;
  } catch {
    return null;
  }
}

function loadShell(elderId: string, locale: Locale, t: any): {
  profile: ElderProfile;
  family: FamilyMember[];
  medications: MedicationRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  scamEvents: ScamEventRow[];
  buurt: BuurtRow;
  visits: VisitLogRow[];
} {
  return {
    profile: {
      id: elderId,
      preferredName: t('elder.defaultName'),
      locale: locale,
      postCode4: '',
      safeZoneLabel: t('seed.safeZone'),
    },
    family: [],
    medications: [],
    tasks: [],
    messages: [],
    scamEvents: [],
    buurt: {
      active: false,
      nearbyCount: 0,
      tags: [],
      walkBuddyCount: 0,
      events: [],
    },
    visits: [],
  };
}

export function ElderScreen({ screenId, onNavigate, onBack }: Props) {
  useEffect(() => {
    initializeAndroidDozeGuard().catch(() => undefined);
  }, []);
  const schema = productionScreens.find((screen) => screen.screenId === screenId) ?? productionScreens[0];
  const actions = useHavenActions(schema.screenId);
  const { session } = useAuth();
  const { locale, t } = useTranslation();
  const elderId = sessionUserId(session) ?? 'signed-out';
  const seed = useMemo(() => loadShell(elderId, locale, t), [elderId, locale, t]);
  const liveData = useElderData(elderId);

  if (liveData.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2B4C' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={{ color: '#FFFFFF', marginTop: 12, fontSize: 18 }}>Laden...</Text>
      </View>
    );
  }

  const ctx: ScreenContext = {
    locale: seed.profile.locale,
    now: new Date(),
    profile: seed.profile,
    family: liveData.family.length > 0 ? liveData.family : seed.family,
    medications: liveData.medications.length > 0 ? liveData.medications : seed.medications,
    tasks: liveData.tasks.length > 0 ? liveData.tasks : seed.tasks,
    messages: liveData.messages.length > 0 ? liveData.messages : seed.messages,
    scamEvents: liveData.scamEvents.length > 0 ? liveData.scamEvents : seed.scamEvents,
    buurt: liveData.buurt.active ? liveData.buurt : seed.buurt,
    visits: liveData.visits.length > 0 ? liveData.visits : seed.visits,
    onPrimaryAction: (actionId: string) => {
      if (actionId.startsWith('NAV_')) {
        const target = actionId.replace('NAV_', '');
        onNavigate(target);
        return;
      }
      actions.handlePrimaryAction(actionId);
    },
  };

  return (
    <View style={{ flex: 1 }}>
      {liveData.error && (
        <View style={{ backgroundColor: '#DC2626', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>{liveData.error}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Opnieuw proberen"
            onPress={liveData.retry}
            style={{ marginLeft: 12, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>Opnieuw</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScreenRenderer schema={schema} context={ctx} onBack={onBack} />
    </View>
  );
}
