import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, adaptPortalHome, adaptProject } from '../../lib/endpoints'
import { useAuth } from '../../auth/AuthProvider'
import { money, daysUntil, dateTime, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import StageRail from '../../components/StageRail'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

/** StageView calls the field `key`; adapted objects also carry `stageKey`. */
const stageLabel = (s) => {
  const k = s?.stageKey ?? s?.key ?? ''
  return k ? k.charAt(0) + k.slice(1).toLowerCase() : 'Your project'
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function NeedsYouCard({ item }) {
  if (item.kind === 'CHANGE_ORDER') {
    return (
      <div className="card pad warn">
        <div className="row" style={{ marginBottom: 11 }}>
          <Chip tone="c-you" live>Approval</Chip>
          <span className="mono push" style={{ fontSize: 10, color: 'var(--mute)' }}>{item.refNumber}</span>
        </div>
        <div className="h3" style={{ marginBottom: 5 }}>{item.title}</div>
        <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.55 }}>
          This sits outside your current scope. We&apos;ve quoted{' '}
          <b className="num" style={{ fontSize: 13 }}>{money(item.amountCents, { withCents: false })}</b>
          {item.hours ? ` for ${item.hours} hours of work.` : '.'} Nothing starts until you approve.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <Link to={`/portal/requests/${item.requestId}`} className="btn btn-p sm" style={{ textDecoration: 'none' }}>
            Review and approve
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="card pad">
      <div className="row" style={{ marginBottom: 11 }}>
        <Chip tone="c-you" live>Waiting on you</Chip>
        <span className="mono push" style={{ fontSize: 10, color: 'var(--mute)' }}>{item.refNumber}</span>
      </div>
      <div className="h3" style={{ marginBottom: 5 }}>{item.title}</div>
      <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.55 }}>{item.body}</p>
      <div className="row" style={{ marginTop: 14 }}>
        <Link to="/portal/files" className="btn btn-s sm" style={{ textDecoration: 'none' }}>Upload a photo</Link>
        {item.askedAt && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-400)' }}>
            asked {longDate(item.askedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Overview() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi(EP.portalHome(), { select: adaptPortalHome })

  // /v1/portal/home builds its projects with ProjectView.summary(), which passes
  // List.of() for stages — there is no stage data in that response at all. The
  // tracker needs GET /v1/projects/{id}. Declared before the early returns so the
  // hook order stays stable; a null path means useApi doesn't fetch.
  const activeId = data?.activeProject?.id
  const detail = useApi(activeId ? EP.project(activeId) : null, { select: adaptProject })

  if (loading) return <><TopBar crumbs={[{ label: 'Overview' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Overview' }]} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  const { needsYou = [], balanceDueCents = 0, nextInvoice, recentActivity = [] } = data
  // Prefer the detail fetch — it's the only one carrying stages.
  const p = detail.data || data.activeProject
  const dueIn = daysUntil(nextInvoice?.dueOn)
  const live = p?.stages?.find((s) => (s.stageKey ?? s.key) === p.currentStage)

  return (
    <>
      <TopBar crumbs={[{ label: 'Overview' }]}>
        <Link to="/portal/requests/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>
          New request
        </Link>
      </TopBar>

      <div className="wrap">
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="h1" style={{ marginTop: 7 }}>
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="sub">
            {live
              ? `${stageLabel(live)} is ${live.progressPct ?? 0}% through.`
              : 'Here’s where things stand.'}
            {needsYou.length > 0 && ` ${needsYou.length} thing${needsYou.length > 1 ? 's need' : ' needs'} you.`}
          </p>
        </div>

        {needsYou.length > 0 && (
          <>
            <div className="sect-head" style={{ marginTop: 0 }}>
              <span className="eyebrow" style={{ color: 'var(--amber)' }}>Needs you</span>
              <span className="rule" />
            </div>
            <div className={`grid ${needsYou.length > 1 ? 'g2' : ''}`}>
              {needsYou.map((n) => <NeedsYouCard key={n.refNumber} item={n} />)}
            </div>
          </>
        )}

        <div className="sect-head">
          <span className="eyebrow">Your project</span>
          <span className="rule" />
          <Link to="/portal/project" className="btn btn-g sm" style={{ textDecoration: 'none' }}>
            Open project →
          </Link>
        </div>

        {p ? (
          <StageRail
            stages={p.stages}
            currentStage={p.currentStage}
            title={p.name}
            subtitle={[p.type, p.startedAt && `started ${longDate(p.startedAt)}`].filter(Boolean).join(' · ')}
            footer={
              <>
                <dl className="kv"><dt>Now building</dt><dd>{live?.clientNote || '—'}</dd></dl>
                <dl className="kv"><dt>Est. launch</dt><dd>{p.estLaunchAt ? longDate(p.estLaunchAt) : '—'}</dd></dl>
                {p.previewUrl && (
                  <dl className="kv push">
                    <dt>Preview</dt>
                    <dd>
                      <a href={p.previewUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--em-hi)', textDecoration: 'none' }}>
                        {p.previewUrl.replace(/^https?:\/\//, '')} ↗
                      </a>
                    </dd>
                  </dl>
                )}
              </>
            }
          />
        ) : (
          <EmptyState
            title="Your project hasn’t started yet"
            body="Once discovery kicks off, this fills in with your stages and dates."
          />
        )}

        <div className="grid g2" style={{ marginTop: 14 }}>
          <div className="card pad">
            <div className="spread" style={{ marginBottom: 15 }}>
              <span className="eyebrow">Balance due</span>
              {dueIn != null && (
                <Chip tone={dueIn < 0 ? 'c-late' : 'c-you'}>
                  {dueIn < 0 ? `${Math.abs(dueIn)} days past due` : `Due in ${dueIn} days`}
                </Chip>
              )}
            </div>
            <div className="num" style={{ fontSize: 34 }}>
              {money(balanceDueCents, { withCents: false })}
              <span style={{ fontSize: 15, color: 'var(--mute)', fontWeight: 500 }}>
                .{String((balanceDueCents ?? 0) % 100).padStart(2, '0')}
              </span>
            </div>
            {nextInvoice && (
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 6 }}>
                Invoice <span className="mono">{nextInvoice.number}</span> · {nextInvoice.description} · due {longDate(nextInvoice.dueOn)}
              </div>
            )}
            <div className="hr" />
            <div className="row">
              {nextInvoice?.id && (
                <Link to={`/portal/invoices/${nextInvoice.id}/pay`} className="btn btn-p sm" style={{ textDecoration: 'none' }}>
                  Pay this invoice
                </Link>
              )}
              <Link to="/portal/billing" className="btn btn-g sm" style={{ textDecoration: 'none' }}>
                View all invoices
              </Link>
            </div>
          </div>

          <div className="card pad">
            <div className="spread" style={{ marginBottom: 13 }}>
              <span className="eyebrow">Recent activity</span>
            </div>
            <div className="stack tight">
              {recentActivity.map((a) => (
                <div key={a.id} className="row tp" style={{ gap: 11 }}>
                  <Avatar name={a.actorName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>
                      <b style={{ color: 'var(--white)', fontWeight: 600 }}>{a.actorName}</b> {a.body}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>
                      {dateTime(a.at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}