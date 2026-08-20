import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { useAuth } from '../../auth/AuthProvider'
import { EP } from '../../lib/endpoints'
import { longDate } from '../../lib/format'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/** Mirrors the backend's rules. Kept in sync deliberately — client-side is UX, server-side is truth. */
function scorePassword(p) {
  const checks = {
    length: p.length >= 10,
    complex: /[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p),
    varied: /[a-z]/.test(p) && /[A-Z]/.test(p),
  }
  return { checks, score: Object.values(checks).filter(Boolean).length }
}

const Tick = ({ on }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke={on ? 'var(--em)' : 'var(--ink-400)'} strokeWidth="3">
    {on ? <path d="M20 6L9 17l-5-5" /> : <circle cx="12" cy="12" r="4" />}
  </svg>
)

export default function AcceptInvite() {
  const { token: pathToken } = useParams()
  const [sp] = useSearchParams()
  const token = pathToken || sp.get('token')
  const nav = useNavigate()
  const { acceptInvite } = useAuth()

  const { data: invite, error: lookupError, loading } = useApi(
    token ? EP.inviteLookup(token) : null,
  )

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const { checks, score } = scorePassword(password)
  const canSubmit = score >= 2 && checks.length && !busy

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      await acceptInvite(token, password, name.trim() || invite?.name)
      nav('/portal', { replace: true })
    } catch (err) { setError(err) } finally { setBusy(false) }
  }

  if (loading) return <div className="auth"><Loading full label="Checking your invite" /></div>

  if (lookupError || !token) {
    return (
      <div className="auth">
        <div className="auth-box">
          <div className="auth-brand">
            <div className="brand-mark"><span>&lt;/&gt;</span></div>
            <span className="brand-name">easy<i>code</i></span>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="h2" style={{ marginBottom: 8 }}>This invite has expired</div>
            <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 20 }}>
              Invite links last 7 days. Call us and we&apos;ll send a fresh one — it takes a second.
            </p>
            <a href="tel:2125550100" className="btn btn-p blk" style={{ textDecoration: 'none' }}>
              Call (212) 555-0100
            </a>
          </div>
        </div>
      </div>
    )
  }

  const firstName = (invite.invitedName || invite.contactName || '').split(' ')[0]

  return (
    <div className="auth">
      <div className="auth-box wide">
        <div className="auth-brand">
          <div className="brand-mark"><span>&lt;/&gt;</span></div>
          <span className="brand-name">easy<i>code</i></span>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div className="pill" style={{ marginBottom: 16 }}>
              <span className="dot" />Invited by {invite.invitedBy || 'Charles'}
            </div>
            <div className="h2" style={{ marginBottom: 6 }}>
              Welcome{firstName ? `, ${firstName}` : ''}.
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              Your portal for <b style={{ color: 'var(--text)' }}>{invite.orgName}</b> is ready.<br />
              Pick a password and you&apos;re in.
            </div>
          </div>

          <div style={{
            border: '1px solid var(--ink-200)', borderRadius: 'var(--r)',
            background: 'var(--ink-050)', padding: '15px 17px', marginBottom: 22,
          }}>
            <div className="eyebrow" style={{ marginBottom: 11 }}>What&apos;s waiting inside</div>
            <div className="stack tight">
              {[
                'Your project tracker, stage by stage',
                'Any invoices we&apos;ve sent you',
                'Somewhere to send photos, logos, and change requests',
              ].map((t) => (
                <div key={t} className="row" style={{ gap: 10 }}>
                  <Tick on />
                  <span style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: t }} />
                </div>
              ))}
            </div>
          </div>

          <div className="stack tight">
            <div>
              <label className="lbl">Email</label>
              {/* Locked on purpose. Letting someone change this during acceptance
                  is how an invite gets attached to the wrong account. */}
              <input className="inp mono" value={invite.email} disabled
                style={{ color: 'var(--mute)', background: 'var(--ink-050)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label className="lbl" htmlFor="name">Your name</label>
              <input id="name" className="inp" autoComplete="name"
                placeholder={invite.contactName || 'First and last'}
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="lbl" htmlFor="pw">Create a password</label>
              <input id="pw" className="inp" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="pwbar">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} className={i < score ? `f${Math.min(score, 3)}` : ''} />
                ))}
              </div>
              <div className="row" style={{ gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                <span className={`req${checks.length ? ' ok' : ''}`}>
                  <Tick on={checks.length} />At least 10 characters
                </span>
                <span className={`req${checks.complex ? ' ok' : ''}`}>
                  <Tick on={checks.complex} />A number or symbol
                </span>
              </div>
            </div>
          </div>

          {error && <div style={{ marginTop: 14 }}><ErrorNote error={error} /></div>}

          <button className="btn btn-p blk" type="submit" disabled={!canSubmit}
            style={{ padding: 11, marginTop: 20, opacity: canSubmit ? 1 : 0.5 }}>
            {busy ? 'Setting it up…' : 'Set password and open my portal'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--mute)', marginTop: 13, lineHeight: 1.6 }}>
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </form>

        <div className="auth-foot">
          This link expires {invite.expiresAt ? `on ${longDate(invite.expiresAt)}` : 'in 7 days'}.
        </div>
      </div>
    </div>
  )
}
