import { useState } from 'react'
import { useApi } from '../../lib/useApi'
import { EP, STAGES, STAGE_META, STAGE_STATUS, DEVELOPER_NAME, adaptProjects, adaptProject } from '../../lib/endpoints'
import { longDate } from '../../lib/format'
import Prose, { extractAsks, firstLine } from '../../lib/markdown'
import { TopBar } from '../../components/Shell'
import StageRail from '../../components/StageRail'
import StageThread from '../../components/StageThread'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * The client's project page.
 *
 * The rail at the top is the summary. The spine below is the story: each stage's
 * update from the developer, then the conversation about it. The live stage is
 * open; finished ones collapse to a line and expand on tap. There are no
 * controls here — nothing on this page is editable except the reply box.
 */
export default function Project() {
  // GET /v1/projects maps through ProjectView.summary(), which sends
  // List.of() for stages. The list tells us WHICH project; only
  // GET /v1/projects/{id} carries the six stages the tracker needs.
  const { data: list, error, loading, reload } = useApi(EP.projects(), { select: adaptProjects })
  const firstId = list?.items?.[0]?.id
  const detail = useApi(firstId ? EP.project(firstId) : null, { select: adaptProject })
  const p = detail.data || list?.items?.[0]
  const [openKey, setOpenKey] = useState(null)

  if (loading || (firstId && detail.loading && !detail.data)) {
    return <><TopBar crumbs={[{ label: 'Project' }]} /><div className="wrap"><Loading full /></div></>
  }
  if (error) return <><TopBar crumbs={[{ label: 'Project' }]} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>
  if (!p) {
    return (
      <>
        <TopBar crumbs={[{ label: 'Project' }]} />
        <div className="wrap"><div className="note mute">Your project hasn't been set up yet. You'll see it here the moment it is.</div></div>
      </>
    )
  }

  const byKey = Object.fromEntries((p.stages || []).map((s) => [s.stageKey ?? s.key, s]))
  const liveKey = p.currentStage
  const live = byKey[liveKey] || {}
  const open = openKey || liveKey
  const asks = extractAsks(live.clientNote)
  const developer = DEVELOPER_NAME

  return (
    <>
      <TopBar crumbs={[{ label: 'Overview', to: '/portal' }, { label: p.name || 'Project' }]}>
        {p.previewUrl && (
          <a href={p.previewUrl} target="_blank" rel="noreferrer" className="btn btn-s sm" style={{ textDecoration: 'none' }}>
            Open preview ↗
          </a>
        )}
      </TopBar>

      <div className="wrap">
        <div className="proj-head">
          <div>
            <h1>{p.name}</h1>
            <div className="sub">
              In {STAGE_META[liveKey]?.label?.toLowerCase() || 'progress'}
              {live.progressPct != null && <> · <b>{live.progressPct}%</b></>}
              {p.estLaunchAt && <> · launching around <b>{longDate(p.estLaunchAt)}</b></>}
            </div>
          </div>
        </div>

        <StageRail stages={p.stages} currentStage={liveKey} bare />

        {asks.length > 0 && (
          <div className="needs">
            <div className="k">!</div>
            <div>
              <b>{developer} needs something from you</b><br />
              <span>{asks[0]}{asks.length > 1 ? ` — and ${asks.length - 1} more below` : ''}</span>
            </div>
            <a className="btn btn-s sm push" href="#reply" onClick={() => setOpenKey(liveKey)}>Reply</a>
          </div>
        )}

        <div className="story">
          {[...STAGES].reverse().map((key) => {
            const m = STAGE_META[key]
            const st = byKey[key] || {}
            const isDone = st.status === STAGE_STATUS.COMPLETE
            const isLive = key === liveKey
            const kind = isDone ? 'past' : isLive ? '' : 'next'
            const isOpen = key === open && kind !== 'next'
            const toggle = () => setOpenKey(key === open ? liveKey : key)
            return (
              <div key={key} className={`stage-node ${kind}${isOpen ? ' open' : ''}`} style={{ '--c': m.color }}>
                <button className="dot" onClick={kind === 'next' ? undefined : toggle} disabled={kind === 'next'}>{m.n}</button>
                <div className="stage-head">
                  <h2 role={kind === 'next' ? undefined : 'button'} tabIndex={kind === 'next' ? -1 : 0}
                    onClick={kind === 'next' ? undefined : toggle}
                    onKeyDown={(e) => { if (kind !== 'next' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle() } }}>
                    {m.label}
                  </h2>
                  <span className="when">
                    {isDone && `done${st.completedAt ? ' · ' + longDate(st.completedAt) : ''}`}
                    {isLive && !isDone && `${st.progressPct ?? 0}% · now`}
                    {kind === 'next' && (key === 'LAUNCH' && p.estLaunchAt ? `around ${longDate(p.estLaunchAt)}` : 'coming up')}
                  </span>
                </div>

                {isOpen ? (
                  <>
                    <div className="update" id={isLive ? 'reply' : undefined}>
                      {st.clientNote?.trim() ? (
                        <>
                          <div className="byline">
                            <span><b>{developer}</b>{st.startedAt ? ` · ${longDate(st.startedAt)}` : ''}</span>
                          </div>
                          <Prose source={st.clientNote} />
                        </>
                      ) : (
                        <div className="prose-empty">
                          {isLive ? `${developer} is working on this stage. An update will appear here.` : 'No update was written for this stage.'}
                        </div>
                      )}
                    </div>
                    <StageThread projectId={p.id} stageKey={key} counterpart={developer} />
                  </>
                ) : (
                  kind !== 'next' && (
                    <div className="recap">
                      {firstLine(st.clientNote) || <span style={{ fontStyle: 'italic' }}>No update for this stage.</span>}
                      <button onClick={toggle}>Read</button>
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}