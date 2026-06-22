// VAPI Voice Service for Haven
// Wraps VAPI's real-time voice API for bidirectional elder voice conversations.
// When VAPI_API_KEY is not set, falls back to the existing record-upload-wait flow.

import { EventEmitter } from 'events';
import { VapiError } from './VapiError';

export interface VapiConfig {
  apiKey: string;
  assistantId: string;
  elderName?: string;
  locale: 'en-GB' | 'nl-NL';
  elderId: string;
  supabaseUrl: string;
}

export interface VapiCallState {
  status: 'idle' | 'connecting' | 'active' | 'ending';
  isSpeaking: boolean;
  volumeLevel: number;
  transcript: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
}

type VapiInstance = {
  start: (assistantId: string, config?: Record<string, unknown>) => Promise<void>;
  stop: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners: () => void;
};

export class VapiVoiceService extends EventEmitter {
  private vapi: VapiInstance | null = null;
  private state: VapiCallState = {
    status: 'idle',
    isSpeaking: false,
    volumeLevel: 0,
    transcript: '',
    messages: [],
  };

  constructor(private config: VapiConfig) {
    super();
  }

  getState(): VapiCallState {
    return { ...this.state, messages: [...this.state.messages] };
  }

  private updateState(partial: Partial<VapiCallState>) {
    Object.assign(this.state, partial);
    this.emit('state-change', this.getState());
  }

  async start(): Promise<void> {
    if (this.state.status !== 'idle') return;

    this.updateState({ status: 'connecting', messages: [] });

    try {
      // Dynamic import: @vapi-ai/react-native may not be installed
      const VapiModule = await import('@vapi-ai/react-native').catch(() => null);
      if (!VapiModule) {
        throw new VapiError('VAPI_SDK_NOT_AVAILABLE');
      }

      const VapiClass = VapiModule.default ?? VapiModule.Vapi;
      this.vapi = new VapiClass(this.config.apiKey) as VapiInstance;

      this.vapi.on('call-start', () => {
        this.updateState({ status: 'active' });
      });

      this.vapi.on('call-end', () => {
        this.cleanup();
      });

      this.vapi.on('speech-start', () => {
        this.updateState({ isSpeaking: true });
      });

      this.vapi.on('speech-end', () => {
        this.updateState({ isSpeaking: false });
      });

      this.vapi.on('volume-level', (level: unknown) => {
        this.updateState({ volumeLevel: Math.round(Number(level) * 100) });
      });

      this.vapi.on('message', (msg: unknown) => {
        const m = msg as Record<string, unknown>;
        if (m.type === 'transcript' && m.transcriptType === 'final') {
          const role = m.role === 'assistant' ? 'assistant' : 'user';
          const content = String(m.transcript ?? '');
          if (content) {
            this.state.messages.push({ role, content, timestamp: new Date() });
            this.updateState({
              transcript: content,
              messages: [...this.state.messages],
            });
          }
        }
        if (m.type === 'function-call') {
          this.emit('function-call', m);
        }
      });

      this.vapi.on('error', (error: unknown) => {
        this.emit('error', error);
        this.cleanup();
      });

      const assistantOverrides: Record<string, unknown> = {
        metadata: {
          elder_id: this.config.elderId,
          locale: this.config.locale,
        },
      };

      if (this.config.locale === 'nl-NL') {
        assistantOverrides.firstMessage = 'Hallo, ik ben er voor u. Wat kan ik voor u doen?';
      } else {
        assistantOverrides.firstMessage = 'Hello, I am here for you. What can I help you with?';
      }

      await this.vapi.start(this.config.assistantId, { assistantOverrides });
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  stop(): void {
    if (this.vapi && this.state.status === 'active') {
      this.updateState({ status: 'ending' });
      this.vapi.stop();
    }
  }

  private cleanup() {
    if (this.vapi) {
      this.vapi.removeAllListeners();
      this.vapi = null;
    }
    this.updateState({
      status: 'idle',
      isSpeaking: false,
      volumeLevel: 0,
    });
  }

  static isAvailable(): boolean {
    return Boolean(
      process.env.EXPO_PUBLIC_VAPI_API_KEY &&
      process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID
    );
  }
}
