import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, adaptMaintenanceBoard, dayLabel, dayOfWeek } from '../../lib/endpoints'
import { TopBar } from '../../components/Shell'
import CompleteVisit from '../../components/CompleteVisit'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * What's on the menu. Overdue first, then today, then the rest of the week
 * grouped by day.
 *
 * Overdue is the top of the page on purpose. With eighty clients on a
 * fortnightly rhythm you will fall behind, and the only question that matters is
 * which ones have been waiting longest — so the debt is the first thing you see,
 * sorted oldest first, not a number tucked in a corner.
 */
export default function Maintenance() {
  const [horizon, setHorizon] = useState(14)
  const { data, error, loading, reload } = useApi(EP.maintenanceBoard(horizon), { select: adaptMaintenanceBoard })
  const [completing, setCompleting] = useState(null)

  if (loading) return <><TopBar crumbs={[{ label: 'Maintenance' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Maintenance' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const { overdue, dueToday, thisWeek, later, activeSchedules } = data

  // Group the upcoming week by day so the page reads like a calendar.
  const byDay = thisWeek.reduce((acc, r) => {
    (acc[r.dueOn] ||= []).push(r)
    return acc
  }, {})

  const Row = ({ r, late }) => (
    <div className="mv-row">
      <div className="mv-main">
        <Link to={`/admin/projects/${r.projectId}`} className="mv-project">{r.projectName}</Link>
        <div className="mv-org">{r.orgName}</div>
      </div>
      <div className="mv-when">
        {late ? (
          <span className="mv-late mono">{r.daysLate}d late</span>
        ) : (
          <span className="mono" style={{ color: 'var(--mute)', fontSize: 11.5 }}>{dayLabel(r.dueOn)}</span>
        )}
        {r.missedCycles > 0 && <span className="mv-missed mono">{r.missedCycles} missed</span>}
      </div>
      <button className="btn btn-s sm" onClick={() => setCompleting(completing === r.visitId ? null : r.visitId)}>
        {completing === r.visitId ? 'Close' : 'Complete'}
      </button>
    </div>
  )

  return (
    <>
      <TopBar crumbs={[{ label: 'Maintenance' }]}>
        <div className="row" style={{ gap: 4 }}>
          {[7, 14, 30].map((h) => (
            <button key={h} className="btn btn-g sm" onClick={() => setHorizon(h)}
              style={horizon === h ? { color: 'var(--white)', borderColor: 'var(--ink-300)' } : {}}>{h}d</button>
          ))}
        </div>
      </TopBar>

      <div className="wrap wide">
        <div className="grid g3" style={{ gap: 12, marginBottom: 18 }}>
          <div className="card pad stat"><div className="stat-l">Behind</div><div className="stat-n mono" style={{ color: overdue.length ? 'var(--red)' : undefined }}>{overdue.length}</div></div>
          <div className="card pad stat"><div className="stat-l">Due today</div><div className="stat-n mono">{dueToday.length}</div></div>
          <div className="card pad stat"><div className="stat-l">On maintenance</div><div className="stat-n mono">{activeSchedules}</div></div>
        </div>

        {completing && (
          <div className="card pad" style={{ marginBottom: 18, borderColor: 'var(--em-line)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Complete visit</div>
            <CompleteVisit
              visit={{ id: completing }}
              projectName={[...overdue, ...dueToday, ...thisWeek, ...later].find((r) => r.visitId === completing)?.projectName}
              onDone={async () => { setCompleting(null); await reload() }}
              onCancel={() => setCompleting(null)}
            />
          </div>
        )}

        {overdue.length > 0 && (
          <div className="card pad mv-block overdue" style={{ marginBottom: 14 }}>
            <div className="spread" style={{ marginBottom: 10 }}>
              <div className="eyebrow" style={{ color: 'var(--red)' }}>Behind — oldest first</div>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--mute)' }}>{overdue.length}</span>
            </div>
            {overdue.map((r) => <Row key={r.visitId} r={r} late />)}
          </div>
        )}

        <div className="card pad mv-block" style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Due today · {dayLabel(data.today, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          {dueToday.length === 0 ? <div className="note mute">Nothing due today.</div> : dueToday.map((r) => <Row key={r.visitId} r={r} />)}
        </div>

        <div className="card pad mv-block">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Coming up</div>
          {Object.keys(byDay).length === 0 && later.length === 0 ? (
            <div className="note mute">Nothing scheduled in the next {horizon} days.</div>
          ) : (
            <>
              {Object.entries(byDay).map(([day, rows]) => (
                <div key={day} className="mv-day">
                  <div className="mv-day-head">
                    <span className="mv-dow mono">{dayOfWeek(day)}</span>
                    <span className="mv-date">{dayLabel(day)}</span>
                    <span className="mono mv-day-count">{rows.length}</span>
                  </div>
                  {rows.map((r) => <Row key={r.visitId} r={r} />)}
                </div>
              ))}
              {later.map((r) => <Row key={r.visitId} r={r} />)}
            </>
          )}
        </div>
      </div>
    </>
  )
}
