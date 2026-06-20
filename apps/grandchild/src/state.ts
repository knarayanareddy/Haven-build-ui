export type GrandchildSendState = 'idle' | 'recording' | 'preview' | 'sending' | 'sent' | 'failed';

export class GrandchildSendMachine {
  private state: GrandchildSendState = 'idle';
  get current() { return this.state; }
  startRecording() { this.state = 'recording'; }
  preview() { this.state = 'preview'; }
  send() { this.state = 'sending'; }
  sent() { this.state = 'sent'; }
  fail() { this.state = 'failed'; }
  reset() { this.state = 'idle'; }
}
