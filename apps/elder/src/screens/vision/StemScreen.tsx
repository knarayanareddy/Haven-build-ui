// ─── Vision StemScreen ───
// VAPI real-time voice conversation when available; falls back to record-upload-wait
// via fn-voice-pipeline when VAPI is not configured.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typeScale, touch } from '@haven/ui/src/tokens';
import { pillarGradients } from '@haven/ui/src/visionColors';
// DEMO: mock voice memory — acceptable fixture (VAPI handles real conversations)
import { VOICE_MEMORY } from '@haven/ui/src/mockData';
import { useAuth } from '../../auth/AuthProvider';
import { useHavenClient } from '../../hooks/useHavenClient';
import { startVoiceRecording } from '../../services/voiceRecorder';
import { translateElderError } from '../../services/errorMapper';
import { useVapiCall } from '@haven/vapi/src/useVapiCall';
import { VapiVoiceService } from '@haven/vapi/src/vapiClient';
import { VapiError } from '@haven/vapi/src/VapiError';
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
  const nl = locale === 'nl-NL';
  const { session } = useAuth();
  const elderId = sessionUserId(session);
  const client = useHavenClient();
  const vapiAvailable = VapiVoiceService.isAvailable();

  // VAPI real-time voice hook
  const vapiConfig = useMemo(() => {
    if (!elderId || !session) return null;
    return {
      locale: locale as 'en-GB' | 'nl-NL',
      elderId,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
      
    };
  }, [elderId, session, locale]);

  const vapi = useVapiCall(vapiConfig);

  // Fallback state (used when VAPI is not available)
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>(
    VOICE_MEMORY.map((m) => ({ id: m.id, query: m.query, response: m.response, timestamp: m.timestamp }))
  );
  const recordingRef = useRef<ActiveVoiceRecording | null>(null);

  // Sync VAPI messages into conversation history
  useEffect(() => {
    if (!vapiAvailable || vapi.state.messages.length === 0) return;
    const vapiMessages = vapi.state.messages;
    const newEntries: ConversationEntry[] = [];
    for (let i = 0; i < vapiMessages.length; i += 2) {
      const userMsg = vapiMessages[i];
      const assistantMsg = vapiMessages[i + 1];
      if (userMsg && userMsg.role === 'user') {
        newEntries.push({
          id: `vapi-${i}-${userMsg.timestamp.getTime()}`,
          query: userMsg.content,
          response: assistantMsg ? assistantMsg.content : (nl ? 'Bezig...' : 'Processing...'),
          timestamp: userMsg.timestamp,
        });
      }
    }
    if (newEntries.length > 0) {
      setConversation((prev) => {
        const filtered = prev.filter((e) => !e.id.startsWith('vapi-'));
        return [...newEntries.reverse(), ...filtered];
      });
    }
  }, [vapiAvailable, vapi.state.messages, nl]);

  // Derived voice state
  const isVapiActive = vapiAvailable && (vapi.state.status === 'active' || vapi.state.status === 'connecting');
  const isVapiConnecting = vapiAvailable && vapi.state.status === 'connecting';
  const effectiveListening = vapiAvailable ? isVapiActive : isListening;
  const effectiveSending = vapiAvailable ? isVapiConnecting : isSending;
  const effectiveVolume = vapiAvailable ? vapi.state.volumeLevel : 0;

  // ─── Fallback: record-upload-wait flow ───
  async function sendToVoicePipeline(input: { transcript_text?: string; audio_base64?: string }) {
    if (!client || !elderId) {
      Alert.alert('HAVEN', nl ? 'Log eerst in om stem te gebruiken.' : 'Sign in first to use voice.');
      return;
    }
    setIsSending(true);
    const queryText = input.transcript_text ?? (nl ? '(spraakopname)' : '(voice recording)');
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
    if (!session || !elderId) {
      Alert.alert('HAVEN', nl ? 'Log eerst in om stem te gebruiken.' : 'Sign in first to use voice.');
      return;
    }

    // ─── VAPI path: real-time bidirectional call ───
    if (vapiAvailable) {
      if (isVapiActive) {
        vapi.stop();
      } else {
        try {
          await vapi.start();
        } catch (error) {
          if (error instanceof VapiError) {
            Alert.alert('HAVEN', nl ? 'Spraakdienst niet beschikbaar. Probeer het opnieuw.' : 'Voice service not available. Please try again.');
          } else {
            Alert.alert('HAVEN', translateElderError(error));
          }
        }
      }
      return;
    }

    // ─── Fallback path: record-upload-wait ───
    if (isListening) {
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
      try {
        const recording = await startVoiceRecording();
        recordingRef.current = recording;
        setIsListening(true);
      } catch {
        Alert.alert('HAVEN', nl ? 'Microfoon toestemming nodig.' : 'Microphone permission required.');
      }
    }
  }

  async function handlePrompt(text: string, textEn: string) {
    const transcriptText = nl ? text : textEn;
    await sendToVoicePipeline({ transcript_text: transcriptText });
  }

  // Voice orb gradient and label
  const orbGradient = effectiveListening
    ? (['#f59e0b', '#d97706'] as const)
    : effectiveSending
      ? (['#9CA3AF', '#6B7280'] as const)
      : pillarGradients.stem;

  const orbEmoji = effectiveSending ? '...' : effectiveListening ? '🔊' : '🎙️';
  const orbLabel = effectiveSending
    ? (nl ? 'Verbinden...' : 'Connecting...')
    : effectiveListening
      ? (vapiAvailable
        ? (nl ? 'HAVEN luistert — spreek vrijuit' : 'HAVEN is listening — speak freely')
        : (nl ? 'Ik luister...' : "I'm listening..."))
      : (nl ? 'Tik om te praten' : 'Tap to speak');

  const orbScale = effectiveListening ? 1 + (effectiveVolume / 100) * 0.15 : 1;

  return (
    <View style={{ gap: 18 }}>
      {/* VAPI badge */}
      {vapiAvailable && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
            {nl ? 'Realtime spraak actief' : 'Real-time voice active'}
          </Text>
        </View>
      )}

      {/* Voice orb */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <TouchableOpacity
          onPress={handleVoiceToggle}
          disabled={effectiveSending}
          accessibilityRole="button"
          accessibilityLabel={effectiveListening ? (nl ? 'Stop luisteren' : 'Stop listening') : (nl ? 'Begin met praten' : 'Start talking')}
        >
          <View style={{ transform: [{ scale: orbScale }] }}>
            <LinearGradient
              colors={[...orbGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 48 }}>{orbEmoji}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: effectiveListening ? colors.amber : effectiveSending ? colors.pewter : colors.ink, marginTop: 12, textAlign: 'center' }}>
          {orbLabel}
        </Text>
        {/* Live transcript during VAPI call */}
        {vapiAvailable && effectiveListening && vapi.state.transcript && (
          <View style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.mist }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.graphite, fontStyle: 'italic', textAlign: 'center' }}>
              "{vapi.state.transcript}"
            </Text>
          </View>
        )}
      </View>

      {/* Quick prompts (only shown when not in VAPI call) */}
      {!effectiveListening && (
        <>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
            {nl ? 'Of probeer:' : 'Or try:'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PROMPTS.map((p, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handlePrompt(p.text, p.textEn)}
                disabled={effectiveSending || effectiveListening}
                accessibilityRole="button"
                accessibilityLabel={nl ? p.text : p.textEn}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, opacity: effectiveSending ? 0.5 : 1, minHeight: touch.minimum }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.slate }}>
                  {nl ? p.text : p.textEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Emergency voice */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={nl ? 'Noodgeval' : 'Emergency'}
        onPress={() => ctx.onPrimaryAction('EMERGENCY')}
        style={{ backgroundColor: colors.rosePale, borderWidth: 1, borderColor: colors.rose, borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: touch.minimum }}
      >
        <Text style={{ fontSize: 20 }}>🆘</Text>
        <Text style={{ color: colors.rose, fontSize: typeScale.caption, fontWeight: '900' }}>
          {nl ? 'Noodgeval' : 'Emergency'}
        </Text>
      </TouchableOpacity>

      {/* Conversation history */}
      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
        {nl ? 'Eerder gevraagd' : 'Previously asked'}
      </Text>
      {conversation.map((mem) => (
        <View key={mem.id} style={{ borderRadius: 18, padding: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: typeScale.caption }}>🗣️</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, flex: 1 }}>{mem.query}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginLeft: 24 }}>
            <Text style={{ fontSize: typeScale.caption }}>⌂</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.graphite, flex: 1 }}>{mem.response}</Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.pewter, textAlign: 'right' }}>
            {mem.timestamp instanceof Date ? mem.timestamp.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}
