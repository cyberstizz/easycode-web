import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import { EP, rung, STAGE_META } from '../../lib/endpoints'
import { money, longDate, daysUntil, dateTime } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import { MiniRail } from '../../components/StageRail'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

const INVOICE_TONE = { PAID: 'c-new', SENT: 'c-you', PAST_DUE: 'c-late', DRAFT: 'c-done', VOID: 'c-done', COMPLIMENTARY: 'c-vio' }

export default function ClientDetail() {
  const { id } = useParams()
  // Invite link, held per contact. Only ever populated while email sending is
  // off — once Resend is live the API stops returning it and the only copy is
  // in the client's inbox.
  const [invites, setInvites] = useState({})
  const [inviteBusy, setInviteBusy] = useState(null)
  const [inviteError, setInviteError] = useState(null)

  const sendInvite = async (contactId) => {
    setInviteBusy(contactId); setInviteError(null)
    try {
      const res = await post(EP.adminContactInvite(contactId))
      setInvites((m) => ({ ...m, [contactId]: res }))
    } catch (e) { setInviteError(e) } finally { setInviteBusy(null) }
  }
  const { data: org, error, loading, reload } = useApi(EP.adminOrg(id))
  const reqs = useApi(`${EP.adminRequests()}?scope=admin`)

  if (loading) return <><TopBar crumbs={[{ label: 'Clients', to: '/admin/clients' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Clients', to: '/admin/clients' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const tier = rung(org.dealTier)
  const comp = org.dealTier === 'SPECIAL'
  const projects = org.projects || []
  const contacts = org.contacts || []
  const invoices = org.invoices || []
  const openReqs = (reqs.data?.items || []).filter(
    (r) => r.orgId === org.id && !['DONE', 'DECLINED'].includes(r.status),
  )

  return (
    <>
      <TopBar crumbs={[{ label: 'Clients', to: '/admin/clients' }, { label: org.name }]}>
        <button className="btn btn-s sm">Log a call</button>
        <button className="btn btn-p sm">New invoice</button>
      </TopBar>

      <div className="wrap wide">
        <div className="card pad" style={{ marginBottom: 18 }}>
          <div className="spread" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div className="row" style={{ gap: 14 }}>
              <Avatar name={org.name} size="lg" />
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <h1 className="h1" style={{ fontSize: 21 }}>{org.name}</h1>
                  <Chip tone={org.status === 'ACTIVE' ? 'c-new' : 'c-done'} live={org.status === 'ACTIVE'}>
                    {org.status === 'ACTIVE' ? 'Active' : org.status}
                  </Chip>
                  {comp && <Chip tone="c-vio">Complimentary</Chip>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                  {[org.industry, org.address].filter(Boolean).join(' · ')}
                  {org.clientSince && ` · client since ${longDate(org.clientSince)}`}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 26, flexWrap: 'wrap' }}>
              <dl className="kv">
                <dt>Plan</dt>
                <dd>
                  {tier.label} · {comp ? 'no charge' : <>{money(org.monthlyCents)}<span style={{ color: 'var(--mute)', fontSize: 12 }}>/mo</span></>}
                  {org.contractMonths ? ` · ${org.contractMonths / 12}-yr` : ''}
                </dd>
              </dl>
              <dl className="kv"><dt>Lifetime</dt><dd className="num" style={{ fontSize: 14 }}>{money(org.lifetimeCents, { withCents: false })}</dd></dl>
              <dl className="kv">
                <dt>Outstanding</dt>
                <dd className="num" style={{ fontSize: 14, color: org.outstandingCents > 0 ? 'var(--amber)' : 'var(--mute)' }}>
                  {money(org.outstandingCents, { withCents: false })}
                </dd>
              </dl>
              {org.includedHours > 0 && (
                <dl className="kv">
                  <dt>Hours this month</dt>
                  <dd className="mono" style={{ fontSize: 13.5, color: org.hoursUsed > org.includedHours ? 'var(--amber)' : 'var(--text)' }}>
                    {org.hoursUsed} <span style={{ color: 'var(--mute)' }}>/ {org.includedHours} incl.</span>
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>

        <div className="split aside-md">
          <div>
            <div className="sect-head" style={{ marginTop: 0 }}><span className="eyebrow">Projects</span><span className="rule" /></div>
            {projects.length === 0 ? (
              <EmptyState title="No projects yet" body="Create one to give them a tracker to watch." />
            ) : (
              <div className="stack tight">
                {projects.map((p) => {
                  const live = (p.stages || []).find((s) => s.stageKey === p.currentStage)
                  const started = p.status !== 'NOT_STARTED'
                  return (
                    <Link key={p.id} to={`/admin/projects/${p.id}`} className="card pad"
                      style={{ textDecoration: 'none', display: 'block', ...(started ? {} : { opacity: 0.72 }) }}>
                      <div className="spread" style={{ marginBottom: started ? 12 : 0 }}>
                        <div>
                          <div className="h3">{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                            {p.projectType}
                            {p.estLaunchOn && ` · est. launch ${longDate(p.estLaunchOn)}`}
                          </div>
                        </div>
                        {started
                          ? <Chip tone="c-prog" live>{STAGE_META[p.currentStage]?.label} {live?.progressPct ?? 0}%</Chip>
                          : <Chip tone="c-done">Not started</Chip>}
                      </div>
                      {started && <MiniRail stages={p.stages} currentStage={p.currentStage} />}
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="sect-head">
              <span className="eyebrow">Open requests</span><span className="rule" />
              <Link to="/admin/requests" className="btn btn-g sm" style={{ textDecoration: 'none' }}>Open inbox →</Link>
            </div>
            {openReqs.length === 0 ? (
              <div className="note mute">Nothing open right now.</div>
            ) : (
              <div className="stack tight">
                {openReqs.map((r) => (
                  <Link key={r.id} to={`/admin/requests/${r.id}`} className="lrow" style={{ textDecoration: 'none' }}>
                    <span className="lrow-id">{r.refNumber}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lrow-t">{r.title}</div>
                      <div className="lrow-s">
                        {r.billing === 'UNSET' ? 'Billing not set' : r.billing === 'INCLUDED' ? 'Included in plan' : 'Billable'}
                      </div>
                    </div>
                    <Chip tone={r.status === 'NEW' ? 'c-new' : r.status === 'NEEDS_CLIENT' ? 'c-you' : 'c-prog'}>
                      {r.status === 'NEEDS_CLIENT' ? 'Waiting on them' : r.status === 'NEW' ? 'New' : 'In progress'}
                    </Chip>
                  </Link>
                ))}
              </div>
            )}

            <div className="sect-head"><span className="eyebrow">Invoices</span><span className="rule" /></div>
            <div className="card" style={{ padding: '14px 4px 4px' }}>
              <table className="tbl">
                <thead><tr><th>Number</th><th>For</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="mono">{i.number}</td>
                      <td>{i.description}</td>
                      <td className="num" style={{ fontSize: 13 }}>{money(i.totalCents)}</td>
                      <td>
                        <Chip tone={INVOICE_TONE[i.status] || 'c-done'}>
                          {i.status === 'SENT' && i.dueOn
                            ? (daysUntil(i.dueOn) < 0 ? `${Math.abs(daysUntil(i.dueOn))}d late` : `Due in ${daysUntil(i.dueOn)}d`)
                            : i.status}
                        </Chip>
                      </td>
                      <td className="mono" style={{ color: 'var(--mute)' }}>{longDate(i.paidAt || i.dueOn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pane">
            <div className="card pad">
              <div className="eyebrow" style={{ marginBottom: 12 }}>People</div>
              <div className="stack tight">
                {contacts.map((c) => (
                  <div key={c.id} className="row" style={{ gap: 10, ...(c.hasPortal ? {} : { opacity: 0.65 }) }}>
                    <Avatar name={c.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
                        {c.name}{' '}
                        {c.isPrimary && <Chip tone="c-new">Primary</Chip>}
                        {c.isBilling && <Chip tone="c-done">Billing</Chip>}
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
                        {c.email}{c.phone ? ` · ${c.phone}` : ''}
                      </div>
                      {!c.hasPortal && (
                        <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 2 }}>
                          {c.invitedAt ? `Invited ${longDate(c.invitedAt)} — hasn't signed in` : 'No portal access'}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-g sm" disabled={inviteBusy === c.id}
                      onClick={() => sendInvite(c.id)}>
                      {inviteBusy === c.id ? 'Sending…' : c.hasPortal ? 'Re-invite' : c.invitedAt ? 'Resend' : 'Invite'}
                    </button>
                  </div>
                ))}
              </div>

              {inviteError && <div style={{ marginTop: 12 }}><ErrorNote error={inviteError} /></div>}

              {Object.entries(invites).map(([cid, inv]) => (
                <div key={cid} className="note" style={{
                  marginTop: 12, background: 'var(--em-dim)',
                  border: '1px solid var(--em-line)', color: 'var(--text)',
                }}>
                  <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--white)' }}>
                      Invite created for {inv.email}
                    </span>
                  </div>

                  {inv.acceptUrl ? (
                    <>
                      <div style={{ fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.55, marginBottom: 9 }}>
                        Email sending is off, so send this link yourself. It works once and
                        expires {longDate(inv.expiresAt)}.
                      </div>
                      <input className="inp mono" readOnly value={inv.acceptUrl}
                        onFocus={(e) => e.target.select()}
                        style={{ fontSize: 11.5, padding: '8px 10px' }} />
                      <button className="btn btn-p sm" style={{ marginTop: 9 }}
                        onClick={() => navigator.clipboard?.writeText(inv.acceptUrl)}>
                        Copy link
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.55 }}>
                      Sent by email. Expires {longDate(inv.expiresAt)}.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {org.notes && (
              <div className="card pad" style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 11 }}>Account notes</div>
                <div className="note mute" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{org.notes}</div>
              </div>
            )}

            {org.recentCalls?.length > 0 && (
              <div className="card pad" style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 11 }}>Recent calls</div>
                <div className="stack tight">
                  {org.recentCalls.map((c) => (
                    <div key={c.id}>
                      <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                        {longDate(c.at)} · <b style={{ color: c.outcome === 'CONNECTED' ? 'var(--white)' : 'var(--mute-hi)' }}>
                          {c.outcome === 'CONNECTED' ? 'Connected' : 'Voicemail'}
                        </b>
                        {c.durationSeconds ? ` · ${Math.round(c.durationSeconds / 60)}m` : ''}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 1 }}>{c.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}