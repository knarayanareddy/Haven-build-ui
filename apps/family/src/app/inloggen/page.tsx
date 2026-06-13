export default function SignInPage() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', borderRadius: 24, padding: 24, border: '1px solid #E8EBF2', boxShadow: '0 14px 40px rgba(44,62,107,.12)' }}>
        <h1 style={{ marginTop: 0, color: '#1A1F2E' }}>Sign in to HAVEN</h1>
        <p style={{ color: '#6B7490' }}>This dashboard requires an authenticated, consent-scoped family session.</p>
        <p style={{ color: '#1A1F2E', fontWeight: 700 }}>Use the real Supabase-auth flow in production.</p>
      </section>
    </main>
  );
}
