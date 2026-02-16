'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0F0F0F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#EF4444', margin: 0 }}>500</h1>
      <p style={{ fontSize: '18px', color: '#888', marginTop: '8px' }}>Something went wrong</p>
      <button
        onClick={reset}
        style={{ marginTop: '24px', padding: '12px 32px', backgroundColor: '#F5C842', color: '#0F0F0F', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
      >
        Try Again
      </button>
    </div>
  );
}
