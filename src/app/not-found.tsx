export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0F0F0F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#F5C842', margin: 0 }}>404</h1>
      <p style={{ fontSize: '18px', color: '#888', marginTop: '8px' }}>Page not found</p>
      <a href="/" style={{ marginTop: '24px', padding: '12px 32px', backgroundColor: '#F5C842', color: '#0F0F0F', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
        Back to Dashboard
      </a>
    </div>
  );
}
