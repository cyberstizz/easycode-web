import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, LEAD_SOURCE, adaptDue, adaptBoard } from '../../lib/endpoints'
import { daysUntil, money } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const clock = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

function CallRow({ lead, time, tone }) {
  const src = LEAD_SOURCE[lead.source] || LEAD_SOURCE.OTHER
  return (
    <Link
      to={`/admin/leads/${lead.id}`}
      className={`lrow${tone === 'late' ? ' unread' : ''}`}
      style={{ textDecoration: 'none', ...(tone === 'late' ? { borderLeftColor: 'var(--red)' } : {}) }}
    >
      {time && (
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', width: 44, flexShrink: 0 }}>
          {time}
        </span>
      )}
      <Avatar name={lead.contactName} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lrow-t">
          {lead.contactName || lead.businessName}{' '}
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 400 }}>
            · {lead.contactName ? lead.businessName : 'no contact name'}
          </span>
        </div>
        <div className="lrow-s">{lead.nextActionNote || lead.businessName || src.label}</div>
      </div>
      {tone === 'late' && <Chip tone="c-late">{Math.abs(daysUntil(lead.nextActionAt))} days late</Chip>}
      {tone === 'fresh' && <Chip tone={src.chip} live={lead.source === 'WEBSITE_FORM'}>{src.label}</Chip>}
      <Link to={`/admin/leads/${lead.id}/log`} className="btn btn-s sm" style={{ textDecoration: 'none' }}>
        Call
      </Link>
    </Link>
  )
}

export default function Today() {
  const { data, error, loading, reload } = useApi(EP.adminLeadsDue(), { select: adaptDue })
  const board = useApi(EP.adminLeadsBoard(), { select: adaptBoard })

  if (loading) return <><TopBar crumbs={[{ label: 'Today' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Today' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const due = data?.items || []
  const stats = data?.stats || {}
  const all = board.data?.items || []

  // Anything whose next action has already passed. These get called first —
  // a lead that's been waiting is a lead going cold.
  const overdue = due.filter((l) => l.overdue ?? daysUntil(l.nextActionAt) < 0)
  const today = due.filter((l) => !(l.overdue ?? daysUntil(l.nextActionAt) < 0))
  const fresh = all.filter((l) => l.status === 'NEW' && !l.nextActionAt)
  const total = overdue.length + today.length + fresh.length

  return (
    <>
      <TopBar crumbs={[{ label: 'Today' }]}>
        <Link to="/admin/leads/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>
          + Add lead
        </Link>
      </TopBar>

      <div className="wrap wide">
        <div className="spread" style={{ marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}{clock(new Date().toISOString())}
            </div>
            <h1 className="h1" style={{ marginTop: 7 }}>
              {total > 0 ? `${total} calls. Start at the top.` : `${greeting()}, Charles.`}
            </h1>
            <p className="sub">
              {total > 0
                ? 'Sorted by what’s most likely to close, not by what came in first.'
                : 'Nothing due today. Add leads or work the never-contacted list.'}
            </p>
          </div>
          <div className="row" style={{ gap: 26 }}>
            <dl className="kv">
              <dt>Dials today</dt>
              <dd className="mono" style={{ fontSize: 17 }}>
                {stats.dialsToday ?? 0}{' '}
                <span style={{ color: 'var(--mute)', fontSize: 12 }}>/ {stats.dialsGoal ?? 60}</span>
              </dd>
            </dl>
            <dl className="kv"><dt>This week</dt><dd className="mono" style={{ fontSize: 17 }}>{stats.dialsThisWeek ?? 0}</dd></dl>
            <dl className="kv">
              <dt>Closed this month</dt>
              <dd className="mono" style={{ fontSize: 17, color: 'var(--em-hi)' }}>{stats.closedThisMonth ?? 0}</dd>
            </dl>
          </div>
        </div>

        <div className="note mute" style={{ marginBottom: 22, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            <b style={{ color: 'var(--text)' }}>This list builds itself.</b> Every call you log sets a next action,
            and that next action puts the lead back on this page on the right day. Nothing needs to be remembered.
          </span>
        </div>

        {overdue.length > 0 && (
          <>
            <div className="sect-head" style={{ marginTop: 0 }}>
              <span className="eyebrow" style={{ color: 'var(--red)' }}>Overdue — call these first</span>
              <span className="rule" />
            </div>
            <div className="stack tight">
              {overdue.map((l) => <CallRow key={l.id} lead={l} tone="late" />)}
            </div>
          </>
        )}

        {today.length > 0 && (
          <>
            <div className="sect-head"><span className="eyebrow" style={{ color: 'var(--cyan)' }}>Scheduled today</span><span className="rule" /></div>
            <div className="stack tight">
              {today.map((l) => <CallRow key={l.id} lead={l} time={clock(l.nextActionAt)} />)}
            </div>
          </>
        )}

        {fresh.length > 0 && (
          <>
            <div className="sect-head">
              <span className="eyebrow">Never contacted · {fresh.length}</span>
              <span className="rule" />
              <Link to={`/admin/leads/${fresh[0].id}/log`} className="btn btn-g sm" style={{ textDecoration: 'none' }}>
                Start dialing →
              </Link>
            </div>
            <div className="stack tight">
              {fresh.map((l) => <CallRow key={l.id} lead={l} tone="fresh" />)}
            </div>
          </>
        )}

        {total === 0 && (
          <EmptyState
            title="Nothing due today"
            body="When you log a call you set a next action, and the lead comes back here on that day."
            action={<Link to="/admin/leads/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>Add your first lead</Link>}
          />
        )}

        {stats.pipelineValueCents > 0 && (
          <div className="card pad" style={{ marginTop: 22 }}>
            <div className="spread" style={{ flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="eyebrow">Pipeline if everything closed</span>
                <div className="num" style={{ fontSize: 26, marginTop: 6 }}>
                  {money(stats.pipelineValueCents, { withCents: false })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>over two years, at $50/mo each</div>
              </div>
              <Link to="/admin/pipeline" className="btn btn-s sm" style={{ textDecoration: 'none' }}>
                Open pipeline →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}