// ─── Vision Family Dashboard: Privacy Tab ───
// Toggles persist to Supabase consent_records table when authenticated
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../auth/AuthProvider';
// DEMO: mock consent settings — fallback when not authenticated
import { CONSENT_SETTINGS } from '@haven/ui/src/mockData';

interface PrivacyTabProps {
  locale: string;
  elderName: string;
}

interface ConsentState {
  medicationView: boolean;
  locationView: boolean;
  weeklyDigest: boolean;
}

export function PrivacyTab({ locale, elderName }: PrivacyTabProps) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const [consent, setConsent] = useState<ConsentState>({
    medicationView: (CONSENT_SETTINGS as Record<string, boolean>).medicationView ?? true,
    locationView: (CONSENT_SETTINGS as Record<string, boolean>).locationView ?? true,
    weeklyDigest: (CONSENT_SETTINGS as Record<string, boolean>).weeklyDigest ?? true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID ?? process.env.EXPO_PUBLIC_FAMILY_MEMBER_ID;
    if (!url || !elderId) return;

    fetch(`${url}/rest/v1/consent_records?elder_id=eq.${elderId}&select=consent_type,granted&order=created_at.desc`, {
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token,
      },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const state: Partial<ConsentState> = {};
        for (const row of rows) {
          const key = row.consent_type as keyof ConsentState;
          if (key in consent && !(key in state)) state[key] = row.granted === true;
        }
        setConsent((prev) => ({ ...prev, ...state }));
      })
      .catch(() => {});
  }, [session]);

  async function toggleConsent(key: keyof ConsentState, value: boolean) {
    setConsent((prev) => ({ ...prev, [key]: value }));

    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const elderId = process.env.EXPO_PUBLIC_ELDER_ID ?? process.env.EXPO_PUBLIC_FAMILY_MEMBER_ID;
    if (!session || !url || !elderId) return;

    setSaving(true);
    try {
      await fetch(`${url}/rest/v1/consent_records`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.access_token}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          elder_id: elderId,
          consent_type: key,
          granted: value,
          granted_at: new Date().toISOString(),
        }),
      });
    } catch {
      setConsent((prev) => ({ ...prev, [key]: !value }));
      Alert.alert('HAVEN', nl ? 'Opslaan mislukt.' : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const items: Array<{ icon: string; label: string; key: keyof ConsentState | null; description: string; alwaysHidden: boolean }> = [
    {
      icon: 'pill',
      label: nl ? 'Medicatieweergave' : 'Medication view',
      key: 'medicationView',
      description: nl ? 'Verleend door toestemming van de oudere' : 'Granted by elder consent',
      alwaysHidden: false,
    },
    {
      icon: 'map-marker-outline',
      label: nl ? 'Locatieweergave (vaag)' : 'Location view (fuzzed)',
      key: 'locationView',
      description: nl ? 'Alleen vage gebeurtenissen; nauwkeurig veld geblokkeerd' : 'Fuzzed events only; precise field blocked',
      alwaysHidden: false,
    },
    {
      icon: 'brain',
      label: nl ? 'Metgezel geheugen' : 'Companion memory',
      key: null,
      description: nl ? 'Privé voor de oudere. Niet zichtbaar voor familie.' : 'Private to elder. Not visible to family.',
      alwaysHidden: true,
    },
    {
      icon: 'handshake-outline',
      label: nl ? 'BUURT identiteiten derden' : 'BUURT third-party identities',
      key: null,
      description: nl ? 'Nooit zichtbaar in familiedashboard.' : 'Never visible in family dashboard.',
      alwaysHidden: true,
    },
    {
      icon: 'chart-bar',
      label: nl ? 'Weekoverzicht' : 'Weekly digest',
      key: 'weeklyDigest',
      description: nl ? 'Anonieme gezondheidssamenvatting' : 'Anonymous health summary',
      alwaysHidden: false,
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Consent notice */}
      <View style={{ backgroundColor: semanticColors.infoBg, borderWidth: 1, borderColor: '#93C5FD', borderRadius: 16, padding: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={semanticColors.infoText} />
          <Text style={{ fontSize: 13, fontWeight: '800', color: semanticColors.infoText }}>{nl ? 'Toestemming-beperkte toegang' : 'Consent-scoped access'}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '600' }}>
          {nl
            ? `U ziet alleen wat ${elderName} heeft verleend. Zij kan deze op elk moment wijzigen.`
            : `You only see what ${elderName} has granted. She can change these at any time.`}
        </Text>
      </View>

      {/* Live data indicator */}
      {session && (
        <View style={{ backgroundColor: semanticColors.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: semanticColors.successText }}>● {nl ? 'Live — wijzigingen worden opgeslagen' : 'Live — changes are saved'}</Text>
        </View>
      )}

      {/* Consent items */}
      {items.map((item) => {
        const isOn = item.key !== null && !item.alwaysHidden ? consent[item.key] : false;
        return (
          <View key={item.key ?? item.label} style={{
            borderRadius: 16, padding: 14, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: colors.mist,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <MaterialCommunityIcons name={item.icon as any} size={28} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>{item.description}</Text>
            </View>
            {item.alwaysHidden ? (
              <StatusBadge status="red" label={nl ? 'verborgen' : 'hidden'} />
            ) : item.key !== null ? (
              <TouchableOpacity
                onPress={() => toggleConsent(item.key!, !isOn)}
                disabled={saving}
                style={{
                  width: 48, height: 28, borderRadius: 14, justifyContent: 'center',
                  backgroundColor: isOn ? '#6EE7B7' : '#E5E7EB',
                  paddingHorizontal: 3,
                }}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: isOn ? '#065F46' : '#9CA3AF',
                  alignSelf: isOn ? 'flex-end' : 'flex-start',
                }} />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
