import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  tone?: 'safe' | 'amber' | 'teal' | 'danger' | string;
  children: React.ReactNode;
}

const TONE_BORDER: Record<string, string> = {
  safe: '2px solid #A7D6CD',
  amber: '2px solid #FDF3E0',
  teal: '2px solid #A7D6CD',
  danger: '2px solid #FAE8E8',
};

const TONE_BG: Record<string, string> = {
  safe: '#F7FCFA',
  amber: '#FFFDF9',
  teal: '#F4FAF9',
  danger: '#FFFBFB',
};

export function DashboardCard({ title, subtitle, tone, children }: DashboardCardProps) {
  const border = tone && TONE_BORDER[tone] ? TONE_BORDER[tone] : '1px solid #E8EBF2';
  const background = tone && TONE_BG[tone] ? TONE_BG[tone] : '#FFFFFF';

  return (
    <section style={{ background, borderRadius: 24, padding: 24, boxShadow: '0 14px 40px rgba(44,62,107,.12)', border, transition: 'all 0.3s ease' }}>
      <h2 style={{ margin: 0, color: '#1A1F2E' }}>{title}</h2>
      {subtitle ? <p style={{ color: '#6B7490', fontWeight: 700 }}>{subtitle}</p> : null}
      {children}
    </section>
  );
}
