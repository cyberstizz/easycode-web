import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, STAGES, STAGE_META, adaptList } from '../../lib/endpoints'
import { longDate, daysUntil } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import { MiniRail } from '../../components/StageRail'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'
import Chip from '../../components/Chip'

export default function Projects() {
  // /v1/admin/projects is POST-only; the list lives at /v1/projects.
  const { data, error, loading, reload } = useApi(EP.projects(), { select: adaptList })
  const [stage, setStage] = useState('all')

  const all = data?.items || []
  const rows = all.filter((p) => stage === 'all' || p.currentStage === stage)

  return (
    <>
      <TopBar crumbs={[{ label: 'Projects' }]}>
        <Link to="/admin/clients" className="btn btn-s sm" style={{ textDecoration: 'none' }}>Clients</Link>
      </TopBar>

      <div className="wrap wide">
        <div style={{ marginBottom: 20 }}>
          <h1 className="h1">Projects</h1>
          <p className="sub">
            {all.length === 0
              ? 'Projects are created when you convert a lead.'
              : 'Every build in flight. Open one to move its stage or publish a file.'}
          </p>
        </div>

        {loading && <Loading full />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && all.length === 0 && (
          <EmptyState
            title="No projects yet"
            body="Converting a lead creates the project and its six stages automatically."
            action={<Link to="/admin/pipeline" className="btn btn-p sm" style={{ textDecoration: 'none' }}>Open pipeline</Link>}
          />
        )}

        {all.length > 0 && (
          <>
            <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <button className={`chip ${stage === 'all' ? 'c-prog' : 'c-done'}`}
                style={{ cursor: 'pointer' }} onClick={() => setStage('all')}>
                All · {all.length}
              </button>
              {STAGES.map((k) => {
                const n = all.filter((p) => p.currentStage === k).length
                if (!n) return null
                return (
                  <button key={k} className={`chip ${stage === k ? 'c-prog' : 'c-done'}`}
                    style={{ cursor: 'pointer' }} onClick={() => setStage(k)}>
                    {STAGE_META[k].label} · {n}
                  </button>
                )
              })}
            </div>

            <div className="stack tight">
              {rows.map((p) => {
                const live = (p.stages || []).find((s) => s.stageKey === p.currentStage)
                const pct = live?.progressPct
                const late = p.estLaunchAt && daysUntil(p.estLaunchAt) < 0 && p.currentStage !== 'MAINTENANCE'
                return (
                  <Link key={p.id} to={`/admin/projects/${p.id}`} className="card pad"
                    style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="spread" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="h3">{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                          {[p.orgName, p.type].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
                        {p.estLaunchAt && (
                          <span className="mono" style={{ fontSize: 11.5, color: late ? 'var(--red)' : 'var(--mute)' }}>
                            {late ? 'past due · ' : 'launch '}{longDate(p.estLaunchAt)}
                          </span>
                        )}
                        <Chip tone="c-prog" live>
                          {STAGE_META[p.currentStage]?.label}{pct != null ? ` ${pct}%` : ''}
                        </Chip>
                      </div>
                    </div>
                    <MiniRail stages={p.stages} currentStage={p.currentStage} position={p.currentStagePosition} />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}