import { useState } from 'react'
import { Link } from 'react-router-dom'
import { post } from '../../lib/api'
import { EP } from '../../lib/endpoints'
import ErrorNote from '../../components/ErrorNote'

const KINDS = ['Restaurant or food', 'Real estate', 'Health or fitness', 'Trades and services', 'Retail', 'Something else']
const SITE_STATE = [
  { key: 'none', label: 'No' },
  { key: 'needs-work', label: 'Yes, needs work' },
  { key: 'needs-replacing', label: 'Yes, needs replacing' },
]

const NEXT = [
  'We call you, usually within a few hours.',
  'Ten minutes on what your business needs.',
  'A written quote with a real number and a real date.',
  'If you say yes, your portal opens that day.',
]

const emailLooksOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export default function Contact() {
  const [f, setF] = useState({
    name: '', business: '', phone: '', email: '',
    kind: '', siteState: 'none', message: '',
  })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF((c) => ({ ...c, [k]: e.target.value }))
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const emailBad = touched.email && f.email && !emailLooksOk(f.email)
  // Matches the backend's ContactFormInput: name, email, and message are @NotBlank.
  const canSend = f.name.trim() && emailLooksOk(f.email) && f.message.trim().length > 2 && !busy

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      // The site state and industry aren't fields on the API, so they ride along
      // in the message — which is where they'd end up in a phone call anyway.
      const extra = [
        f.kind && `Industry: ${f.kind}`,
        `Current site: ${SITE_STATE.find((s) => s.key === f.siteState)?.label}`,
      ].filter(Boolean).join(' · ')

      await post(EP.contact(), {
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        business: f.business.trim(),
        message: `${f.message.trim()}\n\n— ${extra}`,
      })
      setSent(true)
    } catch (err) { setError(err) } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <div className="msec">
        <div className="mwrap narrow" style={{ textAlign: 'center' }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%', background: 'var(--em-dim)',
            border: '1.5px solid var(--em-line)', display: 'grid', placeItems: 'center',
            margin: '0 auto 18px',
          }}>
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mhead" style={{ marginBottom: 13 }}>Got it, {f.name.split(' ')[0]}.</h1>
          <p className="lede" style={{ margin: '0 auto 10px' }}>
            We&apos;ll call you at <span className="mono" style={{ color: 'var(--text)' }}>{f.phone || f.email}</span>,
            usually within a few hours. If it&apos;s urgent, skip the wait.
          </p>
          <div className="row" style={{ gap: 11, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
            <a href="tel:2125550100" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>
              Call (212) 555-0100
            </a>
            <Link to="/work" className="btn btn-s btn-xl" style={{ textDecoration: 'none' }}>See our work</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="msec">
      <div className="mwrap">
        <div className="split aside-md" style={{ gap: 34 }}>
          <div>
            <div className="eyebrow">Get a quote</div>
            <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,42px)', margin: '12px 0 14px' }}>
              Tell us what<br />you need.
            </h1>
            <p className="lede" style={{ marginBottom: 30 }}>
              Four questions. We&apos;ll come back with a real number, usually the same day — and if
              we&apos;re not the right fit for what you&apos;re after, we&apos;ll say so instead of
              wasting your time.
            </p>

            <form className="quote-card" onSubmit={submit}>
              <div className="grid g2" style={{ gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="lbl" htmlFor="n">Your name *</label>
                  <input id="n" className="inp" required placeholder="Marcus Terrell"
                    value={f.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="lbl" htmlFor="b">Business name</label>
                  <input id="b" className="inp" placeholder="Harlem Soul Kitchen"
                    value={f.business} onChange={set('business')} />
                </div>
              </div>

              <div className="grid g2" style={{ gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="lbl" htmlFor="p">Phone</label>
                  <input id="p" className="inp mono" type="tel" placeholder="(212) 555-0147"
                    value={f.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="lbl" htmlFor="e">Email *</label>
                  <input id="e" className="inp" type="email" required placeholder="you@yourbusiness.com"
                    style={emailBad ? { borderColor: 'rgba(240,85,95,.4)' } : undefined}
                    value={f.email} onChange={set('email')} onBlur={blur('email')} />
                  {emailBad && (
                    <div className="row" style={{ gap: 6, marginTop: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                      </svg>
                      <span style={{ fontSize: 11.5, color: 'var(--red)' }}>That address looks incomplete</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="lbl" htmlFor="k">What kind of business?</label>
                <select id="k" className="inp" value={f.kind} onChange={set('kind')}>
                  <option value="">Choose one…</option>
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="lbl">Do you have a website now?</label>
                <div className="seg" style={{ width: '100%' }}>
                  {SITE_STATE.map((s) => (
                    <button key={s.key} type="button" style={{ flex: 1 }}
                      className={f.siteState === s.key ? 'on' : ''}
                      onClick={() => setF((c) => ({ ...c, siteState: s.key }))}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="lbl" htmlFor="m">What do you want it to do? *</label>
                <textarea id="m" className="inp" rows={4} required style={{ resize: 'vertical' }}
                  placeholder="Take reservations, show the menu, let people order catering…"
                  value={f.message} onChange={set('message')} />
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>
                  A sentence or two is plenty. We&apos;ll ask the rest on the call.
                </div>
              </div>

              {error && <div style={{ marginBottom: 16 }}><ErrorNote error={error} /></div>}

              <button className="btn btn-p blk" type="submit" disabled={!canSend}
                style={{ padding: 12, fontSize: 14.5, opacity: canSend ? 1 : 0.5 }}>
                {busy ? 'Sending…' : 'Send it over'}
              </button>
              <div className="row" style={{ gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>We never sell or share your information.</span>
              </div>
            </form>
          </div>

          <div>
            <div className="card pad glow">
              <div className="eyebrow" style={{ color: 'var(--em-hi)', marginBottom: 11 }}>Rather just talk?</div>
              <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 15 }}>
                Most quotes take ten minutes on the phone. You&apos;ll get Charles, not a call center.
              </p>
              <a href="tel:2125550100" className="btn btn-p blk" style={{ textDecoration: 'none' }}>
                Call (212) 555-0100
              </a>
              <div className="hr" />
              <div className="stack tight">
                {[['Mon–Fri', '9 AM – 7 PM ET'], ['Saturday', '10 AM – 4 PM ET'], ['Sunday', 'Closed']].map(([d, h]) => (
                  <div key={d} className="spread">
                    <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{d}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: h === 'Closed' ? 'var(--ink-400)' : 'var(--text)' }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card pad" style={{ marginTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>What happens next</div>
              <div className="stack tight">
                {NEXT.map((t, i) => (
                  <div key={t} className="row tp" style={{ gap: 11 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--em)', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing clients using this form would create duplicate leads and
                lose the request off their project. Send them to the portal. */}
            <div className="card pad" style={{ marginTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Already a client?</div>
              <p style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55, marginBottom: 12 }}>
                Don&apos;t use this form — send it through your portal so it lands on your project.
              </p>
              <Link to="/login" className="btn btn-s sm blk" style={{ textDecoration: 'none' }}>
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}