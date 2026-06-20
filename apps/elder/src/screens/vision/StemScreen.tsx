// ─── Vision StemScreen ───
// Wired to Supabase: records audio via expo-audio, sends to fn-voice-pipeline,
// displays text response in conversation history

import React, { useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@haven/ui/src/tokens';
import { pillarGradients } from '@haven/ui/src/visionColors';
import { VOICE_MEMORY } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';
import { HavenClient } from '../../services/havenClient';
import { startVoiceRecording } from '../../services/voiceRecorder';
import { translateElderError } from '../../services/errorMapper';
import type { ActiveVoiceRecording } from '../../services/voiceRecorder';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

type ConversationEntry = { id: string; query: string; response: string; timestamp: Date };

function sessionUserId(session: { access_token?: string } | null): string | null {
  const directUser = (session as unknown as { user?: { id?: string } } | null)?.user?.id;
  if (directUser) return directUser;
  const token = session?.access_token;
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload))?.sub ?? null;
  } catch { return null; }
}

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
  const { session } = useAuth();
  const elderId = sessionUserId(session);
  const client = session ? new HavenClient({ supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!, accessToken: session.access_token }) : null;

  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>(
    VOICE_MEMORY.map((m) => ({ id: m.id, query: m.query, response: m.response, timestamp: m.timestamp }))
  );
  const recordingRef = useRef<ActiveVoiceRecording | null>(null);

  async function sendToVoicePipeline(input: { transcript_text?: string; audio_base64?: string }) {
    if (!client || !elderId) {
      Alert.alert('HAVEN', locale === 'nl-NL' ? 'Log eerst in om stem te gebruiken.' : 'Sign in first to use voice.');
      return;
    }
    setIsSending(true);
    const queryText = input.transcript_text ?? (locale === 'nl-NL' ? '(spraakopname)' : '(voice recording)');
    try {
      const result = await client.voice({
        elder_id: elderId,
        screen_id: 'STEM',
        transcript_text: input.transcript_text ?? '',
        audio_base64: input.audio_base64,
        locale: locale as 'en-GB' | 'nl-NL',
      });
      const replyText = result.response_text ?? JSON.stringify(result);
      setConversation((prev) => [{
        id: Date.now().toString(),
        query: queryText,
        response: String(replyText),
        timestamp: new Date(),
      }, ...prev]);
    } catch (error) {
      Alert.alert('HAVEN', translateElderError(error));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVoiceToggle() {
    if (isListening) {
      // Stop recording and send
      setIsListening(false);
      if (recordingRef.current) {
        try {
          const { audioBase64 } = await recordingRef.current.stop();
          recordingRef.current = null;
          await sendToVoicePipeline({ audio_base64: audioBase64 });
        } catch (error) {
          Alert.alert('HAVEN', translateElderError(error));
        }
      }
    } else {
      // Start recording
      try {
        const recording = await startVoiceRecording();
        recordingRef.current = recording;
        setIsListening(true);
      } catch (error) {
        Alert.alert('HAVEN', locale === 'nl-NL' ? 'Microfoon toestemming nodig.' : 'Microphone permission required.');
      }
    }
  }

  async function handlePrompt(text: string, textEn: string) {
    const transcriptText = locale === 'nl-NL' ? text : textEn;
    await sendToVoicePipeline({ transcript_text: transcriptText });
  }

  return (
    <View style={{ gap: 18 }}>
      {/* Voice orb */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <TouchableOpacity
          onPress={handleVoiceToggle}
          disabled={isSending}
          accessibilityRole="button"
          accessibilityLabel={isListening ? (locale === 'nl-NL' ? 'Stop luisteren' : 'Stop listening') : (locale === 'nl-NL' ? 'Begin met praten' : 'Start talking')}
        >
          <LinearGradient
            colors={isListening ? ['#f59e0b', '#d97706'] : isSending ? ['#9CA3AF', '#6B7280'] : pillarGradients.stem}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 48 }}>{isSending ? '...' : isListening ? '🔊' : '🎙️'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: isListening ? colors.amber : isSending ? colors.pewter : colors.ink, marginTop: 12 }}>
          {isSending
            ? (locale === 'nl-NL' ? 'Bezig met verwerken...' : 'Processing...')
            : isListening
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
            onPress={() => handlePrompt(p.text, p.textEn)}
            disabled={isSending || isListening}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, opacity: isSending ? 0.5 : 1 }}
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
      {conversation.map((mem) => (
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
