import { useApi } from '../../lib/useApi'
import { EP, STAGES, STAGE_META } from '../../lib/endpoints'
import { longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import StageRail from '../../components/StageRail'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import Chip from '../../components/Chip'

export default function Project() {
  const { data: list, error, loading, reload } = useApi(EP.projects())
  const p = list?.items?.[0]

  if (loading) return <><TopBar crumbs={[{ label: 'Project' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Project' }]} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  const byKey = Object.fromEntries((p?.stages || []).map((s) => [s.stageKey, s]))
  const liveIdx = STAGES.indexOf(p?.currentStage)

  return (
    <>
      <TopBar crumbs={[{ label: 'Overview', to: '/portal' }, { label: p?.name || 'Project' }]}>
        {p?.previewUrl && (
          <a href={p.previewUrl} target="_blank" rel="noreferrer" className="btn btn-s sm" style={{ textDecoration: 'none' }}>
            Preview site ↗
          </a>
        )}
      </TopBar>

      <div className="wrap">
        <div className="spread" style={{ marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="row" style={{ gap: 9, marginBottom: 7 }}>
              <Chip tone="c-prog" live>
                In {STAGE_META[p?.currentStage]?.label?.toLowerCase() || 'progress'}
              </Chip>
              <span className="eyebrow">{p?.projectType}</span>
            </div>
            <h1 className="h1">{p?.name}</h1>
          </div>
          <div className="row" style={{ gap: 26 }}>
            <dl className="kv"><dt>Started</dt><dd className="mono" style={{ fontSize: 13 }}>{longDate(p?.startedOn)}</dd></dl>
            <dl className="kv">
              <dt>Est. launch</dt>
              <dd className="mono" style={{ fontSize: 13, color: 'var(--em-hi)' }}>{longDate(p?.estLaunchOn)}</dd>
            </dl>
          </div>
        </div>

        <StageRail stages={p?.stages} currentStage={p?.currentStage} title="Build progress" />

        <div className="sect-head"><span className="eyebrow">Stage by stage</span><span className="rule" /></div>

        <div className="stack">
          {STAGES.map((key) => {
            const meta = STAGE_META[key]
            const s = byKey[key] || { status: 'PENDING', progressPct: 0 }
            const isLive = s.status === 'IN_PROGRESS'
            const isDone = s.status === 'COMPLETE'
            const upcoming = !isLive && !isDone
            return (
              <div key={key} className={`card pad${isLive ? ' glow' : ''}`}
                style={upcoming ? { opacity: 0.5 } : undefined}>
                <div className="row" style={{ gap: 13, marginBottom: isLive ? 14 : 0 }}>
                  <span className="mono" style={{
                    fontSize: 11, fontWeight: 700,
                    color: upcoming ? 'var(--ink-400)' : meta.color,
                  }}>{meta.n}</span>
                  <div style={{ flex: 1 }}>
                    <div className="h3" style={upcoming ? { color: 'var(--mute)' } : undefined}>{meta.label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
                      {s.clientNote || '—'}
                    </div>
                  </div>
                  {isLive && <Chip tone="c-prog" live>{s.progressPct}%</Chip>}
                  {isDone && <Chip tone="c-done">Complete</Chip>}
                  {(isDone || isLive) && s.assetCount > 0 && (
                    <button className="btn btn-g sm">{s.assetCount} files</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
