import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, LEAD_STATUS, LEAD_SOURCE, rung, adaptBoard } from '../../lib/endpoints'
import { money, daysUntil, ago } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Chip from '../../components/Chip'

function Card({ lead }) {
  const src = LEAD_SOURCE[lead.source] || LEAD_SOURCE.OTHER
  const late = lead.overdue ?? (lead.nextActionAt && daysUntil(lead.nextActionAt) < 0)
  const r = rung(lead.offeredTier)
  const cold = (lead.callCount ?? 0) >= 4 && (lead.connectedCount ?? 0) === 0

  return (
    <Link to={`/admin/leads/${lead.id}`} className={`lrow${late ? ' unread' : ''}`}
      style={{
        flexDirection: 'column', alignItems: 'stretch', gap: 7, padding: 12, textDecoration: 'none',
        ...(late ? { borderColor: 'rgba(240,85,95,.3)' } : {}),
        ...(lead.status === 'WON' ? { borderColor: 'var(--em-line)' } : {}),
        ...(cold ? { opacity: 0.6 } : {}),
      }}>
      <div className="lrow-t" style={{ fontSize: 13 }}>{lead.contactName || lead.businessName}</div>
      <div className="lrow-s">{lead.contactName ? lead.businessName : '\u2014'}</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {lead.status === 'NEW' && <Chip tone={src.chip} live={lead.source === 'WEBSITE_FORM'}>{src.label}</Chip>}
        {lead.status === 'CONTACTED' && (
          cold ? <Chip tone="c-done">No answer ×{lead.callCount}</Chip>
            : <Chip tone="c-done">{lead.callCount} call{lead.callCount === 1 ? '' : 's'}</Chip>
        )}
        {['PITCHED', 'NEGOTIATING', 'WON'].includes(lead.status) && lead.offeredTier && (
          <Chip tone={lead.offeredTier === 'SPECIAL' ? 'c-vio' : lead.status === 'WON' ? 'c-new' : 'c-prog'}>
            {r.label}{r.down != null && r.key !== 'SPECIAL' ? ` · $${(r.down / 100).toFixed(0)}` : ''}
          </Chip>
        )}
        {late && <span className="mono" style={{ fontSize: 9.5, color: 'var(--red)' }}>{Math.abs(daysUntil(lead.nextActionAt))}d late</span>}
        {!late && lead.status === 'NEW' && !lead.callCount && (
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-400)' }}>never called</span>
        )}
        {!late && lead.nextActionAt && daysUntil(lead.nextActionAt) > 0 && (
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--cyan)' }}>in {daysUntil(lead.nextActionAt)}d</span>
        )}
      </div>
    </Link>
  )
}

export default function Pipeline() {
  const { data, error, loading, reload } = useApi(EP.adminLeadsBoard(), { select: adaptBoard })

  if (loading) return <><TopBar crumbs={[{ label: 'Pipeline' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Pipeline' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const leads = data?.items || []
  const stats = data?.stats || {}
  const live = leads.filter((l) => l.status !== 'WON' && l.status !== 'LOST')

  return (
    <>
      <TopBar crumbs={[{ label: 'Pipeline' }]}>
        <Link to="/admin/leads/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>+ Add lead</Link>
      </TopBar>

      <div className="wrap wide">
        <div className="spread" style={{ marginBottom: 18, alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 className="h1">Pipeline</h1>
            <p className="sub">{live.length} live leads. Every stage shows what's gone quiet.</p>
          </div>
          {stats.pipelineValueCents > 0 && (
            <div className="row" style={{ gap: 24 }}>
              <dl className="kv">
                <dt>If all closed</dt>
                <dd className="num" style={{ fontSize: 16, color: 'var(--em-hi)' }}>
                  {money(stats.pipelineValueCents, { withCents: false })}
                </dd>
              </dl>
              <dl className="kv"><dt>Over 2 years</dt><dd style={{ fontSize: 13, color: 'var(--mute)' }}>at $50/mo each</dd></dl>
            </div>
          )}
        </div>

        {leads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            body="Add your first one, or import a call list."
            action={<Link to="/admin/leads/new" className="btn btn-p sm" style={{ textDecoration: 'none' }}>Add a lead</Link>}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${LEAD_STATUS.length}, minmax(196px, 1fr))`,
            gap: 11, overflowX: 'auto', paddingBottom: 8,
          }}>
            {LEAD_STATUS.map((col) => {
              const inCol = leads.filter((l) => l.status === col.key)
              return (
                <div key={col.key}>
                  <div className="spread" style={{ padding: '0 3px 9px' }}>
                    <span className="eyebrow" style={{ color: col.accent }}>
                      {col.key === 'WON' ? 'Won this month' : col.label}
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{inCol.length}</span>
                  </div>
                  <div className="stack tight">
                    {inCol.map((l) => <Card key={l.id} lead={l} />)}
                    {inCol.length === 0 && (
                      <div style={{
                        border: '1px dashed var(--ink-300)', borderRadius: 'var(--r)',
                        padding: '18px 12px', textAlign: 'center', fontSize: 11.5, color: 'var(--ink-400)',
                      }}>Empty</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* These three exist only because calls get logged. That's the argument
            for the discipline, made visible. */}
        {(stats.objectionCounts?.length > 0) && (
          <div className="grid g3" style={{ marginTop: 20 }}>
            <div className="card pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Where deals die</div>
              <div className="stack tight">
                {stats.objectionCounts.map((o, i) => (
                  <div key={o.tag} className="spread">
                    <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{o.tag}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--mute)' }}>
                      {o.losses} losses
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 11, lineHeight: 1.55 }}>
                Straight from your objection tags. Cash flow is your biggest killer — which is exactly what the
                $200 deal answers.
              </div>
            </div>

            <div className="card pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Which offer closes</div>
              <div className="stack tight">
                {stats.rungConversion?.map((r) => (
                  <div key={r.rung} className="spread">
                    <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                      {rung(r.rung).label}{rung(r.rung).down != null ? ` · $${(rung(r.rung).down / 100).toFixed(0)}` : ''}
                    </span>
                    <span className="mono" style={{ fontSize: 12.5, color: r.wins >= 5 ? 'var(--em-hi)' : 'var(--text)' }}>
                      {r.wins} of {r.of}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 11, lineHeight: 1.55 }}>
                Lead with Preferred. The floor almost never buys you the deal.
              </div>
            </div>

            <div className="card pad">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Dials to a close</div>
              <div className="num" style={{ fontSize: 30 }}>{stats.dialsPerClose}</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 5 }}>calls per signed client</div>
              <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 11, lineHeight: 1.55 }}>
                At 60 dials a day that's roughly one client a day once the pipeline fills. This number only
                exists because you log every call.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}