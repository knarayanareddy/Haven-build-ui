import React, { useEffect, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { productionScreens } from '@haven/schema/src/screenSchema';
import { useTranslation } from '@haven/i18n';
import type { Locale } from '@haven/contracts/src/haven';
import { ScreenRenderer, ScreenContext, ElderProfile, FamilyMember, MedicationRow, TaskRow, MessageRow, ScamEventRow, BuurtRow, VisitLogRow } from '../renderer/ScreenRenderer';
import { ElderStackParamList } from '../navigation/AppNavigator';
import { useHavenActions } from '../hooks/useHavenActions';
import { useElderData } from '../hooks/useElderData';
import { useAuth } from '../auth/AuthProvider';
import { initializeAndroidDozeGuard } from '../services/dozeGuard';

type Props = NativeStackScreenProps<ElderStackParamList>;

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

export function ElderScreen({ route, navigation }: Props) {
  useEffect(() => {
    initializeAndroidDozeGuard().catch(() => undefined);
  }, []);
  const schema = productionScreens.find((screen) => screen.screenId === route.name) ?? productionScreens[0];
  const actions = useHavenActions(schema.screenId);
  const { session } = useAuth();
  const { locale, t } = useTranslation();
  const elderId = sessionUserId(session) ?? 'signed-out';
  const seed = useMemo(() => loadShell(elderId, locale, t), [elderId, locale, t]);
  const liveData = useElderData(elderId);
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
        navigation.navigate(target);
        return;
      }
      actions.handlePrimaryAction(actionId);
    },
  };
  void session;
  return <ScreenRenderer schema={schema} context={ctx} />;
}
