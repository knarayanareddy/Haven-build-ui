// ─── Vision BuurtScreen ───
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { SubTabBar, ProgressBar } from '@haven/ui/src/visionComponents';
import { BUURT_MATCHES, COMMUNITY_EVENTS } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionBuurt(ctx: ScreenContext): React.ReactNode {
  return <VisionBuurtInner ctx={ctx} />;
}

function VisionBuurtInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, buurt } = ctx;
  const [activeTab, setActiveTab] = useState('neighbours');
  const tabs = [
    { id: 'neighbours', label: locale === 'nl-NL' ? 'Buren' : 'Neighbours' },
    { id: 'events', label: locale === 'nl-NL' ? 'Activiteiten' : 'Events' },
    { id: 'interests', label: locale === 'nl-NL' ? 'Interesses' : 'Interests' },
  ];

  if (!buurt.active) {
    return (
      <View style={{ gap: 14 }}>
        <View style={{ borderRadius: 22, padding: 24, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Buurtverbinder' : 'Neighbourhood Connector'}
          </Text>
          <Text style={{ fontSize: 16, color: colors.graphite, fontWeight: '700' }}>
            {locale === 'nl-NL' ? 'Ontmoet buren in uw buurt die dezelfde interesses hebben. Uw privacy is altijd beschermd.' : 'Meet neighbours nearby who share your interests. Your privacy is always protected.'}
          </Text>
          <TouchableOpacity
            onPress={() => ctx.onPrimaryAction('OPT_IN_BUURT')}
            style={{ backgroundColor: colors.sage, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {locale === 'nl-NL' ? 'Activeer buurtverbinder' : 'Activate neighbourhood'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ borderRadius: 16, padding: 12, backgroundColor: colors.sagePale }}>
          <Text style={{ fontSize: 13, color: colors.sage, fontWeight: '700' }}>
            {locale === 'nl-NL' ? 'Uw exacte adres wordt nooit gedeeld — alleen uw PC4 postcode.' : 'Your exact address is never shared — only your PC4 postal code.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {/* Privacy banner */}
      <View style={{ borderRadius: 14, padding: 10, backgroundColor: colors.sagePale, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 14 }}>🔒</Text>
        <Text style={{ fontSize: 13, color: colors.sage, fontWeight: '700' }}>
          {locale === 'nl-NL' ? 'Locatie vervaagd — alleen PC4' : 'Location fuzzed — PC4 only'}
        </Text>
      </View>

      <SubTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'neighbours' && (
        <View style={{ gap: 10 }}>
          {BUURT_MATCHES.map((match) => (
            <View key={match.id} style={{
              borderRadius: 18, padding: 16, backgroundColor: colors.paper,
              borderWidth: 1, borderColor: colors.mist, gap: 8,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.slatePale, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22 }}>👤</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{match.alias}</Text>
                    <Text style={{ fontSize: 13, color: colors.pewter, fontWeight: '700' }}>{match.distance} · {match.lastActive}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: colors.sagePale, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: colors.sage }}>{match.matchScore}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {match.interests.map((i) => (
                  <View key={i} style={{ backgroundColor: colors.mist, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{i}</Text>
                  </View>
                ))}
              </View>
              {match.available && (
                <TouchableOpacity
                  onPress={() => ctx.onPrimaryAction(`BUURT_CONNECT:${match.id}`)}
                  style={{ backgroundColor: colors.sage, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900' }}>
                    {locale === 'nl-NL' ? 'Maak contact' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {activeTab === 'events' && (
        <View style={{ gap: 10 }}>
          {COMMUNITY_EVENTS.map((event) => (
            <View key={event.id} style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>{event.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{event.title}</Text>
                  <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '700' }}>{event.date} · {event.location}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: colors.graphite, fontWeight: '600' }}>{event.description}</Text>
              <Text style={{ fontSize: 13, color: colors.sage, fontWeight: '800' }}>{event.attending} {locale === 'nl-NL' ? 'deelnemers' : 'attending'}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'interests' && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, color: colors.graphite, fontWeight: '700' }}>
            {locale === 'nl-NL' ? 'Selecteer uw interesses om betere matches te krijgen:' : 'Select your interests for better matches:'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Walking', 'Gardening', 'Reading', 'Coffee', 'Music', 'Cooking', 'Card games', 'Crafts', 'Photography'].map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => ctx.onPrimaryAction(`BUURT_INTEREST:${interest}`)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{interest}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
