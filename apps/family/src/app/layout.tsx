import type { Metadata } from 'next';
import React from 'react';
import { Nunito } from 'next/font/google';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '900'] });

export const metadata: Metadata = {
  title: 'HAVEN Family Dashboard',
  description: 'Consent-scoped family dashboard for HAVEN.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className} style={{ margin: 0, background: '#F5F3EE' }}>{children}</body>
    </html>
  );
}
