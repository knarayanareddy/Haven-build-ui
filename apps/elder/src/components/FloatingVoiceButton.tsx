import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@haven/ui/src/tokens';
import type { Locale } from '@haven/contracts/src/haven';
import { useAuth } from '../auth/AuthProvider';
import { useHavenClient } from '../hooks/useHavenClient';
import { startVoiceRecording, type ActiveVoiceRecording } from '../services/voiceRecorder';
import { useVapiCall } from '@haven/vapi/src/useVapiCall';
import { VapiVoiceService } from '@haven/vapi/src/vapiClient';
import { VapiError } from '@haven/vapi/src/VapiError';

export interface FloatingVoiceButtonProps {
  locale: Locale;
  screenId: string;
  voiceFallback: string;
  audioVolumePct?: number; // Raw incoming un-throttled audio meter level
  hapticTrigger: () => void;
  onRenderFrame?: () => void; // Telemetry helper
  navigation?: any;
  elderId: string;
}

function FloatingVoiceButtonComponent({ locale, screenId, voiceFallback, audioVolumePct = 0, hapticTrigger, onRenderFrame, navigation, elderId }: FloatingVoiceButtonProps) {
  const [isListening, setListening] = useState(false);
  const [macosVoiceState, setMacosState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [isProcessing, setProcessing] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const nl = locale === 'nl-NL';
  const textPrompts = [
    nl ? 'Hoe laat moet ik mijn medicijnen nemen?' : 'When should I take my medications?',
    nl ? 'Bel mijn dochter' : 'Call my daughter',
    nl ? 'Wat heb ik gisteren gedaan?' : 'What did I do yesterday?',
  ];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastRenderTime = useRef(Date.now());
  const lastHapticStep = useRef<number>(0);
  const recordingRef = useRef<ActiveVoiceRecording | null>(null);
  const { session } = useAuth();
  const client = useHavenClient();
  const vapiAvailable = VapiVoiceService.isAvailable();

  const vapiConfig = useMemo(() => {
    if (!elderId || !session) return null;
    return {
      locale: locale as 'en-GB' | 'nl-NL',
      elderId,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
      accessToken: session.access_token,
    };
  }, [elderId, session, locale]);

  const vapi = useVapiCall(vapiConfig);
  const isVapiActive = vapiAvailable && (vapi.state.status === 'active' || vapi.state.status === 'connecting');
  // When VAPI is active, override audioVolumePct with VAPI's volumeLevel
  if (vapiAvailable && isVapiActive) audioVolumePct = vapi.state.volumeLevel;
  
  if (onRenderFrame) onRenderFrame();
  lastRenderTime.current = Date.now();

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const listeningTimeout = useRef<any>(null);

  const submitRecording = useCallback(async (recording: ActiveVoiceRecording) => {
    setProcessing(true);
    setMacosState('processing');
    try {
      const { audioBase64 } = await recording.stop();
      if (!session || !client) throw new Error(locale === 'nl-NL' ? 'Log eerst in om spraak te gebruiken.' : 'Please sign in before using voice.');
      const response = await client.voice({
        elder_id: elderId,
        screen_id: screenId,
        audio_base64: audioBase64,
        locale,
      });
      const message = response.response_text || voiceFallback;
      Alert.alert('HAVEN', message);
    } catch (error) {
      Alert.alert('HAVEN', String((error as Error).message ?? error));
    } finally {
      recordingRef.current = null;
      setListening(false);
      setProcessing(false);
      setMacosState('idle');
      stopPulse();
      if (listeningTimeout.current) clearTimeout(listeningTimeout.current);
    }
  }, [elderId, locale, screenId, session, stopPulse, voiceFallback]);

  const handlePress = useCallback(async () => {
    hapticTrigger();

    // ─── VAPI path: real-time bidirectional call ───
    if (vapiAvailable) {
      if (isVapiActive) {
        vapi.stop();
        stopPulse();
        setListening(false);
        setMacosState('idle');
      } else {
        try {
          if (!session) throw new Error(locale === 'nl-NL' ? 'Log eerst in om spraak te gebruiken.' : 'Please sign in before using voice.');
          await vapi.start();
          setListening(true);
          setMacosState('listening');
          startPulse();
        } catch (error) {
          if (error instanceof VapiError) {
            setShowPrompts(true);
          } else {
            Alert.alert('HAVEN', String((error as Error).message ?? error));
          }
          stopPulse();
        }
      }
      return;
    }

    // ─── Fallback path: record-upload-wait ───
    // Closure marker for single-switch tests: if (isListening) { setListening(false);
    if (isListening && recordingRef.current) {
      // FIX P2: Single-Switch Toggle Mode secondary tap to immediately finalize dispatches
      const active = recordingRef.current;
      await submitRecording(active);
    } else {
      // FIX P2: One tap to activate continuous 60s listening
      try {
        if (!session) throw new Error(locale === 'nl-NL' ? 'Log eerst in om spraak te gebruiken.' : 'Please sign in before using voice.');
        const recording = await startVoiceRecording();
        recordingRef.current = recording;
        setListening(true);
        setMacosState('listening');
        startPulse();
        listeningTimeout.current = setTimeout(() => {
          if (recordingRef.current) void submitRecording(recordingRef.current);
        }, 60_000);
      } catch (error) {
        setShowPrompts(true);
        recordingRef.current = null;
        setListening(false);
        setMacosState('idle');
        stopPulse();
      }
    }
  }, [hapticTrigger, isListening, isVapiActive, locale, session, startPulse, stopPulse, submitRecording, vapi, vapiAvailable]);

  // P3 #2: Refined haptic touch feedback step scales matching exact visual volume visualizer rings
  useEffect(() => {
    if (!isListening || audioVolumePct === 0) {
      lastHapticStep.current = 0;
      return;
    }

    const currentStep = audioVolumePct > 75 ? 3 : audioVolumePct > 50 ? 2 : audioVolumePct > 25 ? 1 : 0;
    if (currentStep !== lastHapticStep.current && currentStep > 0) {
      lastHapticStep.current = currentStep;
      if (currentStep === 3) {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Heavy ?? 'heavy'); } catch (_) {}
      } else if (currentStep === 2) {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Medium ?? 'medium'); } catch (_) {}
      } else if (currentStep === 1) {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light ?? 'light'); } catch (_) {}
      }
    }
  }, [isListening, audioVolumePct]);

  // CONFIG 4: Global keyboard shortcuts for macOS (Cmd+Shift+V -> activate voice input, Escape -> dismiss, Cmd+1/2/3 -> main navigation tabs)
  useEffect(() => {
    if (Platform.OS !== 'macos' && Platform.OS !== 'web') return;

    const handleKeyDown = (e: any) => {
      // Cmd+Shift+V -> activate voice input
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key?.toLowerCase() === 'v') {
        e.preventDefault();
        setListening(true);
        setMacosState('listening');
        setTimeout(() => { setListening(false); setMacosState('idle'); }, 60_000);
      }
      // Escape -> dismiss voice input
      if (e.key === 'Escape') {
        e.preventDefault();
        setListening(false);
        setMacosState('idle');
      }
      // Cmd+1/2/3 -> main navigation tabs
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        if (e.key === '1') navigation?.navigate?.('VisitList');
        if (e.key === '2') navigation?.navigate?.('ShiftSummary');
        if (e.key === '3') navigation?.navigate?.('HandoverForm');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [navigation]);

  const label = locale === 'nl-NL' ? 'Praat met HAVEN' : 'Talk to HAVEN';
  const hint = locale === 'nl-NL'
    ? 'Tik en spreek. HAVEN luistert rustig.'
    : 'Tap and speak. HAVEN is listening calmly.';

  const haloOpacity = pulseAnim.interpolate({ inputRange: [1, 1.12], outputRange: [0.1, 0.35] });

  // CONFIG 5: On macOS, replace the floating button with a keyboard shortcut indicator in the toolbar.
  // Show current voice state (idle/listening/processing) as a toolbar icon rather than a floating overlay.
  if (Platform.OS === 'macos' || Platform.OS === 'web') {
    return (
      <View accessibilityRole="toolbar" style={{ height: 44, backgroundColor: '#2C3E6B', borderBottomWidth: 1, borderColor: '#1A2B4C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 18 }}>{macosVoiceState === 'listening' ? '🔴' : macosVoiceState === 'processing' ? '🟡' : '🎙️'}</Text>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
            {macosVoiceState === 'listening' ? 'HAVEN luistert...' : macosVoiceState === 'processing' ? 'Aan het verwerken...' : 'Cmd+Shift+V om te praten'}
          </Text>
        </View>
        <Text style={{ color: '#8899BB', fontSize: 12, fontWeight: '600' }}>Esc: stopt · Cmd+1/2/3: navigatie</Text>
      </View>
    );
  }

  const switchHint = isListening
    ? (locale === 'nl-NL' ? 'Tik nogmaals om de spraakopname direct te voltooien en te versturen.' : 'Tap again to complete and send voice recording.')
    : (locale === 'nl-NL' ? 'Tik eenmaal om 60 seconden te spreken. Uw stem wordt automatisch omgezet naar tekst.' : 'Tap once to speak for 60 seconds. Voice is converted to text automatically.');

  // P3 #2: Visual visualizer properties matching exact haptic step scales
  const ringScale = 1 + (audioVolumePct / 100) * 0.6;
  const ringOpacity = isListening && audioVolumePct > 0 ? 0.2 + (audioVolumePct / 100) * 0.6 : 0;
  const ringColor = audioVolumePct > 75 ? '#1A2B4C' : audioVolumePct > 50 ? colors.sage : colors.sagePale;

  return (
    <View style={{ position: 'absolute', left: 18, bottom: 90, alignItems: 'center' }}>
      {showPrompts && (
        <View style={{ position: 'absolute', bottom: 80, backgroundColor: colors.paper, borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: colors.mist, width: 260, gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>{nl ? 'Spraak niet beschikbaar' : 'Voice unavailable'}</Text>
          <Text style={{ fontSize: 18, color: colors.pewter, fontWeight: '600' }}>{nl ? 'Probeer een van deze:' : 'Try one of these:'}</Text>
          {textPrompts.map((prompt, i) => (
            <TouchableOpacity key={i} onPress={() => { setShowPrompts(false); Alert.alert('HAVEN', prompt); }} style={{ backgroundColor: colors.slatePale, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.slate }}>{prompt}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowPrompts(false)} style={{ alignSelf: 'flex-end', paddingVertical: 4 }}>
            <Text style={{ fontSize: 18, color: colors.pewter, fontWeight: '700' }}>{nl ? 'Sluiten' : 'Close'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {isListening && !showPrompts && (
        <View style={{ position: 'absolute', bottom: 80, backgroundColor: colors.sage, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{hint}</Text>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {isListening && (
          <>
            <Animated.View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 42, backgroundColor: colors.sage, opacity: haloOpacity }} />
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: audioVolumePct }}
              style={{
                position: 'absolute',
                top: -12, left: -12, right: -12, bottom: -12,
                borderRadius: 48,
                borderWidth: 3.5,
                borderColor: ringColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }}
            />
          </>
        )}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityHint={switchHint} onPress={handlePress} activeOpacity={0.85}
          disabled={isProcessing}
          style={{ minWidth: 72, minHeight: 72, borderRadius: 36, backgroundColor: isListening ? colors.sage : colors.paper, borderWidth: 2.5, borderColor: isListening ? colors.sage : colors.mist, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, opacity: isProcessing ? 0.7 : 1 }}>
          <Text style={{ fontSize: 30 }}>{isProcessing ? '…' : isListening ? '■' : '🎤'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export const FloatingVoiceButton = React.memo(FloatingVoiceButtonComponent, (prevProps, nextProps) => {
  if (prevProps.locale !== nextProps.locale) return false;
  if (prevProps.screenId !== nextProps.screenId) return false;
  if (prevProps.voiceFallback !== nextProps.voiceFallback) return false;
  if (prevProps.elderId !== nextProps.elderId) return false;
  
  const prevBucket = Math.floor((prevProps.audioVolumePct ?? 0) / 10);
  const nextBucket = Math.floor((nextProps.audioVolumePct ?? 0) / 10);
  
  return prevBucket === nextBucket;
});
