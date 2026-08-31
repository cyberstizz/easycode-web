import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import { EP, REQUEST_TYPE, REQUEST_STATUS } from '../../lib/endpoints'
import { money, dateTime, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

function ChangeOrder({ co, onDecide, deciding }) {
  if (!co || co.status !== 'PROPOSED') return null
  return (
    <div className="card pad warn" style={{ marginBottom: 20 }}>
      <div className="spread" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 9 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
            <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
          </svg>
          <span className="eyebrow" style={{ color: 'var(--amber)' }}>
            Outside your plan — approval needed
          </span>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{co.refNumber}</span>
      </div>

      <div className="grid g3" style={{
        gap: 0, border: '1px solid var(--ink-200)',
        borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 15,
      }}>
        <div style={{ padding: '14px 16px', borderRight: '1px solid var(--ink-200)' }}>
          <div className="eyebrow">Estimate</div>
          <div className="num" style={{ fontSize: 22, marginTop: 5 }}>
            {money(co.amountCents, { withCents: false })}
          </div>
        </div>
        <div style={{ padding: '14px 16px', borderRight: '1px solid var(--ink-200)' }}>
          <div className="eyebrow">Time</div>
          <div className="num" style={{ fontSize: 22, marginTop: 5 }}>
            {co.estimatedHours}
            <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}> hrs</span>
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div className="eyebrow">Adds to launch</div>
          <div className="num" style={{ fontSize: 22, marginTop: 5 }}>
            +{co.addedDays}
            <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}> days</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.62, marginBottom: 16 }}>
        {co.description}
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 9 }}>
        <button className="btn btn-p" disabled={deciding} onClick={() => onDecide('approve')}>
          {deciding === 'approve' ? 'Approving…' : `Approve ${money(co.amountCents, { withCents: false })}`}
        </button>
        <button className="btn btn-g" disabled={deciding} onClick={() => onDecide('decline')}>
          Decline
        </button>
      </div>
      <div className="row" style={{ marginTop: 12, gap: 7 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
        <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
          Approving adds this to your next invoice. It does not charge your card today.
        </span>
      </div>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: req, error, loading, reload, setData } = useApi(EP.request(id))
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [deciding, setDeciding] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Mark read on open, fire-and-forget. A failure here should never block the page.
  useEffect(() => { if (req?.id) post(EP.requestRead(req.id)).catch(() => {}) }, [req?.id])

  const send = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true); setActionError(null)
    try {
      const msg = await post(EP.requestMessages(id), { body: reply.trim() })
      setData((r) => ({ ...r, messages: [...(r.messages || []), msg] }))
      setReply('')
    } catch (err) { setActionError(err) } finally { setSending(false) }
  }

  const decide = async (action) => {
    setDeciding(action); setActionError(null)
    try {
      const path = action === 'approve'
        ? EP.changeOrderApprove(req.changeOrder.id)
        : EP.changeOrderDecline(req.changeOrder.id)
      const res = await post(path)
      setData((r) => ({ ...r, changeOrder: res.changeOrder, status: action === 'approve' ? 'IN_PROGRESS' : 'DECLINED' }))
      if (action === 'approve' && res.invoice) nav(`/portal/invoices/${res.invoice.id}`)
    } catch (err) { setActionError(err) } finally { setDeciding(null) }
  }

  if (loading) return <><TopBar crumbs={[{ label: 'Requests', to: '/portal/requests' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Requests', to: '/portal/requests' }]} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  const type = REQUEST_TYPE[req.type] || REQUEST_TYPE.UPDATE
  const st = REQUEST_STATUS[req.status] || REQUEST_STATUS.NEW
  // The backend strips internalOnly from client responses. Filtering again is
  // belt-and-braces: if that ever regresses server-side, nothing leaks here.
  const messages = (req.messages || []).filter((m) => !m.internalOnly)

  return (
    <>
      <TopBar crumbs={[
        { label: 'Requests', to: '/portal/requests' },
        { label: req.refNumber },
      ]} />

      <div className="wrap" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 18 }}>
          <div className="row" style={{ gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
            <Chip tone={type.chip}>{type.label}</Chip>
            <Chip tone={st.chip} live={req.status === 'NEEDS_CLIENT'}>{st.label}</Chip>
            <span className="eyebrow">opened {longDate(req.createdAt)}</span>
          </div>
          <h1 className="h1">{req.title}</h1>
        </div>

        {actionError && <div style={{ marginBottom: 16 }}><ErrorNote error={actionError} /></div>}

        <ChangeOrder co={req.changeOrder} onDecide={decide} deciding={deciding} />

        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 6 }}>Conversation</div>

          {messages.map((m) => (
            <div key={m.id} className="msg">
              <Avatar name={m.authorName} size="sm" />
              <div className="msg-b">
                <div className="msg-h">
                  <span className="msg-n">{m.authorName}</span>
                  <span className="msg-t">{dateTime(m.createdAt)}</span>
                </div>
                <p className="msg-x">{m.body}</p>
                {m.assets?.length > 0 && (
                  <div className="row" style={{ gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
                    {m.assets.map((a) => (
                      <span key={a.id} className="att">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                        </svg>
                        {a.filename}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="hr" />

          <form onSubmit={send}>
            <textarea className="inp" rows={3} placeholder="Reply…" style={{ resize: 'vertical' }}
              value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="spread" style={{ marginTop: 11 }}>
              <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                Replies land on this project and stay here for good.
              </span>
              <button className="btn btn-p sm" type="submit" disabled={sending || !reply.trim()}
                style={{ opacity: sending || !reply.trim() ? 0.5 : 1 }}>
                {sending ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}