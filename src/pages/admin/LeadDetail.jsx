import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, RUNGS, rung, twoYearValueCents, LEAD_SOURCE, LEAD_STATUS, adaptLead } from '../../lib/endpoints'
import { useAuth } from '../../auth/AuthProvider'
import { money, dateTime, daysUntil, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

const OUTCOME_LABEL = {
  CONNECTED: 'Connected', VOICEMAIL: 'Voicemail', NO_ANSWER: 'No answer',
  BAD_NUMBER: 'Bad number', NOT_INTERESTED: 'Not interested',
}

const mins = (s) => s ? ` · ${Math.round(s / 60)}m` : ''

/** One rung of the ladder. Declined rungs dim; the live one is flagged. */
function Rung({ r, state }) {
  const live = state === 'OFFERED'
  const declined = state === 'DECLINED'
  return (
    <div style={{
      border: `1px solid ${live ? 'rgba(245,158,11,.4)' : 'var(--ink-200)'}`,
      borderRadius: 'var(--r)', overflow: 'hidden', background: 'var(--ink-050)',
      opacity: declined ? 0.6 : 1,
      ...(live ? { boxShadow: '0 0 0 3px rgba(245,158,11,.06)' } : {}),
    }}>
      <div style={{
        padding: '11px 14px', borderBottom: '1px solid var(--ink-200)',
        display: 'flex', alignItems: 'center', gap: 8,
        ...(live ? { background: 'rgba(245,158,11,.06)' } : {}),
      }}>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: live ? 'var(--amber)' : 'var(--ink-400)' }}>
          {String(RUNGS.findIndex((x) => x.key === r.key)).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 13, fontWeight: 650, color: live ? 'var(--white)' : 'var(--text)' }}>{r.label}</span>
        {declined && <Chip tone="c-done">Declined</Chip>}
        {live && <span className="push"><Chip tone="c-you" live>On the table</Chip></span>}
      </div>
      <div style={{ padding: '15px 14px' }}>
        <div>
          <span className="num" style={{ fontSize: 23, ...(live ? { color: 'var(--amber)' } : {}) }}>
            {r.down != null ? money(r.down, { withCents: false }) : 'Custom'}
          </span>
          {r.down != null && <span style={{ fontSize: 12.5, color: 'var(--mute)' }}> down</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>{r.note}</div>
        <div className="hr" style={{ margin: '13px 0' }} />
        <div className="spread" style={{ fontSize: 12, color: 'var(--mute)' }}>
          <span>2-year value</span>
          <span className="mono" style={{ color: r.key === 'PREFERRED' ? 'var(--em-hi)' : 'var(--text)', fontWeight: 700 }}>
            {money(twoYearValueCents(r.key), { withCents: false })}
          </span>
        </div>
      </div>
    </div>
  )
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

