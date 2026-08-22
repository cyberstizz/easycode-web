import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post, patch } from '../../lib/api'
import { EP, REQUEST_TYPE, REQUEST_STATUS, BILLING_DISPOSITION } from '../../lib/endpoints'
import { money, dateTime, ago } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

const FILTERS = [
  { key: 'open', label: 'Open', test: (r) => !['DONE', 'DECLINED'].includes(r.status) },
  { key: 'mine', label: 'Mine', test: (r) => r.assigneeName === 'Charles' },
  { key: 'all', label: 'All', test: () => true },
]

const BILLING_OPTS = [
  { key: 'INCLUDED', short: 'Incl.' },
  { key: 'BILLABLE', short: 'Bill' },
  { key: 'DECLINED', short: 'No' },
]

export default function RequestsInbox() {
  const { id } = useParams()
  const nav = useNavigate()
  const [filter, setFilter] = useState('open')
  const { data, error, loading, reload } = useApi(`${EP.adminRequests()}?scope=admin`)

  const items = data?.items || []
  const rows = items.filter(FILTERS.find((f) => f.key === filter).test)
  const selectedId = id || rows[0]?.id

  const detail = useApi(selectedId ? EP.request(selectedId) : null)
  const req = detail.data

  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => { setReply(''); setInternal(false) }, [selectedId])

  const triage = async (patchBody) => {
    setActionError(null)
    try {
      const updated = await patch(EP.request(selectedId), patchBody)
      detail.setData((r) => ({ ...r, ...updated }))
      reload()
    } catch (e) { setActionError(e) }
  }

  const send = async (andClose = false) => {
    if (!reply.trim()) return
    setBusy(true); setActionError(null)
    try {
      const msg = await post(EP.requestMessages(selectedId), { body: reply.trim(), internalOnly: internal })
      detail.setData((r) => ({ ...r, messages: [...(r.messages || []), msg] }))
      setReply('')
      if (andClose) await triage({ status: 'DONE' })
      else if (req?.status === 'NEW') await triage({ status: 'ACKNOWLEDGED' })
    } catch (e) { setActionError(e) } finally { setBusy(false) }
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Requests' }, ...(req ? [{ label: req.refNumber }] : [])]}>
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </TopBar>

      <div className="wrap wide">
        {loading && <Loading full />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && items.length === 0 && (
          <EmptyState title="Inbox clear" body="No open requests and nobody waiting on you. Rare. Enjoy it." />
        )}

        {!loading && rows.length > 0 && (
          <div className="split">
            {/* queue */}
            <div className="pane">
              <div className="spread" style={{ marginBottom: 11 }}>
                <span className="eyebrow">Queue · {rows.length} open</span>
              </div>
              <div className="stack tight" style={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto', paddingRight: 3 }}>
                {rows.map((r) => {
                  const type = REQUEST_TYPE[r.type] || REQUEST_TYPE.UPDATE
                  const on = r.id === selectedId
                  return (
                    <button key={r.id} onClick={() => nav(`/admin/requests/${r.id}`)}
                      className={`lrow${on ? ' sel' : ''}${r.unread && !on ? ' unread' : ''}`}
                      style={{ padding: '11px 12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                          <span className="lrow-id">{r.refNumber}</span>
                          <Chip tone={type.chip}>{type.label}</Chip>
                        </div>
                        <div className="lrow-t" style={{ fontSize: 13 }}>{r.title}</div>
                        <div className="lrow-s">
                          {r.orgName}
                          {r.assigneeName ? ` · ${r.assigneeName}` : ' · unassigned'}
                          {' · '}{ago(r.updatedAt)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* detail */}
            <div>
              {detail.loading && <Loading />}
              {req && (
                <>
                  <div className="card pad" style={{ marginBottom: 14 }}>
                    <div className="spread" style={{ marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--mute)' }}>{req.refNumber}</span>
                          <Chip tone={(REQUEST_TYPE[req.type] || REQUEST_TYPE.UPDATE).chip}>
                            {(REQUEST_TYPE[req.type] || REQUEST_TYPE.UPDATE).label}
                          </Chip>
                          <Chip tone={(REQUEST_STATUS[req.status] || REQUEST_STATUS.NEW).chip}
                            live={req.status === 'NEEDS_CLIENT'}>
                            {(REQUEST_STATUS[req.status] || REQUEST_STATUS.NEW).label}
                          </Chip>
                        </div>
                        <div className="h2">{req.title}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3 }}>
                          {req.orgName} · {req.createdByName} · opened {dateTime(req.createdAt)}
                        </div>
                      </div>
                      {req.orgId && (
                        <Link to={`/admin/clients/${req.orgId}`} className="btn btn-s sm" style={{ textDecoration: 'none' }}>
                          Open client →
                        </Link>
                      )}
                    </div>

                    {/* triage — the billing call is the scope-creep guard */}
                    <div style={{ border: '1px solid var(--ink-200)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--ink-200)', background: 'var(--ink-050)' }}>
                        <span className="eyebrow">Triage</span>
                      </div>
                      <div className="grid g3" style={{ gap: 0 }}>
                        <div style={{ padding: '13px 14px', borderRight: '1px solid var(--ink-200)' }}>
                          <div className="lbl">Billing</div>
                          <div className="seg" style={{ width: '100%' }}>
                            {BILLING_OPTS.map((b) => (
                              <button key={b.key} style={{ flex: 1 }}
                                className={req.billing === b.key ? 'on' : ''}
                                onClick={() => triage({ billing: b.key })}
                                title={BILLING_DISPOSITION[b.key]}>{b.short}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: '13px 14px', borderRight: '1px solid var(--ink-200)' }}>
                          <div className="lbl">Status</div>
                          <select className="inp" style={{ padding: '6px 10px', fontSize: 12.5 }}
                            value={req.status} onChange={(e) => triage({ status: e.target.value })}>
                            {Object.entries(REQUEST_STATUS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ padding: '13px 14px' }}>
                          <div className="lbl">Priority</div>
                          <select className="inp" style={{ padding: '6px 10px', fontSize: 12.5 }}
                            value={req.priority || 'NORMAL'} onChange={(e) => triage({ priority: e.target.value })}>
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                      </div>

                      {req.billing === 'BILLABLE' && (
                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--ink-200)', background: 'var(--ink-050)',
                          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="eyebrow" style={{ marginRight: 4 }}>
                            {req.changeOrder ? `Change order ${req.changeOrder.refNumber}` : 'No quote sent yet'}
                          </span>
                          {req.changeOrder
                            ? <Chip tone="c-you">{money(req.changeOrder.amountCents, { withCents: false })} · sent</Chip>
                            : <span style={{ fontSize: 12, color: 'var(--amber)' }}>
                                Marked billable — send a quote before you start.
                              </span>}
                          <button className="btn btn-s sm push">
                            {req.changeOrder ? 'Edit quote' : 'Send a quote'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* thread */}
                  <div className="card pad">
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Thread</div>

                    {(req.messages || []).map((m) => (
                      <div key={m.id} className={`msg${m.internalOnly ? ' internal' : ''}`}>
                        <Avatar name={m.authorName} size="sm" tone={m.internalOnly ? 'warm' : undefined} />
                        <div className="msg-b">
                          <div className="msg-h">
                            <span className="msg-n">{m.authorName}</span>
                            {m.internalOnly && <Chip tone="c-you">Internal — client can't see this</Chip>}
                            <span className="msg-t">{dateTime(m.createdAt)}</span>
                          </div>
                          <p className="msg-x">{m.body}</p>
                        </div>
                      </div>
                    ))}

                    <div className="hr" />

                    {/* One composer, two audiences. Internal notes live in the same
                        thread so you never wonder where you wrote something down. */}
                    <div className="seg" style={{ marginBottom: 10 }}>
                      <button className={!internal ? 'on' : ''} onClick={() => setInternal(false)}>Reply to client</button>
                      <button className={internal ? 'on' : ''} onClick={() => setInternal(true)}>Internal note</button>
                    </div>
                    <textarea className="inp" rows={3} style={{
                      resize: 'vertical',
                      ...(internal ? { borderColor: 'rgba(245,158,11,.35)', background: 'rgba(245,158,11,.03)' } : {}),
                    }}
                      placeholder={internal ? 'Note to yourself. The client never sees this.' : `Reply to ${req.createdByName}…`}
                      value={reply} onChange={(e) => setReply(e.target.value)} />

                    {actionError && <div style={{ marginTop: 12 }}><ErrorNote error={actionError} /></div>}

                    <div className="spread" style={{ marginTop: 11, flexWrap: 'wrap', gap: 9 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                        {internal ? 'Saved to the thread, hidden from the client.' : 'They get an email with your reply.'}
                      </span>
                      <div className="row" style={{ gap: 8 }}>
                        {!internal && (
                          <button className="btn btn-s sm" disabled={busy || !reply.trim()} onClick={() => send(true)}
                            style={{ opacity: busy || !reply.trim() ? 0.5 : 1 }}>Send and close</button>
                        )}
                        <button className="btn btn-p sm" disabled={busy || !reply.trim()} onClick={() => send(false)}
                          style={{ opacity: busy || !reply.trim() ? 0.5 : 1 }}>
                          {busy ? 'Sending…' : internal ? 'Save note' : 'Send reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}