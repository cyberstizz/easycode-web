import { useEffect, useRef, useState } from 'react'
import ErrorNote from './ErrorNote'

/**
 * The one dialog in the app that destroys something.
 *
 * Three deliberate frictions, in increasing order of annoyance:
 *   1. it names what goes, with real counts fetched from the API
 *   2. you retype the client's name
 *   3. you retype your own password
 *
 * The password is verified server-side against your own hash, not compared here.
 * Nothing is sent until both fields are filled, so a stray Enter can't fire it.
 */
export default function ConfirmDelete({
  open,
  name,
  preview,
  previewLoading,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [alsoLeads, setAlsoLeads] = useState(false)
  const nameRef = useRef(null)

  // Reset every time it opens — a half-typed password must never survive a cancel.
  useEffect(() => {
    if (open) {
      setTyped(''); setPassword(''); setAlsoLeads(false)
      const t = setTimeout(() => nameRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    // Stop the page behind from scrolling under the scrim.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, busy, onCancel])

  if (!open) return null

  const nameMatches = typed.trim().toLowerCase() === (name || '').trim().toLowerCase()
  const canDelete = nameMatches && password.length > 0 && !busy

  const rows = preview
    ? [
        ['Projects', preview.projects],
        ['Requests and their messages', preview.requests],
        ['Files', preview.files],
        ['Invoices and payments', preview.invoices],
        ['Contacts', preview.contacts],
        ['Portal logins', preview.logins],
      ].filter(([, n]) => n > 0)
    : []

  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Delete ${name}`}>
        <div className="modal-head">
          <div className="modal-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.2">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <div>
            <div className="h3" style={{ color: 'var(--white)' }}>Delete {name}?</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>
              This cannot be undone. There is no trash and no restore.
            </div>
          </div>
        </div>

        <div className="modal-body">
          {previewLoading ? (
            <div className="note mute" style={{ marginBottom: 14 }}>Checking what this would remove…</div>
          ) : rows.length > 0 ? (
            <div className="modal-list">
              {rows.map(([label, n]) => (
                <div key={label} className="modal-list-row">
                  <span className="num" style={{ fontSize: 13, color: 'var(--red)' }}>{n}</span>
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="note mute" style={{ marginBottom: 14 }}>
              Nothing attached to this client yet — the record itself is all that goes.
            </div>
          )}

          {preview?.leads > 0 && (
            <label className="modal-check">
              <input
                type="checkbox"
                checked={alsoLeads}
                onChange={(e) => setAlsoLeads(e.target.checked)}
              />
              <span>
                Also delete the {preview.leads === 1 ? 'lead' : `${preview.leads} leads`} this client
                came from
                <i>
                  Leave this off for a real client — the lead is the only record of how the deal was
                  won. Turn it on for test data.
                </i>
              </span>
            </label>
          )}

          <div style={{ marginTop: 16 }}>
            <label className="lbl">
              Type <span className="mono" style={{ color: 'var(--white)' }}>{name}</span> to confirm
            </label>
            <input
              ref={nameRef}
              className="inp"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={name}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lbl">Your password</label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === 'Enter' && canDelete) onConfirm({ password, alsoLeads }) }}
            />
          </div>

          {error && <div style={{ marginTop: 14 }}><ErrorNote error={error} /></div>}
        </div>

        <div className="modal-foot">
          <button className="btn btn-g" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            className="btn btn-d"
            disabled={!canDelete}
            style={{ opacity: canDelete ? 1 : 0.45 }}
            onClick={() => onConfirm({ password, alsoLeads })}
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}