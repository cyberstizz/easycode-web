import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post, patch } from '../../lib/api'
import { EP, CALL_OUTCOME, OBJECTION_TAGS, RUNGS, LEAD_STATUS } from '../../lib/endpoints'
import { useAuth } from '../../auth/AuthProvider'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import Avatar from '../../components/Avatar'

const OUTCOME_ICON = {
  CONNECTED: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.4-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z" />,
  VOICEMAIL: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" /></>,
  NO_ANSWER: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5" /><path d="M12 16h.01" /></>,
  BAD_NUMBER: <><path d="M1 1l22 22" /><path d="M16.7 16.7A10.9 10.9 0 015 5" /></>,
  NOT_INTERESTED: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>,
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const WHEN = [
  { key: 'tomorrow', label: 'Tomorrow', days: 1 },
  { key: 'three', label: '3 days', days: 3 },
  { key: 'week', label: 'Next week', days: 7 },
]

const addDays = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0)
  return d
}

export default function LogCall() {
  const { id } = useParams()
  const nav = useNavigate()
  const { isOwner } = useAuth()
  const { data: lead, error, loading } = useApi(EP.adminLead(id))

  const [outcome, setOutcome] = useState('CONNECTED')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState([])
  const [rungOffered, setRungOffered] = useState('NONE')
  const [status, setStatus] = useState('')
  const [when, setWhen] = useState('tomorrow')
  const [customDate, setCustomDate] = useState('')
  const [note, setNote] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const started = useRef(Date.now())

  // Live timer. Nobody remembers call length afterward, so measure it.
  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { if (lead?.status) setStatus(lead.status) }, [lead?.status])

  const toggleTag = (t) => setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t])

  const connected = outcome === 'CONNECTED'
  const nextDate = when === 'custom'
    ? (customDate ? new Date(customDate) : null)
    : addDays(WHEN.find((w) => w.key === when)?.days ?? 1)

  // The one rule that makes the whole system work: no call is saved without
  // a next action. That's what puts the lead back on Today automatically.
  const canSave = !!nextDate && !saving

  const save = async (andNext = false) => {
    setSaving(true); setSaveError(null)
    try {
      await post(EP.adminLeadActivities(id), {
        type: 'CALL',
        outcome,
        durationSeconds: connected ? seconds : null,
        body: body.trim(),
        objectionTags: tags,
        rungOffered,
        occurredAt: new Date().toISOString(),
      })
      await patch(EP.adminLead(id), {
        status,
        rungOffered: rungOffered === 'NONE' ? lead.rungOffered : rungOffered,
        nextActionAt: nextDate.toISOString(),
        nextActionNote: note.trim(),
      })
      nav(andNext ? '/admin' : `/admin/leads/${id}`)
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  if (loading) return <><TopBar crumbs={[{ label: 'Log a call' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Log a call' }]} /><div className="wrap"><ErrorNote error={error} /></div></>

  const rungs = RUNGS.filter((r) => !r.ownerOnly || isOwner)

  return (
    <>
      <TopBar crumbs={[{ label: 'Today', to: '/admin' }, { label: 'Log a call' }]}>
        <Link to={`/admin/leads/${id}`} className="btn btn-g sm" style={{ textDecoration: 'none' }}>Cancel</Link>
      </TopBar>

      <div className="wrap" style={{ maxWidth: 800 }}>
        <div className="spread" style={{ marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div className="row" style={{ gap: 14 }}>
            <Avatar name={lead.contactName} size="lg" />
            <div>
              <h1 className="h1" style={{ fontSize: 22 }}>{lead.contactName}</h1>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3 }}>
                {lead.businessName} · <a href={`tel:${(lead.phone || '').replace(/\D/g, '')}`} className="mono" style={{ color: 'var(--em-hi)', textDecoration: 'none' }}>{lead.phone}</a>
              </div>
            </div>
          </div>
          <div className="card pad" style={{ padding: '11px 16px', background: 'var(--ink-050)' }}>
            <div className="eyebrow" style={{ marginBottom: 3 }}>Call timer</div>
            <div className="num mono" style={{ fontSize: 22, color: 'var(--cyan)' }}>{mmss(seconds)}</div>
          </div>
        </div>

        {lead.leadWith && (
          <div className="note amber" style={{ marginBottom: 20, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <span><b>Before you dial:</b> {lead.leadWith}</span>
          </div>
        )}

        {/* 01 — outcome */}
        <div className="card pad" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--em)' }}>01</span>
            <span className="eyebrow">How did it go?</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
            {CALL_OUTCOME.map((o) => {
              const on = outcome === o.key
              return (
                <button key={o.key} type="button" onClick={() => setOutcome(o.key)}
                  className={`lrow${on ? ' sel' : ''}`}
                  style={{ flexDirection: 'column', gap: 7, padding: '15px 10px', textAlign: 'center',
                    ...(on ? { borderColor: 'var(--em-line)' } : {}) }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                    stroke={on ? 'var(--em)' : 'var(--mute)'} strokeWidth="2">{OUTCOME_ICON[o.key]}</svg>
                  <span style={{ fontSize: 12, fontWeight: 650, color: on ? 'var(--white)' : 'var(--mute)' }}>{o.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 02 — what happened (only worth asking if they picked up) */}
        {connected && (
          <div className="card pad" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--em)' }}>02</span>
              <span className="eyebrow">What happened?</span>
              <span className="push" style={{ fontSize: 11.5, color: 'var(--mute)' }}>One or two lines is plenty</span>
            </div>
            <textarea className="inp" rows={3} style={{ resize: 'vertical' }}
              placeholder="What they said, what you offered, what they're deciding…"
              value={body} onChange={(e) => setBody(e.target.value)} />

            <div className="hr" />

            <label className="lbl">
              What did they push back on? <span style={{ color: 'var(--mute)', fontWeight: 400 }}>— tap any that apply</span>
            </label>
            <div className="row" style={{ gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
              {OBJECTION_TAGS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`chip ${tags.includes(t) ? 'c-you' : 'c-done'}`} style={{ cursor: 'pointer' }}>
                  {tags.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 10, lineHeight: 1.55 }}>
              After fifty calls these tags tell you which objection actually kills deals — and whether you're
              dropping a rung too early.
            </div>

            <div className="hr" />

            <label className="lbl">Did you offer anything?</label>
            <div className="row" style={{ gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
              {rungs.map((r) => (
                <button key={r.key} type="button" onClick={() => setRungOffered(r.key)}
                  className={`chip ${rungOffered === r.key ? (r.key === 'SPECIAL' ? 'c-vio' : 'c-you') : 'c-done'}`}
                  style={{ cursor: 'pointer' }} title={r.note || ''}>
                  {rungOffered === r.key ? '✓ ' : ''}{r.label}
                  {r.down != null && r.key !== 'NONE' && ` · $${(r.down / 100).toFixed(0)}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 03 — next action, required */}
        <div className="card pad glow" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--em)' }}>{connected ? '03' : '02'}</span>
            <span className="eyebrow" style={{ color: 'var(--em-hi)' }}>What's next? — required</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 15, lineHeight: 1.55 }}>
            You can't save without one. This is the whole trick: a lead never leaves a call without a next step,
            so nothing goes cold by accident.
          </div>

          <div className="grid g2" style={{ gap: 14, marginBottom: 14 }}>
            <div>
              <label className="lbl">Move them to</label>
              <div className="seg" style={{ width: '100%' }}>
                {LEAD_STATUS.map((s) => (
                  <button key={s.key} type="button" onClick={() => setStatus(s.key)}
                    className={status === s.key ? 'on' : ''} style={{ flex: 1 }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="lbl">Call them back</label>
              <div className="seg" style={{ width: '100%' }}>
                {WHEN.map((w) => (
                  <button key={w.key} type="button" onClick={() => setWhen(w.key)}
                    className={when === w.key ? 'on' : ''} style={{ flex: 1 }}>{w.label}</button>
                ))}
                <button type="button" onClick={() => setWhen('custom')}
                  className={when === 'custom' ? 'on' : ''} style={{ flex: 1 }}>Pick</button>
              </div>
              {when === 'custom' && (
                <input type="date" className="inp mono" style={{ marginTop: 9 }}
                  value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
              )}
            </div>
          </div>

          <label className="lbl">So you remember why</label>
          <input className="inp" placeholder="Brother said yes or no — close it or park it"
            value={note} onChange={(e) => setNote(e.target.value)} />

          {saveError && <div style={{ marginTop: 14 }}><ErrorNote error={saveError} /></div>}

          <div className="hr" />
          <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--mute)' }}>
              {nextDate
                ? <>Next call lands on <b className="mono" style={{ color: 'var(--em-hi)' }}>
                    {nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b></>
                : <span style={{ color: 'var(--amber)' }}>Pick a date to save</span>}
            </span>
            <div className="row" style={{ gap: 9 }}>
              <button className="btn btn-s" disabled={!canSave} onClick={() => save(true)}
                style={{ opacity: canSave ? 1 : 0.5 }}>Save and next lead</button>
              <button className="btn btn-p" disabled={!canSave} onClick={() => save(false)}
                style={{ opacity: canSave ? 1 : 0.5 }}>{saving ? 'Saving…' : 'Save call'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}