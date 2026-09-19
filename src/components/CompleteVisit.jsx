import { useState } from 'react'
import { post } from '../lib/api'
import { EP } from '../lib/endpoints'
import Prose from '../lib/markdown'
import ErrorNote from './ErrorNote'

/**
 * Marking a maintenance visit done.
 *
 * The client report is required, and that's deliberate: the report IS the
 * product of a maintenance visit. A completed visit with no report is a charge
 * with nothing to show for it, which is the thing that makes a client cancel.
 */
export default function CompleteVisit({ visit, projectName, onDone, onCancel }) {
  const [report, setReport] = useState('')
  const [internal, setInternal] = useState('')
  const [tab, setTab] = useState('write')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!report.trim() || busy) return
    setBusy(true); setError(null)
    try {
      await post(EP.completeVisit(visit.id), { clientReport: report.trim(), internalNote: internal.trim() || null })
      onDone?.()
    } catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="mv-complete">
      <div className="editor" style={{ maxWidth: '100%' }}>
        <div className="tabs">
          <button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Write</button>
          <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button>
          <span className="hint">The client reads this. Headings, lists and links render.</span>
        </div>
        {tab === 'write' ? (
          <textarea
            value={report}
            autoFocus
            style={{ minHeight: 150 }}
            placeholder={`What you checked and what you changed on ${projectName || 'the site'}.\n\n- Updated plugins and dependencies\n- Checked forms and the booking flow\n- Compressed three new gallery photos\n\nEverything looks healthy.`}
            onChange={(e) => setReport(e.target.value)}
          />
        ) : (
          <div className="preview" style={{ minHeight: 150 }}>
            {report.trim() ? <Prose source={report} /> : <div className="prose-empty">Nothing written yet.</div>}
          </div>
        )}
      </div>

      <div className="internal" style={{ maxWidth: '100%' }}>
        <label>Internal note — never shown to the client</label>
        <textarea value={internal} placeholder="Anything to remember next cycle." onChange={(e) => setInternal(e.target.value)} />
      </div>

      {error && <div style={{ marginTop: 12 }}><ErrorNote error={error} /></div>}

      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-p sm" onClick={submit} disabled={!report.trim() || busy}>
          {busy ? 'Saving…' : 'Mark done and send the report'}
        </button>
        {onCancel && <button className="btn btn-g sm" onClick={onCancel} disabled={busy}>Cancel</button>}
        <span style={{ fontSize: 12, color: 'var(--mute)' }}>Emails the client and schedules the next visit.</span>
      </div>
    </div>
  )
}
