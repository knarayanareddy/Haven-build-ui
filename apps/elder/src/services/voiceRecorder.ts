import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

type RecordingHandle = {
  stopAndUnloadAsync: () => Promise<void>;
  getURI: () => string | null;
};

export interface ActiveVoiceRecording {
  stop: () => Promise<{ uri: string; audioBase64: string }>;
}

async function readRecording(recording: RecordingHandle) {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  if (!uri) throw new Error('Recording URI missing');
  const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return { uri, audioBase64 };
}

export async function startVoiceRecording(): Promise<ActiveVoiceRecording> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Microphone permission is required');
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  return { stop: () => readRecording(recording) };
}

export async function recordVoiceOnce(maxDurationMs = 30000) {
  const recording = await startVoiceRecording();
  await new Promise((resolve) => setTimeout(resolve, maxDurationMs));
  return recording.stop();
}
