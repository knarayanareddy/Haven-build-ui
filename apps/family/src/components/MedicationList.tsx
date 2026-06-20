import React from 'react';
import type { MedicationReminder, ReminderStatus } from '@haven/contracts/src/haven';

const STATUS_COLOURS: Record<ReminderStatus, { background: string; text: string; label: string }> = {
  gepland:        { background: '#E8EBF2', text: '#6B7490', label: 'Gepland' },
  herinnerd:      { background: '#FDF3E0', text: '#A56A00', label: 'Herinnerd' },
  gesnoozed_1:    { background: '#FDF3E0', text: '#A56A00', label: 'Snooze 1' },
  gesnoozed_2:    { background: '#FDF3E0', text: '#A56A00', label: 'Snooze 2' },
  geëscaleerd:    { background: '#FAE8E8', text: '#C94A4A', label: 'Geëscaleerd' },
  ingenomen:      { background: '#EBF4EE', text: '#4A7B5A', label: 'Ingenomen' },
  laat_ingenomen: { background: '#EBF4EE', text: '#4A7B5A', label: 'Laat ingenomen' },
  gemist:         { background: '#FAE8E8', text: '#C94A4A', label: 'Gemist' },
  overgeslagen:   { background: '#E8EBF2', text: '#6B7490', label: 'Overgeslagen' },
};

function formatTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(date);
}

export interface MedicationListProps {
  medications: Array<Pick<MedicationReminder, 'id' | 'status' | 'scheduled_time'> & { medication_name_nl?: string }>;
}

export function MedicationList({ medications }: MedicationListProps) {
  if (medications.length === 0) {
    return <p style={{ color: '#6B7490', fontWeight: 700 }}>Geen medicijnen zichtbaar met huidige toestemming.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
      {medications.map((m) => {
        const tone = STATUS_COLOURS[m.status] ?? STATUS_COLOURS.gepland;
        return (
          <li key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 14, background: tone.background, color: tone.text }}>
            <span style={{ fontWeight: 900, fontSize: 18 }}>{m.medication_name_nl ?? 'Medicijn'}</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{formatTime(m.scheduled_time)}</span>
            <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{tone.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
