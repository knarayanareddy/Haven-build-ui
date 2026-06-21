import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, TouchableOpacity, Text } from 'react-native';
import { useResponsiveLayout } from '../services/platform';
import { useAccessibilityInfo } from '../services/accessibility';
import { useTranslation, LanguageToggle } from '@haven/i18n';
import { useAuth } from '../auth/AuthProvider';
import { CarerClient } from '../services/havenClient';
import { enqueueOffline, getQueueSize } from '../services/offlineQueue';
import { VandaagTab } from '../screens/vision/VandaagTab';
import { HandoverTab } from '../screens/vision/HandoverTab';
import { MARTab } from '../screens/vision/MARTab';
import { SafeguardingTab } from '../screens/vision/SafeguardingTab';
import { VisitsTab } from '../screens/vision/VisitsTab';

type TabId = 'today' | 'handover' | 'mar' | 'safeguarding' | 'visits';

function getTabs(nl: boolean): Array<{ id: TabId; label: string; icon: string }> {
  return [
    { id: 'today', label: nl ? 'Vandaag' : 'Today', icon: '📋' },
    { id: 'handover', label: 'Handover', icon: '📝' },
    { id: 'mar', label: 'MAR-light', icon: '💊' },
    { id: 'safeguarding', label: nl ? 'Veiligheid' : 'Safety', icon: '⚠️' },
    { id: 'visits', label: nl ? 'Bezoeken' : 'Visits', icon: '📅' },
  ];
}

// iPad breakpoint: width >= 768 → persistent Drawer sidebar; width < 768 → Bottom Tabs
export function ResponsiveDrawerTabNavigator({ navigation }: any) {
  const { isIpad } = useResponsiveLayout();
  const { textMultiplier } = useAccessibilityInfo();
  const { locale } = useTranslation();
  const { session } = useAuth();
  const nl = locale.startsWith('nl');
  const TABS = getTabs(nl);
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [isOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(getQueueSize());
  const elderName = 'Margaret van den Berg';
  const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0] ?? '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    const interval = setInterval(() => setOfflineCount(getQueueSize()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteVisit = useCallback(async () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!session || !supabaseUrl) {
      enqueueOffline('visit_log', { elder_id: elderId, visit_date: new Date().toISOString().slice(0, 10), check_out_time: new Date().toISOString() });
      Alert.alert('HAVEN', nl ? 'Bezoek lokaal afgerond — synchroniseert zodra online.' : 'Visit saved locally — will sync when online.');
      return;
    }
    try {
      const client = new CarerClient({ supabaseUrl, accessToken: session.access_token });
      await client.visitLog({
        elder_id: elderId,
        carer_id: (() => { try { const [, p] = session.access_token.split('.'); return JSON.parse(atob(p))?.sub; } catch { return undefined; } })(),
        visit_date: new Date().toISOString().slice(0, 10),
        check_out_time: new Date().toISOString(),
        notes_nl: 'Medicatiecontrole, Welzijnscheck',
      });
      Alert.alert('HAVEN', nl ? 'Bezoek succesvol afgerond en opgeslagen!' : 'Visit completed and saved successfully!');
    } catch {
      enqueueOffline('visit_log', { elder_id: elderId, visit_date: new Date().toISOString().slice(0, 10), check_out_time: new Date().toISOString() });
      Alert.alert('HAVEN', nl ? 'Opslaan mislukt — lokaal bewaard voor later.' : 'Save failed — stored locally for later.');
    }
  }, [session, elderId, nl]);

  function renderTab() {
    switch (activeTab) {
      case 'today':
        return (
          <VandaagTab
            elderName={elderName}
            isOnline={isOnline}
            offlineCount={offlineCount}
            onCompleteVisit={handleCompleteVisit}
            locale={locale}
          />
        );
      case 'handover':
        return <HandoverTab elderName={elderName} isOnline={isOnline} locale={locale} />;
      case 'mar':
        return <MARTab locale={locale} />;
      case 'safeguarding':
        return <SafeguardingTab locale={locale} />;
      case 'visits':
        return <VisitsTab locale={locale} />;
    }
  }

  return (
    <View style={{ flex: 1, flexDirection: isIpad ? 'row' : 'column' }}>
      {/* Header with gradient */}
      {!isIpad && (
        <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 18 * textMultiplier, fontWeight: '900' }}>⌂ HAVEN WACHT</Text>
              <Text style={{ color: '#FECACA', fontSize: 12 * textMultiplier, fontWeight: '600', marginTop: 2 }}>
                {nl ? 'Professioneel zorgportaal' : 'Professional care portal'} — {elderName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LanguageToggle />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                backgroundColor: isOnline ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isOnline ? '#4ADE80' : '#FBBF24' }} />
                <Text style={{ color: isOnline ? '#BBF7D0' : '#FDE68A', fontSize: 12 * textMultiplier, fontWeight: '700' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* iPad sidebar */}
      {isIpad && (
        <View accessibilityRole="navigation" style={{ width: 240, backgroundColor: '#DC2626', paddingTop: 40, paddingHorizontal: 16, justifyContent: 'space-between' }}>
          <View style={{ gap: 20 }}>
            <Text style={{ color: '#fff', fontSize: 20 * textMultiplier, fontWeight: '900' }}>⌂ HAVEN WACHT</Text>
            <Text style={{ color: '#FECACA', fontSize: 12 * textMultiplier, fontWeight: '600' }}>{elderName}</Text>
            <View style={{ gap: 8 }}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  accessibilityRole="link"
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
                    backgroundColor: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : 'transparent',
                  }}
                >
                  <Text style={{ color: activeTab === tab.id ? '#fff' : '#FECACA', fontSize: 15 * textMultiplier, fontWeight: '700' }}>
                    {tab.icon} {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ paddingBottom: 40 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
              backgroundColor: isOnline ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isOnline ? '#4ADE80' : '#FBBF24' }} />
              <Text style={{ color: '#FECACA', fontSize: 12 * textMultiplier, fontWeight: '600' }}>
                {isOnline ? 'Online — EMR Connected' : 'Offline mode'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>

      {/* Phone fixed bottom tabs */}
      {!isIpad && (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', paddingBottom: 4 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1, paddingVertical: 10, alignItems: 'center',
                borderTopWidth: 2,
                borderTopColor: activeTab === tab.id ? '#DC2626' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
              <Text style={{
                fontSize: 10 * textMultiplier, fontWeight: '700',
                color: activeTab === tab.id ? '#DC2626' : '#6B7280',
                marginTop: 2,
              }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
