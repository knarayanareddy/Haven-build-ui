import React from 'react';
import type { AlertLevel } from '@haven/contracts/src/haven';

export interface AlertRow {
  id: string;
  level: AlertLevel;
  channel: string;
  score: number;
  explanation_nl: string;
  explanation_en: string;
  created_at: string;
  family_notified: boolean;
}

const LEVEL_TONE: Record<AlertLevel, { background: string; border: string; text: string; label: string }> = {
  none:   { background: '#FFFFFF', border: '#E8EBF2', text: '#6B7490', label: 'Geen' },
  amber:  { background: '#FDF3E0', border: '#A56A00', text: '#A56A00', label: 'Amber' },
  rood:   { background: '#FAE8E8', border: '#C94A4A', text: '#C94A4A', label: 'Rood' },
  zwart:  { background: '#FAE8E8', border: '#C94A4A', text: '#C94A4A', label: 'Zwart' },
};

function formatTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(date);
}

export function AlertList({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) {
    return <p style={{ color: '#4A7B5A', fontWeight: 700 }}>Geen meldingen. HAVEN houdt het rustig.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
      {alerts.map((alert) => {
        const tone = LEVEL_TONE[alert.level] ?? LEVEL_TONE.none;
        return (
          <li key={alert.id} style={{ padding: 16, borderRadius: 18, background: tone.background, border: `2px solid ${tone.border}`, color: tone.text }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase' }}>{tone.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Score {alert.score}</span>
            </div>
            <p style={{ marginTop: 8, fontSize: 16, color: '#1A1F2E', fontWeight: 700 }}>{alert.explanation_nl}</p>
            <p style={{ marginTop: 4, fontSize: 14, color: '#6B7490' }}>{alert.channel} · {formatTime(alert.created_at)}{alert.family_notified ? ' · familie geïnformeerd' : ''}</p>
          </li>
        );
      })}
    </ul>
  );
}
