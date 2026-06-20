export interface ScamRule {
  id: string;
  label: string;
  score: number;
  phrases: string[];
}

export interface ScamRuleHit {
  id: string;
  label: string;
  score: number;
}

export declare const scamRules: ScamRule[];
export declare function alertLevelFromScore(score: number): 'none' | 'amber' | 'rood' | 'zwart';
export declare function scoreScamText(input: string): {
  score: number;
  level: 'none' | 'amber' | 'rood' | 'zwart';
  hits: ScamRuleHit[];
};
