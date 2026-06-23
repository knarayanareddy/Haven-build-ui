// ─── Vision ShieldScreen ───
// Translates havenUIvision/src/components/elder/ShieldScreen.tsx to React Native

import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typeScale, touch } from '@haven/ui/src/tokens';
import { pillarGradients } from '@haven/ui/src/visionColors';
import { StatusBadge, SubTabBar } from '@haven/ui/src/visionComponents';
import { SCAM_EVENTS } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

const COACHING_TIPS = [
  { title: 'Hang op', tip: 'Echte banken bellen nooit om gegevens te vragen. Twijfelt u? Hang op en bel zelf uw bank.', titleEn: 'Hang up', tipEn: 'Real banks never call to ask for details. In doubt? Hang up and call your bank yourself.' },
  { title: 'Klik niet', tip: 'Open nooit een link in een sms of e-mail van onbekenden. HAVEN blokkeert verdachte links automatisch.', titleEn: 'Don\'t click', tipEn: 'Never open a link in an SMS or email from strangers. HAVEN blocks suspicious links automatically.' },
  { title: 'Deel nooit', tip: 'Deel nooit uw pincode, wachtwoord of BSN met iemand. Geen enkele instantie vraagt dit telefonisch.', titleEn: 'Never share', tipEn: 'Never share your PIN, password or BSN with anyone. No authority asks for this by phone.' },
  { title: 'Vraag hulp', tip: 'Twijfelt u over een bericht? Vraag HAVEN of uw familie. Wij controleren het voor u.', titleEn: 'Ask for help', tipEn: 'Unsure about a message? Ask HAVEN or your family. We\'ll check it for you.' },
  { title: 'Vertrouw uzelf', tip: 'Als iets te mooi klinkt om waar te zijn, is het dat waarschijnlijk ook. Uw gevoel klopt vaak.', titleEn: 'Trust yourself', tipEn: 'If it sounds too good to be true, it probably is. Your gut feeling is often right.' },
];

export function renderVisionShield(ctx: ScreenContext): React.ReactNode {
  return <VisionShieldInner ctx={ctx} />;
}

function VisionShieldInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, scamEvents: ctxEvents } = ctx;
  const events = ctxEvents.length > 0
    ? ctxEvents.map((e) => ({ ...e, riskLevel: e.level === 'rood' || e.level === 'zwart' ? 'red' as const : e.level === 'amber' ? 'amber' as const : 'green' as const, resolved: e.notified, riskScore: e.score, description: e.explanation, title: e.channel, type: e.channel }))
    : SCAM_EVENTS;

  const totalScore = events.length > 0 ? Math.round(100 - events.reduce((sum, e) => sum + (100 - e.riskScore), 0) / events.length) : 90;
  const [showCoaching, setShowCoaching] = useState(false);
  const [coachingIdx, setCoachingIdx] = useState(0);
  const activeEvents = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);

  return (
    <View style={{ gap: 14 }}>
      {/* Shield Score banner */}
      <LinearGradient
        colors={pillarGradients.shield}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, padding: 22, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 48, fontWeight: '900', fontFamily: 'Nunito-Black', color: '#FFFFFF' }}>{totalScore}</Text>
        <Text style={{ fontSize: typeScale.caption, fontWeight: '700', fontFamily: 'Nunito-Bold', color: 'rgba(255,255,255,0.85)' }}>

          {locale === 'nl-NL' ? 'Schildscore' : 'Shield Score'} / 100
        </Text>
      </LinearGradient>

      {/* Is this real? + Coaching */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={locale === 'nl-NL' ? 'Is dit echt?' : 'Is this real?'}
          onPress={() => ctx.onPrimaryAction('IS_THIS_REAL')}
          style={{ flex: 1, backgroundColor: colors.slate, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
        >
          <Text style={{ color: '#fff', fontSize: typeScale.caption, fontWeight: '900', fontFamily: 'Nunito-Black' }}>

            {locale === 'nl-NL' ? 'Is dit echt?' : 'Is this real?'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={locale === 'nl-NL' ? 'Coaching tips' : 'Coaching tips'}
          onPress={() => { setShowCoaching(true); setCoachingIdx(0); }}
          style={{ flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
        >
          <Text style={{ color: colors.slate, fontSize: typeScale.caption, fontWeight: '900', fontFamily: 'Nunito-Black' }}>

            {locale === 'nl-NL' ? 'Coaching tips' : 'Coaching tips'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active alerts */}
      {activeEvents.length > 0 && (
        <>
          <Text style={{ fontSize: 20, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Actieve meldingen' : 'Active alerts'} ({activeEvents.length})
          </Text>
          {activeEvents.map((event) => (
            <View key={event.id} style={{
              borderRadius: 18, padding: 16, backgroundColor: colors.paper,
              borderWidth: 1, borderColor: event.riskLevel === 'red' ? colors.rose : colors.amber,
              gap: 8,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>{event.title}</Text>
                <StatusBadge
                  status={event.riskLevel === 'red' ? 'red' : 'amber'}
                  label={`${event.riskScore}%`}
                />
              </View>
              <Text style={{ fontSize: typeScale.caption, color: colors.graphite, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>{event.description}</Text>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={locale === 'nl-NL' ? 'Markeer als veilig' : 'Mark as safe'}
                onPress={() => ctx.onPrimaryAction(`RESOLVE_SCAM:${event.id}`)}
                style={{ backgroundColor: colors.sage, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 4, minHeight: touch.minimum }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontFamily: 'Nunito-Black' }}>
                  {locale === 'nl-NL' ? 'Markeer als veilig' : 'Mark as safe'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Resolved */}
      {resolvedEvents.length > 0 && (
        <>
          <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.pewter }}>
            {locale === 'nl-NL' ? 'Opgelost' : 'Resolved'} ({resolvedEvents.length})
          </Text>
          {resolvedEvents.map((event) => (
            <View key={event.id} style={{
              borderRadius: 18, padding: 14, backgroundColor: colors.paper,
              borderWidth: 1, borderColor: colors.mist, opacity: 0.6,
            }}>
              <Text style={{ fontSize: typeScale.caption, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{event.title}</Text>
              <Text style={{ fontSize: typeScale.caption, color: colors.pewter, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>{event.description}</Text>

            </View>
          ))}
        </>
      )}

      {/* Coaching modal */}
      <Modal visible={showCoaching} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.paper, padding: 24, gap: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', fontFamily: 'Nunito-Black', color: colors.ink }}>
              {locale === 'nl-NL' ? COACHING_TIPS[coachingIdx].title : COACHING_TIPS[coachingIdx].titleEn}
            </Text>
            <Text style={{ fontSize: typeScale.caption, color: colors.graphite, fontWeight: '700', fontFamily: 'Nunito-Bold', lineHeight: 24 }}>

              {locale === 'nl-NL' ? COACHING_TIPS[coachingIdx].tip : COACHING_TIPS[coachingIdx].tipEn}
            </Text>
            <Text style={{ fontSize: typeScale.caption, color: colors.pewter, textAlign: 'center' }}>
              {coachingIdx + 1} / {COACHING_TIPS.length}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {coachingIdx > 0 && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={locale === 'nl-NL' ? 'Vorige' : 'Previous'}
                  onPress={() => setCoachingIdx((i) => i - 1)}
                  style={{ flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
                >
                  <Text style={{ color: colors.slate, fontWeight: '900', fontFamily: 'Nunito-Black' }}>{locale === 'nl-NL' ? 'Vorige' : 'Previous'}</Text>
                </TouchableOpacity>
              )}
              {coachingIdx < COACHING_TIPS.length - 1 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={locale === 'nl-NL' ? 'Volgende' : 'Next'}
                  onPress={() => setCoachingIdx((i) => i + 1)}
                  style={{ flex: 1, backgroundColor: colors.slate, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontFamily: 'Nunito-Black' }}>{locale === 'nl-NL' ? 'Volgende' : 'Next'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={locale === 'nl-NL' ? 'Sluiten' : 'Close'}
                  onPress={() => setShowCoaching(false)}
                  style={{ flex: 1, backgroundColor: colors.sage, borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: touch.minimum }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontFamily: 'Nunito-Black' }}>{locale === 'nl-NL' ? 'Sluiten' : 'Close'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
