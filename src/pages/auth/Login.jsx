import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { isStaff } from '../../lib/endpoints'
import ErrorNote from '../../components/ErrorNote'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      const user = await signIn(email.trim(), password)
      const dest = loc.state?.from || (isStaff(user.role) ? '/admin' : '/portal')
      nav(dest, { replace: true })
    } catch (err) {
      setError(err)
    } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="brand-mark"><span>&lt;/&gt;</span></div>
          <span className="brand-name">easy<i>code</i></span>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="h2" style={{ marginBottom: 5 }}>Sign in to your portal</div>
            <div style={{ fontSize: 13, color: 'var(--mute)' }}>
              Check your project, send a request, pay an invoice.
            </div>
          </div>

          <div className="stack tight">
            <div>
              <label className="lbl" htmlFor="email">Email</label>
              <input id="email" className="inp" type="email" autoComplete="email" required
                placeholder="you@yourbusiness.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="spread" style={{ marginBottom: 5 }}>
                <label className="lbl" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 11.5, color: 'var(--mute)' }}>Forgot it?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password" className="inp" type={show ? 'text' : 'password'}
                  autoComplete="current-password" required style={{ paddingRight: 42 }}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn btn-g"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((s) => !s)}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '4px 6px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ marginTop: 14 }}><ErrorNote error={error} /></div>}

          <button className="btn btn-p blk" type="submit" disabled={busy}
            style={{ padding: 11, marginTop: 16, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="hr" />
          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6 }}>
            Portals are set up by us when your project starts.<br />
            Don&apos;t have one? <Link to="/contact" style={{ color: 'var(--em-hi)' }}>Get a quote</Link>
          </div>
        </form>

        <div className="auth-foot">
          Trouble signing in? Call <span className="mono" style={{ color: 'var(--mute-hi)' }}>(212) 555-0100</span>
        </div>
      </div>
    </div>
  )
}
