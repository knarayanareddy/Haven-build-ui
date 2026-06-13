import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'HAVEN Family Dashboard',
  description: 'Consent-scoped family dashboard for HAVEN.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Nunito, system-ui, sans-serif', background: '#F5F3EE' }}>{children}</body>
    </html>
  );
}
