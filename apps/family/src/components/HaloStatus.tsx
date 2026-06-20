import React from 'react';
import type { AlertLevel } from '@haven/contracts/src/haven';

export interface HaloAxis {
  label: string;
  level: 'green' | 'amber' | 'red' | 'grey';
  detail: string;
}

export interface HaloStatusProps {
  axes: HaloAxis[];
  title?: string;
}

const LEVEL_COLOURS: Record<HaloAxis['level'], { background: string; border: string; text: string }> = {
  green: { background: '#EBF4EE', border: '#4A7B5A', text: '#4A7B5A' },
  amber: { background: '#FDF3E0', border: '#A56A00', text: '#A56A00' },
  red: { background: '#FAE8E8', border: '#C94A4A', text: '#C94A4A' },
  grey: { background: '#E8EBF2', border: '#6B7490', text: '#6B7490' },
};

export function HaloStatus({ axes, title = 'Halo' }: HaloStatusProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${axes.length}, 1fr)`, gap: 12 }}>
      {axes.map((axis) => {
        const tone = LEVEL_COLOURS[axis.level];
        return (
          <div key={axis.label} style={{ borderRadius: 18, padding: 16, background: tone.background, border: `2px solid ${tone.border}`, color: tone.text }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{axis.label}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{axis.detail}</div>
          </div>
        );
      })}
      <span style={{ display: 'none' }}>{title}</span>
    </div>
  );
}

export function alertToLevel(level: AlertLevel): 'green' | 'amber' | 'red' | 'grey' {
  if (level === 'amber') return 'amber';
  if (level === 'rood' || level === 'zwart') return 'red';
  return 'green';
}
