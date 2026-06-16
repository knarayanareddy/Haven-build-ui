import { HavenClient } from '../services/havenClient';
import { claimNextOfflineAction, completeOfflineAction, markOfflineActionFailed } from '../services/sqliteOfflineQueue';
import { resilientCall } from './networkResilience';

export type SyncState = 'idle' | 'syncing' | 'paused_offline' | 'failed';

export class OfflineSyncMachine {
  private state: SyncState = 'idle';
  get current() { return this.state; }

  async sync(client: HavenClient) {
    this.state = 'syncing';
    let action = claimNextOfflineAction();

    while (action !== null) {
      try {
        // Enforce idempotency_key usage on backend server submissions
        const payloadWithIdem = { ...(action.payload as any), idempotency_key: action.idempotencyKey };
        await resilientCall(async () => {
          if (action!.type === 'CONFIRM_MEDICATION') return client.voice({ ...payloadWithIdem, transcript_text: 'I took it' });
          if (action!.type === 'SEND_MESSAGE') return client.sendFamilyMessage(payloadWithIdem);
          if (action!.type === 'WELLNESS_CHECKIN') return client.healthLog(payloadWithIdem);
          return client.screenData(payloadWithIdem);
        });
        completeOfflineAction(action.idempotencyKey);
        action = claimNextOfflineAction();
      } catch (_) {
        markOfflineActionFailed(action.idempotencyKey);
        this.state = 'failed';
        return;
      }
    }
    this.state = 'idle';
  }

  pauseOffline() { this.state = 'paused_offline'; }
  reset() { this.state = 'idle'; }
}
