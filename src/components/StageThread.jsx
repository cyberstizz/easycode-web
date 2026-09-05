import { useState } from 'react'
import { useApi } from '../lib/useApi'
import { post } from '../lib/api'
import { EP, adaptThread } from '../lib/endpoints'
import { dateTime } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'
import Avatar from './Avatar'
import ErrorNote from './ErrorNote'

/**
 * The conversation under one stage update. Same component on both sides;
 * only the wording of the composer changes.
 *
 * `counterpart` is who you're talking to — "Latavia" on the developer's side,
 * "Charles" on the client's — so the reply box says who will read it.
 */
export default function StageThread({ projectId, stageKey, counterpart, onLoaded }) {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi(
    projectId && stageKey ? EP.stageMessages(projectId, stageKey) : null,
    { select: (raw) => { const t = adaptThread(raw); onLoaded?.(t); return t } },
  )
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true); setSendError(null)
    try {
      await post(EP.stageMessages(projectId, stageKey), { body })
      setDraft('')
      await reload()
    } catch (e) { setSendError(e) } finally { setSending(false) }
  }

  const items = data?.items || []

  return (
    <div className="thread">
      {error && <ErrorNote error={error} onRetry={reload} />}
      {!loading && items.length === 0 && (
        <div className="thread-empty">No replies yet. {counterpart ? `${counterpart} can answer right here.` : ''}</div>
      )}
      {items.map((m) => {
        const mine = m.authorId === user?.id
        return (
          <div key={m.id} className="msg">
            <Avatar name={m.authorName} size="sm" />
            <div>
              <div className="who">
                <b>{mine ? 'You' : m.authorName}</b>
                <span className="t mono">{dateTime(m.createdAt)}</span>
              </div>
              <p>{m.body}</p>
            </div>
          </div>
        )
      })}

      <div className="compose">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={counterpart ? `Reply to ${counterpart}…` : 'Write a reply…'}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send() }}
        />
        {sendError && <div style={{ marginBottom: 8 }}><ErrorNote error={sendError} /></div>}
        <div className="bar">
          <small>{counterpart ? `${counterpart} sees it right away.` : ''} <span className="mono" style={{ opacity: .6 }}>⌘↵</span></small>
          <button className="btn btn-p sm push" onClick={send} disabled={!draft.trim() || sending}>
            {sending ? 'Sending…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}