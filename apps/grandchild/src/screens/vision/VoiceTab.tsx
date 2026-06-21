// ─── Vision Family Dashboard: Familiar Voice Tab ───
// Wired to fn-voice-profile-create for real voice cloning via VAPI/ElevenLabs.
// Records audio via expo-audio, uploads for voice profile creation,
// and plays test audio from fn-voice-profile-test.

import React, { useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
// DEMO: mock familiar voice status — acceptable fixture (recording UI is standalone)
import { FAMILIAR_VOICE_STATUS } from '@haven/ui/src/mockData';

interface VoiceTabProps {
  locale: string;
}

interface RecordingHandle {
  stop: () => Promise<{ uri: string; audioBase64: string }>;
}

async function startVoiceRecording(): Promise<RecordingHandle> {
  const AudioModule = await import('expo-audio').then((m) => m.AudioModule);
  const RecordingPresets = await import('expo-audio').then((m) => m.RecordingPresets);
  const FileSystem = await import('expo-file-system');

  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) throw new Error('Microphone permission is required');

  const AudioRecorderClass = (AudioModule as Record<string, unknown>).AudioRecorder as new (preset: unknown) => {
    prepareToRecordAsync: () => void;
    record: () => void;
    stop: () => Promise<void>;
    uri: string | null;
  };
  const recorder = new AudioRecorderClass(RecordingPresets.HIGH_QUALITY);
  recorder.prepareToRecordAsync();
  recorder.record();

  return {
    stop: async () => {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('Recording URI missing');
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return { uri, audioBase64 };
    },
  };
}

