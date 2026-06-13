import type { AlertLevel } from '@haven/contracts/src/haven';
import { scamRules, scoreScamText } from './catalog.mjs';

export interface RuleHit {
  id: string;
  label: string;
  score: number;
}

export { scamRules };

export function scoreSignal(input: string): { score: number; level: AlertLevel; hits: RuleHit[] } {
  const result = scoreScamText(input);
  return {
    score: result.score,
    level: result.level as AlertLevel,
    hits: result.hits,
  };
}
