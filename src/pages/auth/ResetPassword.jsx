import { useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { post } from '../../lib/api'
import { EP } from '../../lib/endpoints'
import ErrorNote from '../../components/ErrorNote'

export default function ResetPassword() {
  const { token: pathToken } = useParams()
  const [sp] = useSearchParams()
  const token = pathToken || sp.get('token')
  const nav = useNavigate()

  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const longEnough = pw.length >= 10
  const matches = pw.length > 0 && pw === confirm
  const canSubmit = longEnough && matches && !busy

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      await post(EP.passwordReset(), { token, password: pw })
      nav('/login', { replace: true, state: { reset: true } })
    } catch (err) { setError(err) } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="brand-mark"><span>&lt;/&gt;</span></div>
          <span className="brand-name">easy<i>code</i></span>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div className="h2" style={{ marginBottom: 5 }}>Choose a new password</div>
          <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 20, lineHeight: 1.6 }}>
            Once you save, you&apos;ll be signed out everywhere else.
          </div>

          <div className="stack tight">
            <div>
              <label className="lbl" htmlFor="p1">New password</label>
              <input id="p1" className="inp" type="password" autoComplete="new-password" required
                value={pw} onChange={(e) => setPw(e.target.value)} />
              <div className="pwbar">
                <i className={pw.length >= 4 ? 'f1' : ''} />
                <i className={pw.length >= 7 ? 'f2' : ''} />
                <i className={longEnough ? 'f3' : ''} />
                <i className={pw.length >= 14 ? 'f3' : ''} />
              </div>
              {pw && !longEnough && (
                <div style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 7 }}>
                  Getting there — needs at least 10 characters.
                </div>
              )}
            </div>
            <div>
              <label className="lbl" htmlFor="p2">Confirm it</label>
              <input id="p2" className="inp" type="password" autoComplete="new-password" required
                style={confirm && !matches ? { borderColor: 'rgba(240,85,95,.4)' } : undefined}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {confirm && !matches && (
                <div className="row" style={{ gap: 6, marginTop: 7 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                  </svg>
                  <span style={{ fontSize: 11.5, color: 'var(--red)' }}>These two don&apos;t match yet</span>
                </div>
              )}
            </div>
          </div>

          {error && <div style={{ marginTop: 14 }}><ErrorNote error={error} /></div>}

          <button className="btn btn-p blk" type="submit" disabled={!canSubmit}
            style={{ padding: 11, marginTop: 18, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
          <div className="hr" />
          <Link to="/login" className="btn btn-g blk" style={{ textDecoration: 'none' }}>Back to sign in</Link>
        </form>
      </div>
    </div>
  )
}
