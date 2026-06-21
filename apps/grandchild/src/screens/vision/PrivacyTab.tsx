// ─── Vision Family Dashboard: Privacy Tab ───
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
// DEMO: mock consent settings — wire to live consent_records table when authenticated
import { CONSENT_SETTINGS } from '@haven/ui/src/mockData';

interface PrivacyTabProps {
  locale: string;
  elderName: string;
}

export function PrivacyTab({ locale, elderName }: PrivacyTabProps) {
  const nl = locale.startsWith('nl');

  const items = [
    {
      icon: '💊',
      label: nl ? 'Medicatieweergave' : 'Medication view',
      key: 'medicationView',
      description: nl ? 'Verleend door toestemming van de oudere' : 'Granted by elder consent',
      alwaysHidden: false,
    },
    {
      icon: '📍',
      label: nl ? 'Locatieweergave (vaag)' : 'Location view (fuzzed)',
      key: 'locationView',
      description: nl ? 'Alleen vage gebeurtenissen; nauwkeurig veld geblokkeerd' : 'Fuzzed events only; precise field blocked',
      alwaysHidden: false,
    },
    {
      icon: '🧠',
      label: nl ? 'Metgezel geheugen' : 'Companion memory',
      key: 'companionMemory',
      description: nl ? 'Privé voor de oudere. Niet zichtbaar voor familie.' : 'Private to elder. Not visible to family.',
      alwaysHidden: true,
    },
    {
      icon: '🤝',
      label: nl ? 'BUURT identiteiten derden' : 'BUURT third-party identities',
      key: 'buurtIdentity',
      description: nl ? 'Nooit zichtbaar in familiedashboard.' : 'Never visible in family dashboard.',
      alwaysHidden: true,
    },
    {
      icon: '📊',
      label: nl ? 'Weekoverzicht' : 'Weekly digest',
      key: 'weeklyDigest',
      description: nl ? 'Anonieme gezondheidssamenvatting' : 'Anonymous health summary',
      alwaysHidden: false,
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Consent notice */}
      <View style={{ backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E40AF' }}>🔒 {nl ? 'Toestemming-beperkte toegang' : 'Consent-scoped access'}</Text>
        <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '600' }}>
          {nl
            ? `U ziet alleen wat ${elderName} heeft verleend. Zij kan deze op elk moment wijzigen.`
            : `You only see what ${elderName} has granted. She can change these at any time.`}
        </Text>
      </View>

      {/* Consent items */}
      {items.map((item) => {
        const isOn = !item.alwaysHidden && (CONSENT_SETTINGS as Record<string, boolean>)[item.key];
        return (
          <View key={item.key} style={{
            borderRadius: 16, padding: 14, backgroundColor: colors.paper,
            borderWidth: 1, borderColor: colors.mist,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: colors.pewter, fontWeight: '600' }}>{item.description}</Text>
            </View>
            <StatusBadge
              status={item.alwaysHidden ? 'red' : isOn ? 'green' : 'amber'}
              label={item.alwaysHidden ? (nl ? 'verborgen' : 'hidden') : isOn ? (nl ? 'aan' : 'on') : (nl ? 'uit' : 'off')}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
