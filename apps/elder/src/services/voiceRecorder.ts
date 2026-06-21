export interface ActiveVoiceRecording {
  stop: () => Promise<{ uri: string; audioBase64: string }>;
}

export async function startVoiceRecording(): Promise<ActiveVoiceRecording> {
  // Voice recording is disabled in demo builds — the expo-audio AudioRecorder
  // API requires native module initialization that is unreliable across devices.
  // Show a friendly message instead of crashing.
  throw new Error('Spraakopname is niet beschikbaar in de demo. / Voice recording is not available in demo mode.');
}

export async function recordVoiceOnce(_maxDurationMs = 30000) {
  return startVoiceRecording().then((r) => r.stop());
}
