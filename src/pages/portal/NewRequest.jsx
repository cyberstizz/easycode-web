import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { post } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { EP, REQUEST_TYPE } from '../../lib/endpoints'
import { TopBar } from '../../components/Shell'
import ErrorNote from '../../components/ErrorNote'

const TYPES = [
  { key: 'UPDATE', label: 'Change something', blurb: 'New hours, a photo swap, different text', icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /> },
  { key: 'QUESTION', label: 'Ask a question', blurb: "Anything you're unsure about", icon: <><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" /></> },
  { key: 'BUG', label: 'Report a problem', blurb: "Something on the site isn't working", icon: <><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></> },
  { key: 'NEW_PROJECT', label: 'Start something new', blurb: 'A new page, feature, or whole site', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></> },
]

export default function NewRequest() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { data: projects } = useApi(EP.projects())
  const [type, setType] = useState(sp.get('type') || 'UPDATE')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const items = projects?.items || []
  const canSave = title.trim().length > 2 && body.trim().length > 2 && !saving

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const created = await post(EP.requests(), {
        type,
        title: title.trim(),
        body: body.trim(),
        projectId: projectId || items[0]?.id || null,
      })
      nav(`/portal/requests/${created.id}`)
    } catch (err) { setError(err) } finally { setSaving(false) }
  }

  const isBillable = type === 'UPDATE' || type === 'NEW_PROJECT'

  return (
    <>
      <TopBar crumbs={[{ label: 'Requests', to: '/portal/requests' }, { label: 'New request' }]}>
        <Link to="/portal/requests" className="btn btn-g sm" style={{ textDecoration: 'none' }}>Cancel</Link>
      </TopBar>

      <div className="wrap" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 className="h1">What do you need?</h1>
          <p className="sub">Send it here and it lands on your project, where it stays for good.</p>
        </div>

        <form onSubmit={submit}>
          <div className="card pad" style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 13 }}>Pick one</div>
            <div className="grid g2" style={{ gap: 10 }}>
              {TYPES.map((t) => {
                const on = type === t.key
                return (
                  <button key={t.key} type="button" onClick={() => setType(t.key)}
                    className={`lrow${on ? ' sel' : ''}`}
                    style={{ gap: 12, padding: 14, ...(on ? { borderColor: 'var(--em-line)' } : {}) }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                      stroke={on ? 'var(--em)' : 'var(--mute)'} strokeWidth="2" style={{ flexShrink: 0 }}>
                      {t.icon}
                    </svg>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="lrow-t" style={{ fontSize: 13 }}>{t.label}</div>
                      <div className="lrow-s">{t.blurb}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card pad" style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <label className="lbl" htmlFor="t">Sum it up in a line</label>
              <input id="t" className="inp" required autoFocus maxLength={120}
                placeholder="Add Sunday brunch hours to the footer"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="lbl" htmlFor="b">Tell us more</label>
              <textarea id="b" className="inp" rows={5} required style={{ resize: 'vertical' }}
                placeholder="What you want, where on the site, and anything we should know."
                value={body} onChange={(e) => setBody(e.target.value)} />
              <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>
                More detail means fewer back-and-forth messages before we start.
              </div>
            </div>

            {items.length > 1 && (
              <div>
                <label className="lbl" htmlFor="p">Which project?</label>
                <select id="p" className="inp" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {isBillable && (
            <div className="note mute" style={{ marginBottom: 16, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>
                Small changes are covered by your plan. If this one falls outside it, we'll send you a price
                first and <b style={{ color: 'var(--text)' }}>we won't start until you approve it</b>.
              </span>
            </div>
          )}

          {error && <div style={{ marginBottom: 16 }}><ErrorNote error={error} /></div>}

          <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--mute)' }}>
              You'll get an email when we reply. Usually same day, Monday to Saturday.
            </span>
            <button className="btn btn-p" type="submit" disabled={!canSave}
              style={{ padding: '11px 20px', opacity: canSave ? 1 : 0.5 }}>
              {saving ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}