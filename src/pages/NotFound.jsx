import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="auth">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <div className="mono" style={{
          fontSize: 44, fontWeight: 700, color: 'var(--ink-300)',
          letterSpacing: '-3px', marginBottom: 12,
        }}>404</div>
        <div className="h2" style={{ marginBottom: 8 }}>That page isn&apos;t here</div>
        <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 22 }}>
          The link may be old, or the project may have been renamed.
        </p>
        <Link to="/portal" className="btn btn-s" style={{ textDecoration: 'none' }}>
          Back to your overview
        </Link>
      </div>
    </div>
  )
}
