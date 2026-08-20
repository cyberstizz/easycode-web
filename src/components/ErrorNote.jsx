/** One consistent way to show a failure. Never a raw stack, never a blank screen. */
export default function ErrorNote({ error, onRetry }) {
  if (!error) return null
  const notMocked = error.code === 'NOT_MOCKED'
  return (
    <div className="note" style={{
      background: 'var(--red-dim)', border: '1px solid rgba(240,85,95,.28)',
      color: '#FFB3B8', display: 'flex', gap: 11, alignItems: 'flex-start',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)"
        strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13 }}>{error.message}</div>
        {notMocked && (
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>
            Running in mock mode. Add this route to src/lib/mock.js, or set VITE_USE_MOCK=0.
          </div>
        )}
        {onRetry && (
          <button className="btn btn-s sm" style={{ marginTop: 10 }} onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
