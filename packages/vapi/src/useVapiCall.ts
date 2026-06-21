// React hook for VAPI real-time voice calls in Haven.
// Falls back to the existing record-upload-wait flow when VAPI is unavailable.

import { useCallback, useEffect, useRef, useState } from 'react';
import { VapiVoiceService, type VapiCallState, type VapiConfig } from './vapiClient';

export interface UseVapiCallReturn {
  state: VapiCallState;
  start: () => Promise<void>;
  stop: () => void;
  isAvailable: boolean;
}

const IDLE_STATE: VapiCallState = {
  status: 'idle',
  isSpeaking: false,
  volumeLevel: 0,
  transcript: '',
  messages: [],
};

export function useVapiCall(config: Omit<VapiConfig, 'apiKey' | 'assistantId'> | null): UseVapiCallReturn {
  const [state, setState] = useState<VapiCallState>(IDLE_STATE);
  const serviceRef = useRef<VapiVoiceService | null>(null);
  const isAvailable = VapiVoiceService.isAvailable();

  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current.removeAllListeners();
        serviceRef.current = null;
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (!config) return;

    const apiKey = process.env.EXPO_PUBLIC_VAPI_API_KEY;
    const assistantId = config.locale === 'nl-NL'
      ? (process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID_NL ?? process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID)
      : (process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID_EN ?? process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID);

    if (!apiKey || !assistantId) {
      throw new Error('VAPI_NOT_CONFIGURED');
    }

    const service = new VapiVoiceService({
      ...config,
      apiKey,
      assistantId,
    });

    service.on('state-change', (newState: VapiCallState) => {
      setState({ ...newState });
    });

    service.on('error', (error: unknown) => {
      console.warn('[VAPI] Call error:', error);
    });

    serviceRef.current = service;
    await service.start();
  }, [config]);

  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  }, []);

  return { state, start, stop, isAvailable };
}
