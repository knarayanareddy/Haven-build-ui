// ─── Vision KompasScreen ───
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, typeScale, touch } from '@haven/ui/src/tokens';
import { SubTabBar, StatusBadge } from '@haven/ui/src/visionComponents';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { havenIcons } from '@haven/ui/src/icons';
// DEMO: mock safe zone/elder — acceptable fixture (live geofencing needs location permissions)
import { SAFE_ZONE, ELDER } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionKompas(ctx: ScreenContext): React.ReactNode {
  return <VisionKompasInner ctx={ctx} />;
}

function VisionKompasInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, profile, family } = ctx;
  const [activeTab, setActiveTab] = useState('location');
  const primary = family.find((f) => f.isPrimary) ?? family[0];
  const tabs = [
    { id: 'location', label: locale === 'nl-NL' ? 'Locatie' : 'Location', icon: havenIcons.location },
    { id: 'emergency', label: locale === 'nl-NL' ? 'Noodprofiel' : 'Emergency', icon: havenIcons.emergency },
    { id: 'night', label: locale === 'nl-NL' ? 'Nachtmodus' : 'Night Mode', icon: havenIcons.moon },
  ];

  return (
    <View style={{ gap: 14 }}>
      <SubTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'location' && (
        <View style={{ gap: 14 }}>
          {/* Safe zone status */}
          <StatusBadge
            status={SAFE_ZONE.currentlyInside ? 'green' : 'red'}
            label={SAFE_ZONE.currentlyInside
              ? (locale === 'nl-NL' ? 'Binnen veilige zone' : 'Inside safe zone')
              : (locale === 'nl-NL' ? 'Buiten veilige zone' : 'Outside safe zone')}
          />

          {/* Map placeholder */}
          <View style={{
            borderRadius: 22, height: 200, backgroundColor: colors.sagePale,
            borderWidth: 1, borderColor: colors.mist, justifyContent: 'center', alignItems: 'center',
          }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.sage, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="home-outline" size={36} color={colors.sage} />
            </View>
            <Text style={{ fontSize: typeScale.caption, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.sage, marginTop: 8 }}>

              {profile.safeZoneLabel ?? 'Thuis'} · {SAFE_ZONE.radius}m
            </Text>
          </View>

          <Text style={{ fontSize: typeScale.caption, color: colors.pewter, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>

            {locale === 'nl-NL' ? 'Uw exacte locatie wordt alleen gedeeld met uw veilige contactpersonen.' : 'Your exact location is shared only with your safety contacts.'}
          </Text>
        </View>
      )}

      {activeTab === 'emergency' && (
        <View style={{ gap: 14 }}>
          {/* Emergency profile card */}
          <View style={{ borderRadius: 22, padding: 20, backgroundColor: colors.rosePale, borderWidth: 1, borderColor: colors.rose, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>
              {locale === 'nl-NL' ? 'Noodprofiel' : 'Emergency Profile'}
            </Text>
            <View style={{ gap: 8 }}>
              {[
                { label: locale === 'nl-NL' ? 'Naam' : 'Name', value: ELDER.name },
                { label: locale === 'nl-NL' ? 'Leeftijd' : 'Age', value: `${ELDER.age}` },
                { label: locale === 'nl-NL' ? 'Adres' : 'Address', value: ELDER.address },
                { label: locale === 'nl-NL' ? 'Medicijnen' : 'Medications', value: 'Metformin, Lisinopril, Atorvastatin, Aspirin' },
                { label: locale === 'nl-NL' ? 'Contact' : 'Emergency contact', value: primary?.name ?? 'Sarah van den Berg' },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: typeScale.caption, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink, width: 100 }}>{item.label}:</Text>
                  <Text style={{ fontSize: typeScale.caption, fontWeight: '600', fontFamily: 'Nunito-Black', color: colors.graphite, flex: 1 }}>{item.value}</Text>

                </View>
              ))}
            </View>
          </View>

          {/* Emergency buttons */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={locale === 'nl-NL' ? 'Bel 112' : 'Call 112'}
            onPress={() => ctx.onPrimaryAction('EMERGENCY')}
            style={{ backgroundColor: colors.rose, borderRadius: 16, paddingVertical: 18, alignItems: 'center', minHeight: touch.minimum }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', fontFamily: 'Nunito-Black' }}>
              {locale === 'nl-NL' ? 'Bel 112' : 'Call 112'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={primary ? `${locale === 'nl-NL' ? 'Bel' : 'Call'} ${primary.name}` : (locale === 'nl-NL' ? 'Bel familie' : 'Call family')}
            onPress={() => ctx.onPrimaryAction('CALL_FAMILY')}
            style={{ backgroundColor: colors.slate, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
          >
            <Text style={{ color: '#fff', fontSize: typeScale.caption, fontWeight: '900', fontFamily: 'Nunito-Black' }}>

              {primary ? `${locale === 'nl-NL' ? 'Bel' : 'Call'} ${primary.name}` : (locale === 'nl-NL' ? 'Bel familie' : 'Call family')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'night' && (
        <View style={{ gap: 14 }}>
          <View style={{ borderRadius: 22, padding: 20, backgroundColor: '#1e1b4b', gap: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: 'Nunito-Black', color: '#fff' }}>
              {locale === 'nl-NL' ? 'Nachtmodus' : 'Night Mode'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: typeScale.caption, fontWeight: '700', fontFamily: 'Nunito-Bold', color: 'rgba(255,255,255,0.7)' }}>

                {locale === 'nl-NL' ? 'Stilte van' : 'Quiet from'}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: 'Nunito-Black', color: '#fff' }}>{SAFE_ZONE.nightMode.quietFrom}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: typeScale.caption, fontWeight: '700', fontFamily: 'Nunito-Bold', color: 'rgba(255,255,255,0.7)' }}>

                {locale === 'nl-NL' ? 'Stilte tot' : 'Quiet until'}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: 'Nunito-Black', color: '#fff' }}>{SAFE_ZONE.nightMode.quietUntil}</Text>
            </View>
            <Text style={{ fontSize: typeScale.caption, color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>

              {locale === 'nl-NL' ? 'Tijdens stille uren worden alleen noodmeldingen doorgelaten.' : 'During quiet hours, only emergency notifications are allowed.'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={SAFE_ZONE.nightMode.enabled ? (locale === 'nl-NL' ? 'Nachtmodus uitschakelen' : 'Disable night mode') : (locale === 'nl-NL' ? 'Nachtmodus inschakelen' : 'Enable night mode')}
            onPress={() => ctx.onPrimaryAction('TOGGLE_NIGHT')}
            style={{ backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
          >
            <Text style={{ color: colors.slate, fontSize: typeScale.caption, fontWeight: '900', fontFamily: 'Nunito-Black' }}>

              {SAFE_ZONE.nightMode.enabled
                ? (locale === 'nl-NL' ? 'Nachtmodus uitschakelen' : 'Disable night mode')
                : (locale === 'nl-NL' ? 'Nachtmodus inschakelen' : 'Enable night mode')}
            </Text>
          </TouchableOpacity>

          {/* Wellness check */}
          <Text style={{ fontSize: 20, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Welzijnscheck' : 'Wellness Check'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { iconName: 'emoticon-happy-outline' as const, action: 'WELLNESS_GOOD', label: locale === 'nl-NL' ? 'Goed' : 'Good' },
              { iconName: 'emoticon-neutral-outline' as const, action: 'WELLNESS_OK', label: locale === 'nl-NL' ? 'Oké' : 'Okay' },
              { iconName: 'head-question-outline' as const, action: 'COGNITIVE', label: locale === 'nl-NL' ? 'Vraag' : 'Question' },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.action}
                accessibilityRole="button"
                accessibilityLabel={btn.label}
                onPress={() => ctx.onPrimaryAction(btn.action)}
                style={{ flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
              >
                <MaterialCommunityIcons name={btn.iconName} size={28} color={colors.pewter} />
                <Text style={{ fontSize: typeScale.caption, fontWeight: '700', fontFamily: 'Nunito-Bold', color: colors.pewter, marginTop: 4 }}>{btn.label}</Text>

              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
