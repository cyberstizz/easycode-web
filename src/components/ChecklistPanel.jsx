import { useState } from 'react'
import { useApi } from '../lib/useApi'
import { get, post, patch } from '../lib/api'
import { EP, STAGES, STAGE_META, adaptChecklist } from '../lib/endpoints'
import { ago } from '../lib/format'
import ErrorNote from './ErrorNote'
import Loading from './Loading'

/**
 * The internal delivery checklist.
 *
 * Sits beside the story, never inside it. Ticking a line here does not move the
 * stage, the percentage, or anything the client sees — that separation is the
 * point of the feature. What it gives you is an answer to "where is this
 * actually at" and a way for another agent to pick the project up cold.
 *
 * Optimistic on toggle, because a checkbox that waits for a round trip feels
 * broken; the row reverts and shows the error if the write fails.
 */
export default function ChecklistPanel({ projectId, currentStage }) {
  const { data, error, loading, reload, setData } = useApi(
    projectId ? EP.projectChecklist(projectId) : null,
    { select: adaptChecklist },
  )
  const [openStage, setOpenStage] = useState(currentStage)
  const [noteFor, setNoteFor] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [rowError, setRowError] = useState(null)

  // Applying a template
  const [templates, setTemplates] = useState(null)
  const [applying, setApplying] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const loadTemplates = async () => {
    try { setTemplates((await get(EP.checklistTemplates()))?.items || []) }
    catch (e) { setRowError(e) }
  }

  const applyTemplate = async (projectType, replace) => {
    setApplying(true); setRowError(null)
    try {
      await post(EP.projectChecklist(projectId), { projectType, replace })
      await reload()
      setTemplates(null); setConfirmReplace(false)
    } catch (e) { setRowError(e) } finally { setApplying(false) }
  }

  const toggle = async (item) => {
    const next = !item.done
    setRowError(null)
    setData((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === item.id ? { ...i, done: next } : i)),
      done: d.done + (next ? 1 : -1),
      stages: d.stages.map((s) =>
        s.stageKey === item.stageKey ? { ...s, done: s.done + (next ? 1 : -1) } : s),
    }))
    try {
      await patch(EP.checklistItem(item.id), { done: next })
      await reload()
    } catch (e) {
      setRowError(e)
      await reload() // put the row back where the server says it is
    }
  }

  const saveNote = async (item) => {
    setRowError(null)
    try {
      await patch(EP.checklistItem(item.id), { note: noteDraft })
      setNoteFor(null); setNoteDraft('')
      await reload()
    } catch (e) { setRowError(e) }
  }

  if (loading) return <div className="card pad"><Loading /></div>
  if (error) return <div className="card pad"><ErrorNote error={error} onRetry={reload} /></div>

  const items = data?.items || []
  const stageCount = (key) => (data?.stages || []).find((s) => s.stageKey === key)

  // ── nothing applied yet ──────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="card pad chk">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Internal checklist</div>
        <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.55, marginBottom: 14 }}>
          Not started. Pick the checklist that matches this project — it's internal only
          and never changes what the client sees.
        </p>
        {rowError && <div style={{ marginBottom: 12 }}><ErrorNote error={rowError} /></div>}
        {templates === null ? (
          <button className="btn btn-s sm" onClick={loadTemplates}>Choose a checklist</button>
        ) : (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {templates.map((t) => (
              <button key={t.projectType} className="btn btn-s sm" disabled={applying}
                onClick={() => applyTemplate(t.projectType, false)}>
                {t.label} <span className="mono" style={{ opacity: .55, marginLeft: 6 }}>{t.itemCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0

  return (
    <div className="card pad chk">
      <div className="spread" style={{ marginBottom: 4 }}>
        <div className="eyebrow">Internal checklist</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--mute)' }}>
          {data.done} / {data.total}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14 }}>
        Never shown to the client. Ticking these does not move the tracker.
      </p>

      <div className="chk-bar"><div className="chk-bar-fill" style={{ width: `${pct}%` }} /></div>

      {rowError && <div style={{ margin: '12px 0' }}><ErrorNote error={rowError} /></div>}

      {STAGES.map((key) => {
        const c = stageCount(key)
        if (!c) return null
        const meta = STAGE_META[key]
        const open = openStage === key
        const complete = c.done === c.total
        return (
          <div key={key} className={`chk-stage${open ? ' open' : ''}`}>
            <button className="chk-stage-head" onClick={() => setOpenStage(open ? null : key)}>
              <span className="chk-dot" style={{ background: complete ? meta.color : 'var(--ink-200)' }} />
              <span className="chk-stage-name">{meta.label}</span>
              {key === currentStage && <span className="chk-now">now</span>}
              <span className="mono chk-count">{c.done}/{c.total}</span>
            </button>

            {open && (
              <div className="chk-items">
                {items.filter((i) => i.stageKey === key).map((item) => (
                  <div key={item.id} className={`chk-item${item.done ? ' done' : ''}`}>
                    <button className="chk-box" onClick={() => toggle(item)}
                      aria-label={item.done ? 'Mark not done' : 'Mark done'}>
                      {item.done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                          <path d="M4 12.5 9.5 18 20 6.5" />
                        </svg>
                      )}
                    </button>
                    <div className="chk-body">
                      <div className={`chk-title${item.emphasis ? ' em' : ''}`}>{item.title}</div>
                      {item.guidance && <div className="chk-guide">{item.guidance}</div>}

                      {item.done && item.doneByName && (
                        <div className="chk-meta">{item.doneByName} · {ago(item.doneAt)}</div>
                      )}

                      {noteFor === item.id ? (
                        <div className="chk-note-edit">
                          <textarea value={noteDraft} autoFocus
                            placeholder="What was done, links, decisions, anything the next person needs."
                            onChange={(e) => setNoteDraft(e.target.value)}
                            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote(item) }} />
                          <div className="row" style={{ gap: 8, marginTop: 8 }}>
                            <button className="btn btn-p sm" onClick={() => saveNote(item)}>Save note</button>
                            <button className="btn btn-g sm" onClick={() => { setNoteFor(null); setNoteDraft('') }}>Cancel</button>
                          </div>
                        </div>
                      ) : item.note ? (
                        <button className="chk-note"
                          onClick={() => { setNoteFor(item.id); setNoteDraft(item.note) }}>
                          {item.note}
                        </button>
                      ) : (
                        <button className="chk-add-note"
                          onClick={() => { setNoteFor(item.id); setNoteDraft('') }}>
                          Add note
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="chk-foot">
        {confirmReplace ? (
          <>
            <span>Replacing discards every tick and note on this project.</span>
            <button className="btn btn-g sm" onClick={() => { setConfirmReplace(false); setTemplates(null) }}>Cancel</button>
            {(templates || []).map((t) => (
              <button key={t.projectType} className="btn btn-d sm" disabled={applying}
                onClick={() => applyTemplate(t.projectType, true)}>
                Replace with {t.label}
              </button>
            ))}
          </>
        ) : (
          <button className="chk-swap" onClick={async () => { await loadTemplates(); setConfirmReplace(true) }}>
            Swap checklist
          </button>
        )}
      </div>
    </div>
  )
}