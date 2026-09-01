import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, REQUEST_TYPE, REQUEST_STATUS, adaptRequests } from '../../lib/endpoints'
import { ago } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Chip from '../../components/Chip'

const FILTERS = [
  { key: 'open', label: 'Open', test: (r) => !['DONE', 'DECLINED'].includes(r.status) },
  { key: 'needs_you', label: 'Needs you', test: (r) => r.status === 'NEEDS_CLIENT' },
  { key: 'closed', label: 'Closed', test: (r) => ['DONE', 'DECLINED'].includes(r.status) },
]

export default function Requests() {
  const { data, error, loading, reload } = useApi(EP.requests(), { select: adaptRequests })
  const [filter, setFilter] = useState('open')
  const [q, setQ] = useState('')

  const all = data?.items || []
  const active = FILTERS.find((f) => f.key === filter)
  const rows = all
    .filter(active.test)
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || (r.refNumber || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <TopBar crumbs={[{ label: 'Requests' }]}>
        <Link to="/portal/requests/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>
          + New request
        </Link>
      </TopBar>

      <div className="wrap">
        <div style={{ marginBottom: 18 }}>
          <h1 className="h1">Requests</h1>
          <p className="sub">
            Changes, questions, and new work. Everything you&apos;ve ever asked us, in one place.
          </p>
        </div>

        <div className="spread" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="seg">
            {FILTERS.map((f) => (
              <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
                {f.label} · {all.filter(f.test).length}
              </button>
            ))}
          </div>
          <input className="inp" style={{ maxWidth: 240 }} placeholder="Search requests…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading && <Loading />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title={q ? `No results for “${q}”` : 'Nothing to ask us yet'}
            body={q
              ? 'Try a shorter word, or check closed requests — they’re hidden by default.'
              : 'Need a change, or just have a question? Send it here and it lands on your project.'}
            action={!q && (
              <Link to="/portal/requests/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>
                Send your first request
              </Link>
            )}
          />
        )}

        <div className="stack tight">
          {rows.map((r) => {
            const type = REQUEST_TYPE[r.type] || REQUEST_TYPE.UPDATE
            const st = REQUEST_STATUS[r.status] || REQUEST_STATUS.NEW
            return (
              <Link key={r.id} to={`/portal/requests/${r.id}`}
                className={`lrow${r.unread ? ' unread' : ''}`} style={{ textDecoration: 'none' }}>
                <span className="lrow-id">{r.refNumber}</span>
                <Chip tone={type.chip}>{type.label}</Chip>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lrow-t">{r.title}</div>
                  {r.preview && <div className="lrow-s">{r.preview}</div>}
                </div>
                <Chip tone={st.chip} live={r.status === 'NEEDS_CLIENT' || r.status === 'IN_PROGRESS'}>
                  {st.label}
                </Chip>
                <span className="lrow-time">{ago(r.updatedAt)}</span>
              </Link>
            )
          })}
        </div>

        {rows.length > 0 && (
          <div className="note mute" style={{ marginTop: 18, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              Requests marked <b style={{ color: 'var(--em-hi)' }}>Included</b> are covered by your maintenance plan.
              If something falls outside it, we quote it first and never start until you approve.
            </span>
          </div>
        )}
      </div>
    </>
  )
}