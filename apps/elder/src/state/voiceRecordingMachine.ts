export type VoiceRecordingState = 'idle' | 'requesting_permission' | 'recording' | 'processing' | 'permission_denied' | 'failed' | 'completed';

export class VoiceRecordingMachine {
  private state: VoiceRecordingState = 'idle';
  private startedAt: number | null = null;

  get current() { return this.state; }

  requestPermission() { this.state = 'requesting_permission'; }
  permissionGranted() { this.state = 'recording'; this.startedAt = Date.now(); }
  permissionDenied() { this.state = 'permission_denied'; this.startedAt = null; }
  stopRecording() { if (this.state === 'recording') this.state = 'processing'; }
  complete() { this.state = 'completed'; this.startedAt = null; }
  fail() { this.state = 'failed'; this.startedAt = null; }
  reset() { this.state = 'idle'; this.startedAt = null; }

  shouldAutoStop(maxDurationMs = 30000) {
    return this.state === 'recording' && this.startedAt !== null && Date.now() - this.startedAt >= maxDurationMs;
  }

  recoverFromPermissionLoss() {
    if (this.state === 'recording' || this.state === 'processing') {
      this.state = 'permission_denied';
      this.startedAt = null;
    }
  }
}
