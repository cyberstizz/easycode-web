import { useState } from 'react'
import { useApi } from '../lib/useApi'
import { put } from '../lib/api'
import { EP, adaptProjectMaintenance, dayLabel } from '../lib/endpoints'
import { dateTime } from '../lib/format'
import Prose from '../lib/markdown'
import CompleteVisit from './CompleteVisit'
import Loading from './Loading'
import ErrorNote from './ErrorNote'

/**
 * Maintenance for one project, inside the editor.
 *
 * Set the rhythm, see the next visit, complete it, read what was reported
 * before. The client sees none of this except the reports, and only after the
 * fact — so nothing here leaks a date.
 */
export default function MaintenancePanel({ projectId, projectName }) {
  const { data, error, loading, reload } = useApi(
    projectId ? EP.projectMaintenance(projectId) : null,
    { select: adaptProjectMaintenance },
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ cadenceDays: 14, anchorOn: '', active: true })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [openReport, setOpenReport] = useState(null)

  if (loading) return <div className="card pad"><Loading /></div>
  if (error) return <div className="card pad"><ErrorNote error={error} onRetry={reload} /></div>

  const { schedule, open, history } = data
  const todayYmd = new Date().toLocaleDateString('en-CA')  // YYYY-MM-DD, local
  const late = open && open.dueOn < todayYmd

  const startEdit = () => {
    setDraft({
      cadenceDays: schedule?.cadenceDays ?? 14,
      anchorOn: schedule?.anchorOn ?? todayYmd,
      active: schedule?.active ?? true,
    })
    setSaveError(null); setEditing(true)
  }

  const save = async () => {
    setSaving(true); setSaveError(null)
    try {
      await put(EP.projectMaintenance(projectId), {
        cadenceDays: Number(draft.cadenceDays) || 14,
        anchorOn: draft.anchorOn || todayYmd,
        active: draft.active,
      })
      setEditing(false)
      await reload()
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  return (
    <div className="card pad chk" style={{ marginTop: 14 }}>
      <div className="spread" style={{ marginBottom: 4 }}>
        <div className="eyebrow">Maintenance</div>
        {schedule?.active && <span className="mono" style={{ fontSize: 12, color: 'var(--mute)' }}>every {schedule.cadenceDays}d</span>}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14 }}>
        The client never sees the schedule — only the report, after each visit.
      </p>

      {saveError && <div style={{ marginBottom: 12 }}><ErrorNote error={saveError} /></div>}

      {editing ? (
        <div className="grid g3" style={{ gap: 10, alignItems: 'end' }}>
          <div>
            <label className="lbl">Every</label>
            <div className="row" style={{ gap: 6, alignItems: 'center' }}>
              <input className="inp mono" type="number" min="1" max="365" value={draft.cadenceDays}
                onChange={(e) => setDraft({ ...draft, cadenceDays: e.target.value })} style={{ width: 72 }} />
              <span style={{ fontSize: 13, color: 'var(--mute)' }}>days</span>
            </div>
          </div>
          <div>
            <label className="lbl">Starting from</label>
            <input className="inp mono" type="date" value={draft.anchorOn}
              onChange={(e) => setDraft({ ...draft, anchorOn: e.target.value })} />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-p sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-g sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
        </div>
      ) : !schedule ? (
        <div>
          <div className="note mute" style={{ marginBottom: 12 }}>
            No rhythm set. It starts automatically when their plan goes active, or set it now.
          </div>
          <button className="btn btn-s sm" onClick={startEdit}>Set a maintenance rhythm</button>
        </div>
      ) : (
        <>
          <div className={`mv-next${late ? ' late' : ''}`}>
            <div>
              <div className="mv-next-label">{!schedule.active ? 'Paused' : late ? 'Overdue' : 'Next visit'}</div>
              <div className="mv-next-date mono">
                {!schedule.active ? '—' : open ? dayLabel(open.dueOn, { weekday: 'short', month: 'short', day: 'numeric' }) : 'none scheduled'}
              </div>
              {late && <div className="mv-next-sub">Due {dayLabel(open.dueOn)} — do it when you can, the rhythm holds.</div>}
              {open?.missedCycles > 0 && <div className="mv-next-sub">{open.missedCycles} cycle{open.missedCycles > 1 ? 's' : ''} skipped to get here.</div>}
            </div>
            <div className="row" style={{ gap: 8 }}>
              {schedule.active && open && (
                <button className="btn btn-p sm" onClick={() => setCompleting((c) => !c)}>{completing ? 'Close' : 'Complete visit'}</button>
              )}
              <button className="btn btn-g sm" onClick={startEdit}>Edit</button>
            </div>
          </div>

          {completing && open && (
            <div style={{ marginTop: 14 }}>
              <CompleteVisit visit={open} projectName={projectName}
                onDone={async () => { setCompleting(false); await reload() }}
                onCancel={() => setCompleting(false)} />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Past visits</div>
            {history.length === 0 ? (
              <div className="note mute">None yet.</div>
            ) : history.map((h) => (
              <div key={h.id} className="mv-past">
                <button className="mv-past-head" onClick={() => setOpenReport(openReport === h.id ? null : h.id)}>
                  <span className="mono mv-past-date">{dayLabel(h.dueOn)}</span>
                  <span className="mv-past-by">{h.completedByName}</span>
                  <span className="mono mv-past-when">{dateTime(h.completedAt)}</span>
                </button>
                {openReport === h.id && (
                  <div className="mv-past-body">
                    <Prose source={h.clientReport} />
                    {h.internalNote && <div className="internal" style={{ marginTop: 12 }}>
                      <label>Internal</label>
                      <div style={{ fontSize: 13, color: 'var(--mute-hi)' }}>{h.internalNote}</div>
                    </div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
