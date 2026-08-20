import { useState } from 'react'
import { Link } from 'react-router-dom'
import { post } from '../../lib/api'
import { EP } from '../../lib/endpoints'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    // Backend returns 204 whether or not the account exists, and so do we.
    // A different message here would let a stranger enumerate our clients.
    try { await post(EP.passwordForgot(), { email: email.trim() }) } catch { /* same path */ }
    setBusy(false); setSent(true)
  }

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="brand-mark"><span>&lt;/&gt;</span></div>
          <span className="brand-name">easy<i>code</i></span>
        </div>

        {sent ? (
          <div className="auth-card">
            <div className="row tp" style={{ gap: 12 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" />
              </svg>
              <div>
                <div className="h2" style={{ marginBottom: 6 }}>Check your email</div>
                <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
                  If an account exists for that address, a reset link is on its way.
                  It works once and expires in an hour.
                </p>
              </div>
            </div>
            <div className="hr" />
            <Link to="/login" className="btn btn-g blk" style={{ textDecoration: 'none' }}>Back to sign in</Link>
          </div>
        ) : (
          <form className="auth-card" onSubmit={submit}>
            <div className="h2" style={{ marginBottom: 5 }}>Reset your password</div>
            <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 20, lineHeight: 1.6 }}>
              Enter the email you use for your portal and we&apos;ll send a reset link.
            </div>
            <label className="lbl" htmlFor="e">Email</label>
            <input id="e" className="inp" type="email" required autoComplete="email"
              placeholder="you@yourbusiness.com"
              value={email} onChange={(ev) => setEmail(ev.target.value)} />
            <button className="btn btn-p blk" type="submit" disabled={busy}
              style={{ padding: 11, marginTop: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="hr" />
            <Link to="/login" className="btn btn-g blk" style={{ textDecoration: 'none' }}>Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  )
}