export default function LeadDetail() {
  const { id } = useParams()
  const { isOwner } = useAuth()
  const validId = id && id !== 'undefined' && id !== 'null'
  const { data: lead, error, loading, reload } = useApi(validId ? EP.adminLead(id) : null, { select: adaptLead })

  if (!validId) return <NoLead />
  if (loading) return <><TopBar crumbs={[{ label: 'Pipeline', to: '/admin/pipeline' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Pipeline', to: '/admin/pipeline' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const src = LEAD_SOURCE[lead.source] || LEAD_SOURCE.OTHER
  const statusMeta = LEAD_STATUS.find((s) => s.key === lead.status)
  const current = lead.offeredTier || 'NONE'
  // Which rungs were declined is derivable from the activity history: any rung
  // offered on an earlier call that is no longer the current one was passed on.
  const history = {}
  for (const a of lead.activities || []) {
    if (a.rungOffered && a.rungOffered !== current) history[a.rungOffered] = 'DECLINED'
  }
  const atFloor = current === 'FLOOR'
  const late = lead.overdue ?? (lead.nextActionAt && daysUntil(lead.nextActionAt) < 0)
  const activities = lead.activities || []
  const ladder = RUNGS.filter((r) => r.key !== 'NONE' && (!r.ownerOnly || isOwner))

  return (
    <>
      <TopBar crumbs={[{ label: 'Pipeline', to: '/admin/pipeline' }, { label: lead.contactName }]}>
        <Link to={`/admin/leads/${id}/log`} className="btn btn-s sm" style={{ textDecoration: 'none' }}>Log a call</Link>
        <Link to={`/admin/leads/${id}/convert`} className="btn btn-p sm" style={{ textDecoration: 'none' }}>Mark won →</Link>
      </TopBar>

      <div className="wrap wide">
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="spread" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div className="row" style={{ gap: 14 }}>
              <Avatar name={lead.contactName} size="lg" />
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <h1 className="h1" style={{ fontSize: 21 }}>{lead.contactName || lead.businessName}</h1>
                  <Chip tone={lead.status === 'WON' ? 'c-new' : lead.status === 'NEGOTIATING' ? 'c-you' : 'c-done'}>
                    {statusMeta?.label || lead.status}
                  </Chip>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                  {lead.businessName}
                </div>
                <div className="row" style={{ gap: 14, marginTop: 7 }}>
                  {lead.phone && (
                    <a href={`tel:${lead.phone.replace(/\D/g, '')}`} className="mono"
                      style={{ fontSize: 11.5, color: 'var(--em-hi)', textDecoration: 'none' }}>{lead.phone}</a>
                  )}
                  {lead.email && <span className="mono" style={{ fontSize: 11.5, color: 'var(--mute-hi)' }}>{lead.email}</span>}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 22 }}>
              <dl className="kv"><dt>Source</dt><dd>{src.label}</dd></dl>
              <dl className="kv">
                <dt>Calls</dt>
                <dd className="mono" style={{ fontSize: 13.5 }}>{lead.callCount ?? 0} · {lead.connectedCount ?? 0} connected</dd>
              </dl>
              {lead.createdAt && (
                <dl className="kv">
                  <dt>First touch</dt>
                  <dd className="mono" style={{ fontSize: 13.5 }}>{Math.abs(daysUntil(lead.createdAt))} days ago</dd>
                </dl>
              )}
            </div>
          </div>
        </div>

        {lead.status !== 'WON' && (
          <div className="card pad" style={{ marginBottom: 16 }}>
            <div className="spread" style={{ marginBottom: 5 }}>
              <span className="eyebrow">Offer ladder</span>
              <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                Work down only when they push back. Never open at the floor.
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 16 }}>
              Currently offered:{' '}
              <b style={{ color: current === 'NONE' ? 'var(--mute)' : 'var(--amber)' }}>
                {current === 'NONE' ? 'nothing yet' : rung(current).label.toLowerCase()}
              </b>
            </div>

            <div className="grid g3" style={{ gap: 11 }}>
              {ladder.filter((r) => r.key !== 'SPECIAL').map((r) => (
                <Rung key={r.key} r={r}
                  state={r.key === current ? 'OFFERED' : (history[r.key] || (r.key === 'SPECIAL' ? '' : ''))} />
              ))}
            </div>

            {atFloor && (
              <div className="note amber" style={{ marginTop: 15, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span>
                  <b>You're out of room.</b> $100 is the floor — there is no rung 4.
                  Next call is close-or-park, not another discount.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="split" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,310px)' }}>
          <div>
            <div className="card pad">
              <div className="spread" style={{ marginBottom: 14 }}>
                <span className="eyebrow">Everything that's happened</span>
                <Link to={`/admin/leads/${id}/log`} className="btn btn-p sm" style={{ textDecoration: 'none' }}>Log a call</Link>
              </div>

              {activities.length === 0 ? (
                <EmptyState
                  title="No calls logged yet"
                  body="Log the first one and this becomes the record you can read before every future call."
                  action={<Link to={`/admin/leads/${id}/log`} className="btn btn-s sm" style={{ textDecoration: 'none' }}>Log a call</Link>}
                />
              ) : activities.map((a, i) => (
                <div key={a.id} className="msg" style={i === 0 ? { paddingTop: 0 } : undefined}>
                  <Avatar name={a.userName || 'EasyCode'} size="sm" tone="cool" />
                  <div className="msg-b">
                    <div className="msg-h">
                      <span className="msg-n">{dateTime(a.occurredAt)}</span>
                      <Chip tone={a.outcome === 'CONNECTED' ? 'c-new' : 'c-done'}>
                        {OUTCOME_LABEL[a.outcome] || a.outcome}{mins(a.durationSeconds)}
                      </Chip>
                    </div>
                    {a.body && <p className="msg-x">{a.body}</p>}
                    {(a.objectionTags?.length > 0 || (a.rungOffered && a.rungOffered !== 'NONE')) && (
                      <div className="row" style={{ gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                        {a.objectionTags?.map((t) => <Chip key={t} tone="c-you">{t}</Chip>)}
                        {a.rungOffered && a.rungOffered !== 'NONE' && (
                          <Chip tone="c-vio">Offered {rung(a.rungOffered).label.toLowerCase()}</Chip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pane">
            {lead.nextActionAt && (
              <div className="card pad glow">
                <div className="eyebrow" style={{ marginBottom: 11 }}>Next action</div>
                <div className="h3" style={{ marginBottom: 4 }}>{lead.nextActionNote || 'Follow up'}</div>
                <div className="mono" style={{ fontSize: 13, color: late ? 'var(--red)' : 'var(--cyan)', marginBottom: 13 }}>
                  {late
                    ? `Overdue by ${Math.abs(daysUntil(lead.nextActionAt))} days`
                    : longDate(lead.nextActionAt)}
                </div>
                <Link to={`/admin/leads/${id}/log`} className="btn btn-p sm blk" style={{ textDecoration: 'none' }}>
                  Call {(lead.contactName || lead.businessName || '').split(' ')[0]} now
                </Link>
              </div>
            )}

            {lead.notes && (
              <div className="card pad" style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 11 }}>Notes</div>
                <div className="note mute" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{lead.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}