// ─── Vision Family Dashboard: Main Container (6 tabs) ───
import React, { useState } from 'react';
import { Alert, View, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { LanguageToggle } from '@haven/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { havenIcons, havenNavIcons } from '@haven/ui/src/icons';
// DEMO: mock daily status — wire to live daily_checkins table when authenticated
import { DAILY_STATUS } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';
import { OverviewTab } from './OverviewTab';
import { MedicationsTab } from './MedicationsTab';
import { AlertsTab } from './AlertsTab';
import { CareTab } from './CareTab';
import { VoiceTab } from './VoiceTab';
import { PrivacyTab } from './PrivacyTab';

type TabId = 'overview' | 'medications' | 'alerts' | 'care' | 'voice' | 'privacy';

interface FamilyDashboardProps {
  locale?: string;
}

const STATUS_DOT = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };

function getTabs(nl: boolean): Array<{ id: TabId; label: string; icon: string }> {
  return [
    { id: 'overview', label: nl ? 'Overzicht' : 'Overview', icon: havenNavIcons.home },
    { id: 'medications', label: nl ? 'Medicatie' : 'Medications', icon: havenNavIcons.pills },
    { id: 'alerts', label: nl ? 'Meldingen' : 'Alerts', icon: havenNavIcons.shield },
    { id: 'care', label: nl ? 'Zorg' : 'Care', icon: havenNavIcons.stethoscope },
    { id: 'voice', label: nl ? 'Stem' : 'Voice', icon: havenNavIcons.microphone },
    { id: 'privacy', label: 'Privacy', icon: havenNavIcons.lock },
  ];
}

export function FamilyDashboard({ locale = 'nl-NL' }: FamilyDashboardProps) {
  const nl = locale.startsWith('nl');
  const TABS = getTabs(nl);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const elderName = 'Margaret';
  const familyName = 'Sarah';
  const statusDot = STATUS_DOT[DAILY_STATUS.status as keyof typeof STATUS_DOT] ?? STATUS_DOT.green;
  const { supabase, session } = useAuth();

  async function handleSendAction(action: string) {
    // Use authenticated session (preferred) or fall back to env vars
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const accessToken = session?.access_token ?? process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    let familyMemberId = process.env.EXPO_PUBLIC_FAMILY_MEMBER_ID;
    const configuredElderId = process.env.EXPO_PUBLIC_ELDER_ID ?? '00000000-0000-0000-0000-000000000001';

    // Extract user ID from session JWT if available
    if (session?.access_token && !familyMemberId) {
      try {
        const [, payload] = session.access_token.split('.');
        familyMemberId = JSON.parse(atob(payload))?.sub ?? undefined;
      } catch { /* skip */ }
    }

    if (!supabaseUrl || !accessToken || !familyMemberId) {
      Alert.alert('HAVEN', nl
        ? 'Log eerst in om berichten te versturen.'
        : 'Please log in to send messages.');
      return;
    }

    const messageMap: Record<string, { type: string; content_nl: string; content_en: string }> = {
      heart: { type: 'tekst', content_nl: `${familyName} stuurt een hartje ❤️`, content_en: `${familyName} sends a heart ❤️` },
      checkin: { type: 'tekst', content_nl: `${familyName} checkt in: Hoe gaat het?`, content_en: `${familyName} checks in: How are you?` },
      voice: { type: 'voice_note', content_nl: `${familyName} stuurde een spraakbericht.`, content_en: `${familyName} sent a voice message.` },
      video: { type: 'video_hallo', content_nl: `${familyName} wil videobellen.`, content_en: `${familyName} wants to video call.` },
    };
    const msg = messageMap[action];
    if (!msg) return;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/fn-grandchild-message-send`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          family_member_id: familyMemberId,
          elder_id: configuredElderId,
          display_name: familyName,
          message_type: msg.type,
          content_nl: msg.content_nl,
          content_en: msg.content_en,
        }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error((json as Record<string, string>).error ?? 'Send failed');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab locale={locale} elderName={elderName} familyName={familyName} onSendAction={handleSendAction} />;
      case 'medications':
        return <MedicationsTab locale={locale} />;
      case 'alerts':
        return <AlertsTab locale={locale} session={session} />;
      case 'care':
        return <CareTab locale={locale} />;
      case 'voice':
        return <VoiceTab locale={locale} />;
      case 'privacy':
        return <PrivacyTab locale={locale} elderName={elderName} />;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={{ backgroundColor: colors.paper, borderBottomWidth: 1, borderColor: colors.mist, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
              {nl ? `Goedemorgen, ${familyName}` : `Good morning, ${familyName}`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '600' }}>
                {nl ? `${elderName}'s familiedashboard` : `${elderName}'s family dashboard`}
              </Text>
              <LanguageToggle />
            </View>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
            backgroundColor: DAILY_STATUS.status === 'green' ? semanticColors.successBg : DAILY_STATUS.status === 'amber' ? semanticColors.warningBg : semanticColors.dangerBg,
            borderWidth: 1,
            borderColor: DAILY_STATUS.status === 'green' ? semanticColors.successBorder : DAILY_STATUS.status === 'amber' ? semanticColors.warningBorder : semanticColors.dangerBorder,
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusDot }} />
            <Text style={{
              fontSize: 13, fontWeight: '800',
              color: DAILY_STATUS.status === 'green' ? semanticColors.successText : DAILY_STATUS.status === 'amber' ? semanticColors.warningText : semanticColors.dangerText,
            }}>
              {DAILY_STATUS.status === 'green' ? (nl ? 'Alles goed' : 'All well') : DAILY_STATUS.status === 'amber' ? (nl ? 'Aandacht' : 'Attention') : (nl ? 'Actie nodig' : 'Action needed')}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>

      {/* Fixed Bottom Tab Bar */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.mist, backgroundColor: colors.paper, paddingBottom: Platform.OS === 'android' ? 4 : 20 }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            accessibilityRole="tab"
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center',
              borderTopWidth: 2,
              borderTopColor: activeTab === tab.id ? '#3B82F6' : 'transparent',
            }}
          >
            <MaterialCommunityIcons name={tab.icon as any} size={20} color={activeTab === tab.id ? '#3B82F6' : '#6B7280'} />
            <Text style={{
              fontSize: 10, fontWeight: '700',
              color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
              marginTop: 2,
            }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
