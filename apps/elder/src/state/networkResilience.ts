export type NetworkStatus = 'online' | 'offline' | 'degraded';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 500,
  maxDelayMs: 8000,
};

export function retryDelay(attempt: number, policy: RetryPolicy = defaultRetryPolicy) {
  const exponential = policy.baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * policy.baseDelayMs);
  return Math.min(policy.maxDelayMs, exponential + jitter);
}

export async function resilientCall<T>(operation: () => Promise<T>, policy: RetryPolicy = defaultRetryPolicy): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      last = error;
      if (attempt < policy.maxAttempts) await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt, policy)));
    }
  }
  throw last;
}

export function classifyNetworkError(error: unknown): NetworkStatus {
  const message = String((error as Error)?.message ?? error).toLowerCase();
  if (message.includes('network') || message.includes('fetch') || message.includes('offline')) return 'offline';
  if (message.includes('timeout') || message.includes('429') || message.includes('503')) return 'degraded';
  return 'online';
}
