import { STAGES, STAGE_META, STAGE_STATUS } from '../lib/endpoints'
import { shortDate } from '../lib/format'

/**
 * The signature element. Six butted segments; completed stages fill solid in
 * their own color, the live one carries an animated fill with a pulsing head.
 *
 * Takes the backend's `stages` array straight off GET /v1/projects/{id}.
 * Missing stages are rendered as PENDING rather than dropped — a project must
 * always show all six, even if the backend hasn't created a row yet.
 */
export default function StageRail({ stages = [], currentStage, title, subtitle, readout, footer, bare = false }) {
  const byKey = Object.fromEntries(stages.map((s) => [s.stageKey ?? s.key, s]))
  const liveIndex = Math.max(0, STAGES.indexOf(currentStage))
  const live = byKey[currentStage]

  const Track = (
    <div className="rg-track">
      {STAGES.map((key) => {
        const meta = STAGE_META[key]
        const s = byKey[key] || { status: 'PENDING', progressPct: 0 }
        const isDone = s.status === STAGE_STATUS.COMPLETE
        const isLive = s.status === STAGE_STATUS.ACTIVE || (key === currentStage && !isDone)
        const cls = isDone ? 'done' : isLive ? 'live' : ''

        const when = isDone ? shortDate(s.completedAt)
          : isLive ? 'in progress'
          : s.dueOn ? shortDate(s.dueOn)
          : key === 'MAINTENANCE' ? 'ongoing' : '—'

        return (
          <div key={key} className={`seg-cell ${cls}`}
            style={{ '--sc': meta.color, '--p': `${s.progressPct ?? 0}%` }}>
            <div className="seg-bar">
              {isLive && <div className="seg-fill" />}
              <span className="seg-num">{meta.n}</span>
            </div>
            <div className="seg-meta">
              <span className="seg-name">{meta.label}</span>
              <span className="seg-date">{when}</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  if (bare) return Track

  return (
    <div className="rail-gauge" style={{ '--sweep': `${(liveIndex + 0.5) / 6 * 100}%` }}>
      {(title || readout) && (
        <div className="rg-head">
          {title && (
            <div>
              <div className="h2" style={{ fontSize: 15 }}>{title}</div>
              {subtitle && <div className="eyebrow" style={{ marginTop: 4 }}>{subtitle}</div>}
            </div>
          )}
          {readout ?? (
            <div className="rg-read">
              stage {liveIndex + 1} of 6{live?.progressPct != null && <> · <b>{live.progressPct}%</b></>}
            </div>
          )}
        </div>
      )}
      {Track}
      {footer && <div className="rg-foot">{footer}</div>}
    </div>
  )
}

/** Compact six-tick version for list rows and cards. */
export function MiniRail({ stages = [], currentStage, position }) {
  const byKey = Object.fromEntries(stages.map((s) => [s.stageKey ?? s.key, s]))
  // List endpoints return projects without their stages, so derive completion
  // from the current stage's index when the array is empty.
  const idx = position ?? STAGES.indexOf(currentStage)
  return (
    <div className="mini-rail">
      {STAGES.map((k, i) => {
        const s = byKey[k]
        const done = s ? s.status === 'COMPLETE' : i < idx
        const cls = done ? 'f' : k === currentStage ? 'a' : ''
        return <i key={k} className={cls} />
      })}
    </div>
  )
}