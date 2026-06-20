// ─── Vision UI Gradient & Pillar Color Definitions ───
// Used by GradientCard and screen headers for the vision-rich UI overlay.

export const pillarGradients: Record<string, [string, string]> = {
  today: ['#38bdf8', '#0ea5e9'],
  pills: ['#22c55e', '#16a34a'],
  shield: ['#8b5cf6', '#7c3aed'],
  family: ['#f43f5e', '#e11d48'],
  buurt: ['#14b8a6', '#0d9488'],
  kompas: ['#6366f1', '#4f46e5'],
  stem: ['#f59e0b', '#d97706'],
  wacht: ['#ef4444', '#dc2626'],
  platform: ['#2C3E6B', '#1e3a5f'],
  settings: ['#64748b', '#475569'],
};

export const statusColors = {
  green: '#22c55e',
  greenBg: '#dcfce7',
  amber: '#f59e0b',
  amberBg: '#fef3c7',
  red: '#ef4444',
  redBg: '#fee2e2',
} as const;

export const riskColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#991b1b',
} as const;
