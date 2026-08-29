import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, rung } from '../../lib/endpoints'
import { money, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

const STATUS_TONE = { ACTIVE: 'c-new', PROSPECT: 'c-you', PAUSED: 'c-done', CHURNED: 'c-late' }

export default function Clients() {
  const { data, error, loading, reload } = useApi(EP.adminOrgs())
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  // Set by ClientDetail after a delete — the client page can't say it itself,
  // because by then it's gone.
  const deleted = useLocation().state?.deleted
  const [noticeGone, setNoticeGone] = useState(false)

  const all = data?.items || []
  const rows = all
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => !q || o.name?.toLowerCase().includes(q.toLowerCase()))

  // Recurring revenue is the backbone of the business, so it's the headline
  // number here rather than lifetime billings.
  const mrr = all
    .filter((o) => o.status === 'ACTIVE' && o.dealTier !== 'SPECIAL')
    .reduce((sum, o) => sum + (o.monthlyCents || 0), 0)
  const outstanding = all.reduce((sum, o) => sum + (o.outstandingCents || 0), 0)

  return (
    <>
      <TopBar crumbs={[{ label: 'Clients' }]}>
        <Link to="/admin/pipeline" className="btn btn-s sm" style={{ textDecoration: 'none' }}>
          Pipeline
        </Link>
      </TopBar>

      <div className="wrap wide">
        {deleted && !noticeGone && (
          <div className="note mute" style={{ marginBottom: 16, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span><span style={{ color: 'var(--white)' }}>{deleted}</span> was deleted.</span>
            <button className="btn btn-g sm" onClick={() => setNoticeGone(true)}>Dismiss</button>
          </div>
        )}
        <div className="spread" style={{ marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="h1">Clients</h1>
            <p className="sub">
              {all.length === 0
                ? 'Nobody yet. Clients arrive here when you convert a lead.'
                : `${all.filter((o) => o.status === 'ACTIVE').length} active.`}
            </p>
          </div>
          {all.length > 0 && (
            <div className="row" style={{ gap: 26, flexWrap: 'wrap' }}>
              <dl className="kv">
                <dt>Recurring / month</dt>
                <dd className="num" style={{ fontSize: 17, color: 'var(--em-hi)' }}>
                  {money(mrr, { withCents: false })}
                </dd>
              </dl>
              <dl className="kv">
                <dt>Outstanding</dt>
                <dd className="num" style={{ fontSize: 17, color: outstanding > 0 ? 'var(--amber)' : 'var(--mute)' }}>
                  {money(outstanding, { withCents: false })}
                </dd>
              </dl>
            </div>
          )}
        </div>

        {loading && <Loading full />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && all.length === 0 && (
          <EmptyState
            title="No clients yet"
            body="Work a lead through the pipeline and hit Mark won — the client, their project, and their portal invite all get created in one pass."
            action={<Link to="/admin/pipeline" className="btn btn-p sm" style={{ textDecoration: 'none' }}>Open pipeline</Link>}
          />
        )}

        {all.length > 0 && (
          <>
            <div className="spread" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div className="seg">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'ACTIVE', label: 'Active' },
                  { key: 'PAUSED', label: 'Paused' },
                  { key: 'CHURNED', label: 'Churned' },
                ].map((f) => (
                  <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <input className="inp" style={{ maxWidth: 240 }} placeholder="Search clients…"
                value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            {rows.length === 0 ? (
              <EmptyState title={`No results for “${q}”`} body="Try a shorter word, or clear the filter." />
            ) : (
              <div className="stack tight">
                {rows.map((o) => {
                  const tier = rung(o.dealTier)
                  const comp = o.dealTier === 'SPECIAL'
                  return (
                    <Link key={o.id} to={`/admin/clients/${o.id}`} className="lrow" style={{ textDecoration: 'none' }}>
                      <Avatar name={o.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="lrow-t">{o.name}</div>
                        <div className="lrow-s">
                          {[o.industry, o.clientSince && `since ${longDate(o.clientSince)}`]
                            .filter(Boolean).join(' · ') || 'No details yet'}
                        </div>
                      </div>
                      <Chip tone={comp ? 'c-vio' : 'c-done'}>
                        {comp ? 'Complimentary' : tier.label}
                      </Chip>
                      {!comp && o.monthlyCents > 0 && (
                        <span className="mono" style={{ fontSize: 12, color: 'var(--em-hi)', fontWeight: 700 }}>
                          {money(o.monthlyCents, { withCents: false })}/mo
                        </span>
                      )}
                      {o.outstandingCents > 0 && (
                        <Chip tone="c-you">{money(o.outstandingCents, { withCents: false })} due</Chip>
                      )}
                      <Chip tone={STATUS_TONE[o.status] || 'c-done'} live={o.status === 'ACTIVE'}>
                        {o.status}
                      </Chip>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}