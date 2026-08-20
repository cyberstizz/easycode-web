import { Component } from 'react'

/**
 * Without this, any component that throws unmounts the whole tree and leaves
 * a blank white page with nothing useful in the console. That is the single
 * most expensive failure mode in a React app — you cannot tell a crash from
 * a routing problem from a server problem.
 *
 * This turns all of that into a readable screen with the actual message and
 * stack, so the next blank screen takes ten seconds instead of a day.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[EasyCode] Uncaught render error:', error, info)
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children

    return (
      <div className="auth" style={{ alignItems: 'flex-start', paddingTop: 56 }}>
        <div style={{ width: '100%', maxWidth: 760 }}>
          <div className="auth-brand">
            <div className="brand-mark"><span>&lt;/&gt;</span></div>
            <span className="brand-name">easy<i>code</i></span>
          </div>

          <div className="auth-card">
            <div className="row" style={{ gap: 11, marginBottom: 14 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke="var(--red)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
              </svg>
              <div className="h2">A component crashed</div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 16 }}>
              This is a bug in the frontend, not your setup. The message below names the file.
            </p>

            <div className="mono" style={{
              background: 'var(--ink-000)', border: '1px solid rgba(240,85,95,.3)',
              borderRadius: 'var(--r)', padding: '13px 15px', fontSize: 12.5,
              color: '#FFB3B8', lineHeight: 1.6, overflowX: 'auto',
            }}>
              {String(error?.message || error)}
            </div>

            {info?.componentStack && (
              <details style={{ marginTop: 14 }}>
                <summary style={{ fontSize: 12.5, color: 'var(--mute)', cursor: 'pointer' }}>
                  Component stack
                </summary>
                <pre className="mono" style={{
                  marginTop: 10, fontSize: 11.5, color: 'var(--mute-hi)',
                  whiteSpace: 'pre-wrap', lineHeight: 1.6,
                  maxHeight: 280, overflow: 'auto',
                }}>{info.componentStack.trim()}</pre>
              </details>
            )}

            <div className="hr" />
            <div className="row" style={{ gap: 9 }}>
              <button className="btn btn-p sm" onClick={() => window.location.reload()}>
                Reload
              </button>
              <button className="btn btn-s sm" onClick={() => { window.location.href = '/portal' }}>
                Go to the portal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}