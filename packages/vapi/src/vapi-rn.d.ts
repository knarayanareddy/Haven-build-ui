// Type stub for @vapi-ai/react-native — the SDK is optional (peer dep).
// At runtime, vapiClient.ts does a dynamic import with .catch(() => null) fallback.
declare module '@vapi-ai/react-native' {
  class Vapi {
    constructor(apiKey: string);
    start(assistantId: string, config?: Record<string, unknown>): Promise<void>;
    stop(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    removeAllListeners(): void;
  }
  export default Vapi;
  export { Vapi };
}
