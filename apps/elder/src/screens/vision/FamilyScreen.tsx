// ─── Vision FamilyScreen ───
// Translates havenUIvision/src/components/elder/FamilyScreen.tsx to React Native

import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, typeScale, touch } from '@haven/ui/src/tokens';
import { SubTabBar } from '@haven/ui/src/visionComponents';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { havenIcons } from '@haven/ui/src/icons';
// DEMO: mock messages/stories — messages partially wired to live; stories remain fixture
import { FAMILY_MESSAGES, LIFE_STORIES } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionFamily(ctx: ScreenContext): React.ReactNode {
  return <VisionFamilyInner ctx={ctx} />;
}

function VisionFamilyInner({ ctx }: { ctx: ScreenContext }) {
  const { locale, family, messages: ctxMsgs } = ctx;
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const messages = ctxMsgs.length > 0
    ? ctxMsgs.map((m) => ({ ...m, fromId: m.from, avatar: m.kind === 'heart' ? '💙' : '👤', content: m.body, type: m.kind, timestamp: new Date(), read: !m.unread }))
    : FAMILY_MESSAGES;

  const tabs = [
    { id: 'messages', label: locale === 'nl-NL' ? 'Berichten' : 'Messages', icon: havenIcons.chat },
    { id: 'call', label: locale === 'nl-NL' ? 'Bellen' : 'Call', icon: havenIcons.phone },
    { id: 'stories', label: locale === 'nl-NL' ? 'Verhalen' : 'Stories', icon: havenIcons.book },
  ];

  return (
    <View style={{ gap: 14 }}>
      <SubTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={locale === 'nl-NL' ? 'Stuur hartje' : 'Send heart'}
          onPress={() => ctx.onPrimaryAction('SEND_HEART')}
          style={{ flex: 1, backgroundColor: colors.rosePale, borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, minHeight: touch.minimum }}
        >
          <MaterialCommunityIcons name="heart" size={18} color={colors.rose} />
          <Text style={{ color: colors.rose, fontWeight: '900' }}>{locale === 'nl-NL' ? 'Stuur hartje' : 'Send heart'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={locale === 'nl-NL' ? 'Ik ben oké' : "I'm okay"}
          onPress={() => ctx.onPrimaryAction('SEND_OK')}
          style={{ flex: 1, backgroundColor: colors.sagePale, borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, minHeight: touch.minimum }}
        >
          <MaterialCommunityIcons name="thumb-up-outline" size={18} color={colors.sage} />
          <Text style={{ color: colors.sage, fontWeight: '900' }}>{locale === 'nl-NL' ? 'Ik ben oké' : "I'm okay"}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'messages' && (
        <View style={{ gap: 10 }}>
          {/* Chat bubbles */}
          {messages.slice(0, 5).map((msg) => {
            const isSystem = msg.fromId === 'system';
            const isElder = msg.fromId === 'elder-001';
            return (
              <View key={msg.id} style={{
                flexDirection: 'row',
                justifyContent: isElder ? 'flex-end' : 'flex-start',
                gap: 8,
              }}>
                {!isElder && (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isSystem ? colors.slatePale : colors.rosePale, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{msg.avatar}</Text>
                  </View>
                )}
                <View style={{
                  maxWidth: '75%', borderRadius: 18, padding: 14,
                  backgroundColor: isElder ? colors.slate : isSystem ? colors.slatePale : colors.paper,
                  borderWidth: isElder || isSystem ? 0 : 1, borderColor: colors.mist,
                }}>
                  {!isElder && <Text style={{ fontSize: typeScale.caption, fontWeight: '800', color: isSystem ? colors.pewter : colors.ink, marginBottom: 4 }}>{msg.from}</Text>}
                  <Text style={{ fontSize: typeScale.caption, fontWeight: '600', color: isElder ? '#fff' : colors.ink }}>{msg.content}</Text>
                  <Text style={{ fontSize: typeScale.caption, color: isElder ? 'rgba(255,255,255,0.6)' : colors.pewter, marginTop: 4 }}>
                    {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Compose */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={locale === 'nl-NL' ? 'Typ een bericht...' : 'Type a message...'}
              placeholderTextColor={colors.pewter}
              multiline
              style={{
                flex: 1, borderRadius: 18, padding: 14, backgroundColor: colors.paper,
                borderWidth: 1, borderColor: colors.mist, fontSize: typeScale.caption, color: colors.ink,
                minHeight: 48, maxHeight: 100,
              }}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={locale === 'nl-NL' ? 'Verstuur bericht' : 'Send message'}
              onPress={() => { if (newMessage.trim()) { ctx.onPrimaryAction('SEND_MESSAGE'); setNewMessage(''); } }}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.slate, justifyContent: 'center', alignItems: 'center', minHeight: touch.minimum }}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'call' && (
        <View style={{ gap: 14 }}>
          {/* Video call placeholder */}
          <View style={{ borderRadius: 22, height: 200, backgroundColor: colors.slatePale, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.mist }}>
            <MaterialCommunityIcons name="video-outline" size={48} color={colors.slate} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.slate, marginTop: 8 }}>
              {locale === 'nl-NL' ? 'Video bellen' : 'Video Call'}
            </Text>
          </View>
          {family.map((f) => (
            <TouchableOpacity
              key={f.id}
              accessibilityRole="button"
              accessibilityLabel={`${locale === 'nl-NL' ? 'Bel' : 'Call'} ${f.name}`}
              onPress={() => ctx.onPrimaryAction(`CALL_FAMILY:${f.id}`)}
              style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: touch.minimum }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sagePale, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name={f.relation === 'kind' ? 'account' : f.relation === 'kleinkind' ? 'account' : 'account-outline'} size={24} color={colors.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{f.name}</Text>
                <Text style={{ fontSize: typeScale.caption, color: colors.pewter, fontWeight: '700' }}>{locale === 'nl-NL' ? 'Bellen' : 'Call'}</Text>
              </View>
              <MaterialCommunityIcons name="phone-outline" size={24} color={colors.slate} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTab === 'stories' && (
        <View style={{ gap: 14 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={locale === 'nl-NL' ? 'Nieuw verhaal opnemen' : 'Record new story'}
            onPress={() => ctx.onPrimaryAction('RECORD_STORY')}
            style={{ borderRadius: 18, padding: 16, backgroundColor: colors.amberPale, borderWidth: 1, borderColor: colors.amber, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: touch.minimum }}
          >
            <MaterialCommunityIcons name="microphone-outline" size={22} color={colors.ink} />
            <Text style={{ fontSize: typeScale.caption, fontWeight: '900', color: colors.ink }}>
              {locale === 'nl-NL' ? 'Nieuw verhaal opnemen' : 'Record new story'}
            </Text>
          </TouchableOpacity>
          {LIFE_STORIES.map((story) => (
            <View key={story.id} style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>{story.emoji}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{story.title}</Text>
              </View>
              <Text style={{ fontSize: typeScale.caption, color: colors.pewter, fontWeight: '700' }}>{story.date}</Text>
              <Text style={{ fontSize: typeScale.caption, color: colors.graphite, fontWeight: '600' }} numberOfLines={3}>{story.content}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
