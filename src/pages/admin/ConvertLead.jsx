import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import { EP, RUNGS, rung, twoYearValueCents, adaptLead, adaptConvert } from '../../lib/endpoints'
import { useAuth } from '../../auth/AuthProvider'
import { money, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

const iso = (d) => d.toISOString().slice(0, 10)
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }

function Toggle({ on, onClick }) {
  return <button type="button" className={`toggle${on ? ' on' : ''}`} onClick={onClick}><i /></button>
}

function NoLead() {
  return (
    <div className="wrap" style={{ maxWidth: 520 }}>
      <div className="estate" style={{ borderStyle: 'solid', borderColor: 'var(--ink-200)', marginTop: 40 }}>
        <div className="h3" style={{ marginBottom: 6 }}>That lead link is broken</div>
        <p style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 15px' }}>
          The URL has no lead id in it. The record may still have saved — check the pipeline.
        </p>
        <a href="/admin/pipeline" className="btn btn-s sm" style={{ textDecoration: 'none' }}>Open pipeline</a>
      </div>
    </div>
  )
}

export default function ConvertLead() {
  const { id } = useParams()
  const nav = useNavigate()
  const { isOwner } = useAuth()
  const validId = id && id !== 'undefined' && id !== 'null'
  const { data: lead, error, loading } = useApi(validId ? EP.adminLead(id) : null, { select: adaptLead })

  const [tier, setTier] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('Business website')
  const [kickoffOn, setKickoffOn] = useState(plusDays(4))
  const [estLaunchOn, setEstLaunchOn] = useState(plusDays(60))
  const [sendInvite, setSendInvite] = useState(true)
  const [sendInvoice, setSendInvoice] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [done, setDone] = useState(null)

  if (!validId) return <NoLead />
  if (loading) return <><TopBar crumbs={[{ label: 'Convert' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Convert' }]} /><div className="wrap"><ErrorNote error={error} /></div></>

  // Default to whatever rung was last on the table, and default the project
  // name off the business — both are almost always right.
  const chosen = tier || lead.offeredTier || 'PREFERRED'
  const r = rung(chosen)
  const name = projectName || `${lead.businessName || lead.contactName} — main site`
  const tiers = RUNGS.filter((t) => t.key !== 'NONE' && (!t.ownerOnly || isOwner))

  const submit = async () => {
    setSaving(true); setSaveError(null)
    try {
      const res = adaptConvert(await post(EP.adminLeadConvert(id), {
        orgName: lead.businessName,
        contactName: lead.contactName,
        contactEmail: lead.email,
        contactPhone: lead.phone,
        projectName: name,
        projectType,
        dealTier: chosen,
        // contractCents is the full build price; depositCents is what's due today.
        contractCents: 120000,
        depositCents: r.down,
        // Dates go to the project, and the launch date is the first thing the
        // client sees on their tracker.
        startedAt: new Date(kickoffOn).toISOString(),
        estLaunchAt: new Date(estLaunchOn).toISOString(),
        sendInvite,
      }))
      // Deliberately NOT navigating. The accept link is returned once and never
      // again — leaving the page would lose it.
      setDone(res)
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  if (done) {
    return (
      <>
        <TopBar crumbs={[{ label: 'Pipeline', to: '/admin/pipeline' }, { label: 'Converted' }]} />
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="card pad glow" style={{ marginBottom: 16 }}>
            <div className="row" style={{ gap: 11, marginBottom: 12 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div className="h2">{done.org?.name} is set up</div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              Client created, project opened at Discovery, and the lead marked won.
            </p>
          </div>

          {done.acceptUrl ? (
            <div className="card pad warn" style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 10 }}>
                Send this link — it is shown once
              </div>
              <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 12 }}>
                Email sending is off, so deliver it yourself. It works once, and it expires
                {' '}{longDate(done.inviteExpiresAt)}. If you lose it, open the client and hit
                Invite again for a fresh one.
              </p>
              <input className="inp mono" readOnly value={done.acceptUrl}
                onFocus={(e) => e.target.select()} style={{ fontSize: 11.5 }} />
              <div className="row" style={{ gap: 9, marginTop: 11 }}>
                <button className="btn btn-p sm"
                  onClick={() => navigator.clipboard?.writeText(done.acceptUrl)}>
                  Copy link
                </button>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                  for {done.inviteEmail}
                </span>
              </div>
            </div>
          ) : done.emailSent ? (
            <div className="note mute" style={{ marginBottom: 16 }}>
              Invite emailed to {done.inviteEmail}.
            </div>
          ) : (
            <div className="note amber" style={{ marginBottom: 16 }}>
              No invite was sent — you left that toggle off. Open the client and hit
              Invite whenever you want to give them access.
            </div>
          )}

          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link to={`/admin/clients/${done.org?.id}`} className="btn btn-p" style={{ textDecoration: 'none' }}>
              Open the client
            </Link>
            <Link to="/admin/pipeline" className="btn btn-g" style={{ textDecoration: 'none' }}>
              Back to pipeline
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar crumbs={[
        { label: 'Pipeline', to: '/admin/pipeline' },
        { label: lead.contactName, to: `/admin/leads/${id}` },
        { label: 'Convert' },
      ]} />

      <div className="wrap" style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ color: 'var(--em-hi)' }}>Closing the deal</div>
          <h1 className="h1" style={{ marginTop: 7 }}>Set up {lead.businessName}</h1>
          <p className="sub">
            One pass: creates the client, opens the project, sends the deposit invoice, and emails
            {' '}{(lead.contactName || 'them').split(' ')[0]} their portal invite.
          </p>
        </div>

        <div className="card pad" style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Which deal did they take?</div>
          <div className="grid g4" style={{ gap: 10, marginBottom: 16 }}>
            {tiers.map((t) => {
              const on = chosen === t.key
              return (
                <button key={t.key} type="button" onClick={() => setTier(t.key)}
                  className={`lrow${on ? ' sel' : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: 13,
                    ...(on ? { borderColor: t.key === 'SPECIAL' ? 'var(--violet)' : 'var(--em-line)' } : {}) }}>
                  <span className="mono" style={{ fontSize: 9.5, color: on ? (t.key === 'SPECIAL' ? 'var(--violet)' : 'var(--em-hi)') : 'var(--ink-400)' }}>
                    {t.label.toUpperCase()}{on ? ' ✓' : ''}
                  </span>
                  <span className="num" style={{ fontSize: 18, ...(on ? { color: t.key === 'SPECIAL' ? 'var(--violet)' : 'var(--em-hi)' } : {}) }}>
                    {t.key === 'SPECIAL' ? 'Custom' : money(t.down, { withCents: false })}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{t.note}</span>
                </button>
              )
            })}
          </div>

          <div className="grid g3" style={{ gap: 0, border: '1px solid var(--ink-200)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderRight: '1px solid var(--ink-200)' }}>
              <div className="eyebrow">Due today</div>
              <div className="num" style={{ fontSize: 20, marginTop: 5 }}>{money(r.down)}</div>
            </div>
            <div style={{ padding: '14px 16px', borderRight: '1px solid var(--ink-200)' }}>
              <div className="eyebrow">Then monthly</div>
              <div className="num" style={{ fontSize: 20, marginTop: 5 }}>{money(r.monthly)}</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div className="eyebrow">2-year value</div>
              <div className="num" style={{ fontSize: 20, marginTop: 5, color: 'var(--em-hi)' }}>
                {money(twoYearValueCents(chosen), { withCents: false })}
              </div>
            </div>
          </div>

          {chosen === 'SPECIAL' && (
            <div className="note" style={{ marginTop: 14, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', color: '#C4B5FD' }}>
              Comped client. No Stripe subscription is created, and their Billing page shows a complimentary
              state instead of a balance.
            </div>
          )}
        </div>

        <div className="card pad" style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Project</div>
          <div className="grid g2" style={{ marginBottom: 14 }}>
            <div>
              <label className="lbl">Project name</label>
              <input className="inp" value={name} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Type</label>
              <select className="inp" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                <option>Business website</option>
                <option>Restaurant website</option>
                <option>Real estate website</option>
                <option>E-commerce</option>
                <option>Web application</option>
              </select>
            </div>
          </div>
          <div className="grid g2">
            <div><label className="lbl">Kickoff</label><input type="date" className="inp mono" value={kickoffOn} onChange={(e) => setKickoffOn(e.target.value)} /></div>
            <div><label className="lbl">Est. launch</label><input type="date" className="inp mono" value={estLaunchOn} onChange={(e) => setEstLaunchOn(e.target.value)} /></div>
          </div>
          <div className="note mute" style={{ marginTop: 14, fontSize: 12.5 }}>
            Opens at stage <span className="mono" style={{ color: 'var(--violet)' }}>01 Discovery</span>.
            They see the tracker the moment they sign in.
          </div>
        </div>

        <div className="card pad" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>What happens when you finish</div>
          <div className="stack tight">
            <div className="spread">
              <span style={{ fontSize: 13 }}>Email {(lead.contactName || 'them').split(' ')[0]} their portal invite</span>
              <Toggle on={sendInvite} onClick={() => setSendInvite((v) => !v)} />
            </div>
            <div className="spread">
              <span style={{ fontSize: 13 }}>Send the {money(r.down, { withCents: false })} deposit invoice</span>
              <Toggle on={sendInvoice} onClick={() => setSendInvoice((v) => !v)} />
            </div>
          </div>
          <div className="note mute" style={{ marginTop: 14, fontSize: 12.5 }}>
            Autopay gets set up when they pay their first invoice, once Stripe is connected.
            Push the bank option then — cards expire and the plan quietly dies in month nine,
            where a bank mandate doesn't.
          </div>
        </div>

        {saveError && <div style={{ marginBottom: 16 }}><ErrorNote error={saveError} /></div>}

        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-p" style={{ padding: '12px 22px', fontSize: 14, opacity: saving ? 0.6 : 1 }}
            disabled={saving} onClick={submit}>
            {saving ? 'Setting everything up…' : 'Create client and send everything'}
          </button>
          <Link to={`/admin/leads/${id}`} className="btn btn-g" style={{ textDecoration: 'none' }}>Back to the lead</Link>
        </div>
      </div>
    </>
  )
}