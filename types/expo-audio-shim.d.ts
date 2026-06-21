// Type stubs for expo-audio and expo-av — used in dynamic imports
// These modules may not be installed in all apps (e.g. grandchild/family dashboard)
declare module 'expo-audio' {
  export const AudioModule: {
    requestRecordingPermissionsAsync: () => Promise<{ granted: boolean }>;
    AudioRecorder: new (preset: unknown) => {
      prepareToRecordAsync: () => void;
      record: () => void;
      stop: () => Promise<void>;
      uri: string | null;
    };
  };
  export const RecordingPresets: {
    HIGH_QUALITY: unknown;
  };
}

declare module 'expo-av' {
  export const Audio: {
    Sound: {
      createAsync: (source: { uri: string }) => Promise<{
        sound: {
          playAsync: () => Promise<void>;
          unloadAsync: () => Promise<void>;
          setOnPlaybackStatusUpdate: (callback: (status: Record<string, unknown>) => void) => void;
        };
      }>;
    };
  };
}

declare module 'expo-file-system' {
  export const EncodingType: {
    Base64: string;
  };
  export function readAsStringAsync(uri: string, options?: { encoding?: string }): Promise<string>;
}
