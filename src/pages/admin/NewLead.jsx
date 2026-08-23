import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { post } from '../../lib/api'
import { EP, LEAD_SOURCE } from '../../lib/endpoints'
import { TopBar } from '../../components/Shell'
import ErrorNote from '../../components/ErrorNote'

/**
 * Deliberately short. Six fields, two of them required. A long intake form is
 * why nobody adds leads — and a lead you didn't add is one you'll never call.
 * Everything else gets filled in by the first logged call.
 */
export default function NewLead() {
  const nav = useNavigate()
  const [f, setF] = useState({
    contactName: '', businessName: '', phone: '', email: '',
    source: 'COLD_CALL', roleTitle: '', city: '', notes: '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }))
  // businessName is @NotBlank server-side; contactName is optional.
  const canSave = f.businessName.trim() && !saving

  const save = async (andAnother = false) => {
    setSaving(true); setError(null)
    try {
      const created = await post(EP.adminLeads(), { ...f, status: 'NEW' })

      if (andAnother) {
        setF({ contactName: '', businessName: '', phone: '', email: '',
          source: f.source, roleTitle: '', city: '', notes: '' })
        setSaving(false)
        return
      }

      // The backend's create response shape isn't pinned down yet — it may be
      // the record, a {data:...} wrapper, or a 201 with no body at all. Pull an
      // id out of whatever came back; if there isn't one, the lead still saved,
      // so go to the pipeline rather than navigating to /leads/undefined.
      const newId = created?.id ?? created?.leadId ?? created?.data?.id
      if (newId) {
        nav(`/admin/leads/${newId}`)
      } else {
        console.warn('[EasyCode] Lead created but no id in the response:', created)
        nav('/admin/pipeline')
      }
    } catch (e) { setError(e); setSaving(false) }
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Pipeline', to: '/admin/pipeline' }, { label: 'Add a lead' }]}>
        <Link to="/admin/pipeline" className="btn btn-g sm" style={{ textDecoration: 'none' }}>Cancel</Link>
      </TopBar>

      <div className="wrap" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 className="h1">Add a lead</h1>
          <p className="sub">The business name is all that's required to start. The rest fills in as you call.</p>
        </div>

        <form className="card pad" onSubmit={(e) => { e.preventDefault(); save(false) }}>
          <div className="grid g2" style={{ marginBottom: 14 }}>
            <div>
              <label className="lbl" htmlFor="cn">Business *</label>
              <input id="cn" className="inp" required autoFocus placeholder="Crown Heights Realty"
                value={f.businessName} onChange={set('businessName')} />
            </div>
            <div>
              <label className="lbl" htmlFor="ph">Phone</label>
              <input id="ph" className="inp mono" type="tel" placeholder="(718) 555-0192"
                value={f.phone} onChange={set('phone')} />
            </div>
          </div>

          <div className="grid g2" style={{ marginBottom: 14 }}>
            <div>
              <label className="lbl" htmlFor="bn">Their name</label>
              <input id="bn" className="inp" placeholder="Denise Whitaker"
                value={f.contactName} onChange={set('contactName')} />
            </div>
            <div>
              <label className="lbl" htmlFor="em">Email</label>
              <input id="em" className="inp" type="email" placeholder="denise@chrealty.com"
                value={f.email} onChange={set('email')} />
            </div>
          </div>

          <div className="grid g3" style={{ marginBottom: 14 }}>
            <div>
              <label className="lbl" htmlFor="rt">Their role</label>
              <input id="rt" className="inp" placeholder="Owner, broker…" value={f.roleTitle} onChange={set('roleTitle')} />
            </div>
            <div>
              <label className="lbl" htmlFor="ct">Where</label>
              <input id="ct" className="inp" placeholder="Brooklyn NY" value={f.city} onChange={set('city')} />
            </div>
            <div>
              <label className="lbl" htmlFor="sr">How you found them</label>
              <select id="sr" className="inp" value={f.source} onChange={set('source')}>
                {Object.entries(LEAD_SOURCE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="lbl" htmlFor="nt">Anything worth knowing before you dial</label>
            <textarea id="nt" className="inp" rows={2} style={{ resize: 'vertical' }}
              placeholder="Referred by Marcus. Best before 11 AM."
              value={f.notes} onChange={set('notes')} />
          </div>

          {error && <div style={{ marginTop: 14 }}><ErrorNote error={error} /></div>}

          <div className="hr" />
          <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--mute)' }}>
              Lands in <b style={{ color: 'var(--text)' }}>New</b>, and on Today under never-contacted.
            </span>
            <div className="row" style={{ gap: 9 }}>
              <button type="button" className="btn btn-s" disabled={!canSave}
                onClick={() => save(true)} style={{ opacity: canSave ? 1 : 0.5 }}>
                Save and add another
              </button>
              <button type="submit" className="btn btn-p" disabled={!canSave}
                style={{ opacity: canSave ? 1 : 0.5 }}>
                {saving ? 'Saving…' : 'Save lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}