// ─── Vision StemScreen ───
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@haven/ui/src/tokens';
import { pillarGradients } from '@haven/ui/src/visionColors';
import { VOICE_MEMORY } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

const PROMPTS = [
  { text: 'Hoe laat moet ik mijn medicijnen nemen?', textEn: 'When should I take my medications?' },
  { text: 'Bel mijn dochter', textEn: 'Call my daughter' },
  { text: 'Wat heb ik gisteren gedaan?', textEn: 'What did I do yesterday?' },
  { text: 'Vertel me een verhaal', textEn: 'Tell me a story' },
  { text: 'Is er iemand aan de deur?', textEn: 'Is someone at the door?' },
  { text: 'Hoe gaat het weer vandaag?', textEn: 'How is the weather today?' },
];

export function renderVisionStem(ctx: ScreenContext): React.ReactNode {
  return <VisionStemInner ctx={ctx} />;
}

function VisionStemInner({ ctx }: { ctx: ScreenContext }) {
  const { locale } = ctx;
  const [isListening, setIsListening] = useState(false);

  return (
    <View style={{ gap: 18 }}>
      {/* Voice orb */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <TouchableOpacity
          onPress={() => {
            setIsListening(!isListening);
            ctx.onPrimaryAction(isListening ? 'VOICE_STOP' : 'VOICE_START');
          }}
          accessibilityRole="button"
          accessibilityLabel={isListening ? (locale === 'nl-NL' ? 'Stop luisteren' : 'Stop listening') : (locale === 'nl-NL' ? 'Begin met praten' : 'Start talking')}
        >
          <LinearGradient
            colors={isListening ? ['#f59e0b', '#d97706'] : pillarGradients.stem}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 48 }}>{isListening ? '🔊' : '🎙️'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: isListening ? colors.amber : colors.ink, marginTop: 12 }}>
          {isListening
            ? (locale === 'nl-NL' ? 'Ik luister...' : "I'm listening...")
            : (locale === 'nl-NL' ? 'Tik om te praten' : 'Tap to speak')}
        </Text>
      </View>

      {/* Quick prompts */}
      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Of probeer:' : 'Or try:'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PROMPTS.map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => ctx.onPrimaryAction(`VOICE_PROMPT:${p.text}`)}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.slate }}>
              {locale === 'nl-NL' ? p.text : p.textEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency voice */}
      <TouchableOpacity
        onPress={() => ctx.onPrimaryAction('EMERGENCY')}
        style={{ backgroundColor: colors.rosePale, borderWidth: 1, borderColor: colors.rose, borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 20 }}>🆘</Text>
        <Text style={{ color: colors.rose, fontSize: 16, fontWeight: '900' }}>
          {locale === 'nl-NL' ? 'Noodgeval' : 'Emergency'}
        </Text>
      </TouchableOpacity>

      {/* Conversation history */}
      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Eerder gevraagd' : 'Previously asked'}
      </Text>
      {VOICE_MEMORY.map((mem) => (
        <View key={mem.id} style={{ borderRadius: 18, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16 }}>🗣️</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, flex: 1 }}>{mem.query}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginLeft: 24 }}>
            <Text style={{ fontSize: 16 }}>⌂</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.graphite, flex: 1 }}>{mem.response}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.pewter, textAlign: 'right' }}>
            {mem.timestamp instanceof Date ? mem.timestamp.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}