export function VoiceTab({ locale }: VoiceTabProps) {
  const nl = locale.startsWith('nl');
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [playingTest, setPlayingTest] = useState(false);
  const recordingRef = useRef<RecordingHandle | null>(null);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.EXPO_PUBLIC_FAMILY_ACCESS_TOKEN;
  const elderId = process.env.EXPO_PUBLIC_ELDER_ID ?? '00000000-0000-0000-0000-000000000001';

  async function handleRecord() {
    if (recording && recordingRef.current) {
      // Stop recording and upload
      setRecording(false);
      setUploading(true);
      try {
        const { audioBase64 } = await recordingRef.current.stop();
        recordingRef.current = null;

        if (!supabaseUrl || !accessToken) {
          Alert.alert('HAVEN', nl ? 'Configuratie ontbreekt. Log in via het familiedashboard.' : 'Configuration missing. Sign in via the family dashboard.');
          setUploading(false);
          return;
        }

        // Upload to fn-voice-profile-create
        const response = await fetch(`${supabaseUrl}/functions/v1/fn-voice-profile-create`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            display_name: 'Sarah (Family)',
            provider: 'elevenlabs',
            elder_id: elderId,
            audio_base64: audioBase64,
            consent_evidence_path: `family-voice-consent/${Date.now()}`,
          }),
        });

        const data = await response.json() as Record<string, unknown>;
        if (!response.ok) {
          throw new Error(String(data.error ?? 'Voice profile creation failed'));
        }

        setProfileId(String(data.voice_profile_id ?? ''));
        setRecorded(true);
        Alert.alert(
          'HAVEN',
          nl ? 'Stemprofiel aangemaakt! U kunt nu een testfragment beluisteren.' : 'Voice profile created! You can now listen to a test clip.',
        );
      } catch (error) {
        Alert.alert('HAVEN', String((error as Error).message ?? error));
      } finally {
        setUploading(false);
      }
    } else {
      // Start recording
      try {
        const handle = await startVoiceRecording();
        recordingRef.current = handle;
        setRecording(true);
      } catch (error) {
        Alert.alert('HAVEN', nl ? 'Microfoon toestemming nodig.' : 'Microphone permission required.');
      }
    }
  }

  async function handleTestPlayback() {
    if (!profileId || !supabaseUrl || !accessToken) return;
    setPlayingTest(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/fn-voice-profile-test`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          voice_profile_id: profileId,
          locale: nl ? 'nl-NL' : 'en-GB',
        }),
      });

      const data = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(String(data.error ?? 'Voice test failed'));
      }

      if (data.audio_url) {
        setTestAudioUrl(String(data.audio_url));
        // Play audio using expo-av
        try {
          const { Audio } = await import('expo-av');
          const { sound } = await Audio.Sound.createAsync({ uri: String(data.audio_url) });
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status: Record<string, unknown>) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              setPlayingTest(false);
              sound.unloadAsync();
            }
          });
        } catch {
          Alert.alert('HAVEN', nl ? 'Kan audio niet afspelen. URL gekopieerd.' : 'Cannot play audio. URL copied.');
          setPlayingTest(false);
        }
      } else {
        Alert.alert('HAVEN', String(data.text ?? (nl ? 'Geen audio beschikbaar voor dit profiel.' : 'No audio available for this profile.')));
        setPlayingTest(false);
      }
    } catch (error) {
      Alert.alert('HAVEN', String((error as Error).message ?? error));
      setPlayingTest(false);
    }
  }

  function handleRecordAgain() {
    setRecorded(false);
    setProfileId(null);
    setTestAudioUrl(null);
  }

  async function handleRevokeProfile() {
    if (!profileId || !supabaseUrl || !accessToken) return;
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/fn-voice-profile-revoke`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ voice_profile_id: profileId }),
      });
      if (!response.ok) {
        const data = await response.json() as Record<string, unknown>;
        throw new Error(String(data.error ?? 'Revoke failed'));
      }
      Alert.alert('HAVEN', nl ? 'Stemprofiel verwijderd.' : 'Voice profile deleted.');
      handleRecordAgain();
    } catch (error) {
      Alert.alert('HAVEN', String((error as Error).message ?? error));
    }
  }

  const privacyItems = nl ? [
    'Uw stem wordt verwerkt via VAPI voice AI (EU DPA in behandeling)',
    'Opname wordt alleen gebruikt voor spraaksynthese voor Margaret',
    'U kunt uw opname op elk moment verwijderen',
    'Margaret moet toestemming geven voordat deze functie wordt geactiveerd',
    'Deze functie is momenteel in beta',
  ] : [
    'Your voice is processed via VAPI voice AI (EU DPA in progress)',
    'Recording is used only for voice synthesis for Margaret',
    'You can delete your recording at any time',
    'Margaret must consent before this feature activates',
    'This feature is currently in beta',
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 20, padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#78350F' }}>🎙️ {nl ? 'Vertrouwde Stem' : 'Familiar Voice'}</Text>
        <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>
          {nl
            ? 'Neem uw stem op zodat HAVEN met Margaret kan spreken met uw stem. Dit is optioneel en afgeschermd door toestemming van de oudere. Uw opname is versleuteld en wordt alleen gebruikt voor spraaksynthese.'
            : 'Record your voice so HAVEN can speak to Margaret using your voice. This is optional and gated by elder consent. Your recording is encrypted and used only for TTS synthesis.'}
        </Text>
      </View>

      {/* VAPI integration status */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: profileId ? '#10B981' : '#F59E0B' }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: profileId ? '#10B981' : '#F59E0B' }}>
          {profileId
            ? (nl ? 'Stemprofiel actief — VAPI voice AI' : 'Voice profile active — VAPI voice AI')
            : (nl ? 'Geen stemprofiel — neem uw stem op' : 'No voice profile — record your voice')}
        </Text>
      </View>

      {/* Privacy disclosure */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>{nl ? 'Privacyverklaring' : 'Privacy disclosure'}</Text>
        {privacyItems.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 2 }}>ℹ</Text>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Sample sentences */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>
          {nl ? 'Voorbeeldzinnen om op te nemen' : 'Sample sentences to record'}
        </Text>
        {FAMILIAR_VOICE_STATUS.sampleSentences.map((sentence, i) => (
          <View key={i} style={{
            backgroundColor: colors.mist, borderRadius: 14, padding: 12,
            borderWidth: 1, borderColor: colors.mist,
          }}>
            <Text style={{ fontSize: 14, color: colors.ink, fontStyle: 'italic', fontWeight: '600' }}>"{sentence}"</Text>
          </View>
        ))}
      </View>

      {/* Record / Status section */}
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        {!recorded ? (
          <>
            <TouchableOpacity
              onPress={handleRecord}
              disabled={uploading}
              style={{
                width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center',
                backgroundColor: recording ? '#EF4444' : uploading ? '#9CA3AF' : colors.paper,
                borderWidth: recording || uploading ? 0 : 4, borderColor: '#F59E0B',
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
              }}
            >
              <Text style={{ fontSize: 32 }}>{uploading ? '⏳' : recording ? '⏹' : '🎤'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: recording || uploading ? '#fff' : colors.graphite, marginTop: 2 }}>
                {uploading
                  ? (nl ? 'Uploaden...' : 'Uploading...')
                  : recording
                    ? (nl ? 'Tik om te stoppen' : 'Tap to stop')
                    : (nl ? 'Opnemen' : 'Record')}
              </Text>
            </TouchableOpacity>
            {recording && (
              <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '700' }}>
                {nl ? 'Lees de voorbeeldzinnen hierboven voor...' : 'Read the sample sentences above...'}
              </Text>
            )}
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#065F46' }}>
              {nl ? 'Stemprofiel aangemaakt!' : 'Voice profile created!'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.pewter, fontWeight: '600', textAlign: 'center' }}>
              {nl ? 'Wacht op toestemming van Margaret om te activeren' : 'Awaiting Margaret\'s consent to activate'}
            </Text>

            {/* Test playback */}
            <TouchableOpacity
              onPress={handleTestPlayback}
              disabled={playingTest}
              style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: '#3B82F6', marginTop: 4 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                {playingTest
                  ? (nl ? '🔊 Afspelen...' : '🔊 Playing...')
                  : (nl ? '▶ Testfragment beluisteren' : '▶ Listen to test clip')}
              </Text>
            </TouchableOpacity>

            {/* Record again */}
            <TouchableOpacity
              onPress={handleRecordAgain}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.mist }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>
                {nl ? 'Opnieuw opnemen' : 'Record again'}
              </Text>
            </TouchableOpacity>

            {/* Delete profile */}
            <TouchableOpacity
              onPress={handleRevokeProfile}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FEE2E2', marginTop: 4 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
                {nl ? 'Stemprofiel verwijderen' : 'Delete voice profile'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
