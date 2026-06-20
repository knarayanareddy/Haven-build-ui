import React from 'react';

export interface DailyStatus {
  status: 'green' | 'amber' | 'red';
  reasons: string[];
  generated_at: string;
}

export interface DailyStatusPillProps {
  status: DailyStatus;
}

const TONE_COLOURS: Record<DailyStatus['status'], { background: string; border: string; text: string; label_en: string; label_nl: string }> = {
  green: { background: '#EBF4EE', border: '#4A7B5A', text: '#4A7B5A', label_en: 'All good today', label_nl: 'Alles goed vandaag' },
  amber: { background: '#FDF3E0', border: '#A56A00', text: '#A56A00', label_en: 'A little quiet today', label_nl: 'Even opletten vandaag' },
  red:   { background: '#FAE8E8', border: '#C94A4A', text: '#C94A4A', label_en: 'Action needed', label_nl: 'Actie nodig' },
};

export function DailyStatusPill({ status }: DailyStatusPillProps) {
  const tone = TONE_COLOURS[status.status];
  return (
    <section style={{ background: tone.background, border: `2px solid ${tone.border}`, borderRadius: 22, padding: 24, color: tone.text, fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ width: 20, height: 20, borderRadius: 10, background: tone.text }} aria-hidden />
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{tone.label_nl}</h2>
      </header>
      {status.reasons.length > 0 ? (
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16 }}>Waarom</p>
          <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 16, color: '#1A1F2E' }}>
            {status.reasons.map((r, idx) => (<li key={idx}>{r}</li>))}
          </ul>
          <p style={{ marginTop: 12, fontWeight: 900, fontSize: 16 }}>Wat kunt u nu doen</p>
          <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 16, color: '#1A1F2E' }}>
            {status.status === 'red' ? <li>Bel rustig even, zonder druk.</li> : null}
            {status.status === 'amber' ? <li>Stuur een hartje of bel kort om te checken.</li> : null}
            {status.status === 'green' ? <li>Niets nodig — geniet van de dag.</li> : null}
            <li>HAVEN houdt het in de gaten en waarschuwt als er iets verandert.</li>
          </ul>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 16 }}>Alles rustig. Niets om u zorgen over te maken vandaag.</p>
      )}
      <footer style={{ marginTop: 12, fontSize: 12, color: '#6B7490' }}>Laatst berekend: {new Date(status.generated_at).toLocaleString('nl-NL')}</footer>
    </section>
  );
}
