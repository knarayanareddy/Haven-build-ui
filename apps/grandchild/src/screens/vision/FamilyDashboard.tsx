// ─── Vision Family Dashboard: Main Container (6 tabs) ───
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@haven/ui/src/tokens';
// DEMO: mock daily status — wire to live daily_checkins table when authenticated
import { DAILY_STATUS } from '@haven/ui/src/mockData';
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
    { id: 'overview', label: nl ? 'Overzicht' : 'Overview', icon: '🏠' },
    { id: 'medications', label: nl ? 'Medicatie' : 'Medications', icon: '💊' },
    { id: 'alerts', label: nl ? 'Meldingen' : 'Alerts', icon: '🛡️' },
    { id: 'care', label: nl ? 'Zorg' : 'Care', icon: '🩺' },
    { id: 'voice', label: nl ? 'Stem' : 'Voice', icon: '🎙️' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
  ];
}

export function FamilyDashboard({ locale = 'nl-NL' }: FamilyDashboardProps) {
  const nl = locale.startsWith('nl');
  const TABS = getTabs(nl);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const elderName = 'Margaret';
  const familyName = 'Sarah';
  const statusDot = STATUS_DOT[DAILY_STATUS.status as keyof typeof STATUS_DOT] ?? STATUS_DOT.green;

  async function handleSendAction(action: string) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const accessToken = process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
    const familyMemberId = process.env.EXPO_PUBLIC_FAMILY_MEMBER_ID;
    const configuredElderId = process.env.EXPO_PUBLIC_ELDER_ID ?? '00000000-0000-0000-0000-000000000001';

    if (!supabaseUrl || !accessToken || !familyMemberId) return;

    const messageMap: Record<string, { type: string; content_nl: string; content_en: string }> = {
      heart: { type: 'heart', content_nl: `${familyName} stuurt een hartje.`, content_en: `${familyName} sends a heart.` },
      checkin: { type: 'check_in', content_nl: `${familyName} checkt in: Hoe gaat het?`, content_en: `${familyName} checks in: How are you?` },
      voice: { type: 'voice_message', content_nl: `${familyName} stuurde een spraakbericht.`, content_en: `${familyName} sent a voice message.` },
      video: { type: 'video_call', content_nl: `${familyName} wil videobellen.`, content_en: `${familyName} wants to video call.` },
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
        return <AlertsTab locale={locale} />;
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
          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
              {nl ? `Goedemorgen, ${familyName}` : `Good morning, ${familyName}`} 👋
            </Text>
            <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '600', marginTop: 2 }}>
              {nl ? `${elderName}'s familiedashboard` : `${elderName}'s family dashboard`}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
            backgroundColor: DAILY_STATUS.status === 'green' ? '#D1FAE5' : DAILY_STATUS.status === 'amber' ? '#FEF3C7' : '#FEE2E2',
            borderWidth: 1,
            borderColor: DAILY_STATUS.status === 'green' ? '#6EE7B7' : DAILY_STATUS.status === 'amber' ? '#FDE68A' : '#FECACA',
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusDot }} />
            <Text style={{
              fontSize: 13, fontWeight: '800',
              color: DAILY_STATUS.status === 'green' ? '#065F46' : DAILY_STATUS.status === 'amber' ? '#92400E' : '#991B1B',
            }}>
              {DAILY_STATUS.status === 'green' ? (nl ? 'Alles goed' : 'All well') : DAILY_STATUS.status === 'amber' ? (nl ? 'Aandacht' : 'Attention') : (nl ? 'Actie nodig' : 'Action needed')}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.mist, backgroundColor: colors.paper }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            accessibilityRole="tab"
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1, paddingVertical: 8, alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.id ? '#3B82F6' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 9, fontWeight: '700',
              color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
            }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </SafeAreaView>
  );
}
