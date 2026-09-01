import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { patch, post } from '../../lib/api'
import { EP, STAGES, STAGE_META, STAGE_STATUS, adaptAssets, isImage } from '../../lib/endpoints'
import { longDate, bytes } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import StageRail from '../../components/StageRail'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import Chip from '../../components/Chip'

const isoDay = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

/**
 * The date input gives back 'YYYY-MM-DD'. ProjectUpdate.estLaunchAt is a Java
 * Instant, which needs a full ISO timestamp with a zone — a bare day string
 * throws in Jackson before the controller runs. Noon UTC so the day doesn't
 * roll backwards when it's rendered in a western timezone.
 */
const dayToInstant = (day) =>
  day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00.000Z`).toISOString() : null

export default function ProjectEditor() {
  const { id } = useParams()
  const { data: project, error, loading, reload, setData } = useApi(EP.project(id))
  const assets = useApi(EP.assets(`?projectId=${id}`), { select: adaptAssets })

  const [stageKey, setStageKey] = useState(null)
  const [form, setForm] = useState({ progressPct: 0, clientNote: '', internalNote: '' })
  const [meta, setMeta] = useState({ estLaunchOn: '', previewUrl: '', liveUrl: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const active = stageKey || project?.currentStage
  const stage = (project?.stages || []).find((s) => s.stageKey === active)

  useEffect(() => {
    if (stage) setForm({
      progressPct: stage.progressPct ?? 0,
      clientNote: stage.clientNote || '',
      internalNote: stage.internalNote || '',
    })
  }, [stage?.stageKey])

  useEffect(() => {
    if (project) setMeta({
      estLaunchOn: isoDay(project.estLaunchAt),
      previewUrl: project.previewUrl || '',
      liveUrl: project.liveUrl || '',
    })
  }, [project?.id])

  if (loading) return <><TopBar crumbs={[{ label: 'Projects', to: '/admin/projects' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Projects', to: '/admin/projects' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const idx = STAGES.indexOf(project.currentStage)
  const next = STAGES[idx + 1]

  const save = async () => {
    setSaving(true); setSaveError(null); setSaved(false)
    try {
      await patch(EP.adminProjectStage(id, active), {
        progressPct: Number(form.progressPct),
        clientNote: form.clientNote,
        internalNote: form.internalNote,
        status: Number(form.progressPct) >= 100 ? STAGE_STATUS.COMPLETE : STAGE_STATUS.ACTIVE,
      })
      await patch(EP.adminProjects() + `/${id}`, {
        estLaunchAt: dayToInstant(meta.estLaunchOn),
        previewUrl: meta.previewUrl || null,
        liveUrl: meta.liveUrl || null,
      })
      setData((p) => ({
        ...p, ...meta,
        stages: p.stages.map((s) => s.stageKey === active ? { ...s, ...form } : s),
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  const advance = async () => {
    if (!next) return
    setSaving(true); setSaveError(null)
    try {
      const updated = await post(EP.adminProjectAdvance(id))
      setData((p) => ({ ...p, ...updated }))
      setStageKey(null)
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  const toggleVisibility = async (asset) => {
    const to = asset.visibility === 'CLIENT' ? 'INTERNAL' : 'CLIENT'
    try {
      await patch(EP.adminAsset(asset.id), { visibility: to })
      assets.setData((d) => ({ ...d, items: d.items.map((a) => a.id === asset.id ? { ...a, visibility: to } : a) }))
    } catch (e) { setSaveError(e) }
  }

  const files = assets.data?.items || []

  return (
    <>
      <TopBar crumbs={[
        ...(project.orgName ? [{ label: project.orgName, to: `/admin/clients/${project.orgId}` }] : []),
        { label: project.name },
      ]}>
        <Link to="/portal/project" className="btn btn-g sm" style={{ textDecoration: 'none' }}>View as client ↗</Link>
        <button className="btn btn-p sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </TopBar>

      <div className="wrap wide">
        <div className="spread" style={{ marginBottom: 18, alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="eyebrow">Project editor</div>
            <h1 className="h1" style={{ marginTop: 6 }}>{project.name}</h1>
          </div>
          <div className="note amber" style={{ maxWidth: 400, fontSize: 12.5, padding: '9px 12px' }}>
            Your client sees every change here the moment you save. Nothing is staged.
          </div>
        </div>

        {saveError && <div style={{ marginBottom: 16 }}><ErrorNote error={saveError} /></div>}

        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="spread" style={{ marginBottom: 16 }}>
            <span className="eyebrow">Stage control</span>
            {next && (
              <button className="btn btn-p sm" onClick={advance} disabled={saving}>
                Advance to {STAGE_META[next].label} →
              </button>
            )}
          </div>

          <StageRail stages={project.stages} currentStage={project.currentStage} bare />

          {/* Pick any stage to edit, not just the live one — you often need to
              fix a note on a stage that already closed. */}
          <div className="row" style={{ gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
            {STAGES.map((k) => (
              <button key={k} onClick={() => setStageKey(k)}
                className={`chip ${k === active ? 'c-prog' : 'c-done'}`} style={{ cursor: 'pointer' }}>
                {STAGE_META[k].n} {STAGE_META[k].label}
              </button>
            ))}
          </div>

          <div className="hr" />

          <div className="grid g3">
            <div>
              <label className="lbl">{STAGE_META[active]?.label} progress</label>
              <div className="row" style={{ gap: 10 }}>
                <input className="inp mono" style={{ width: 66, textAlign: 'center' }} type="number" min="0" max="100"
                  value={form.progressPct} onChange={(e) => setForm((f) => ({ ...f, progressPct: e.target.value }))} />
                <span style={{ fontSize: 13, color: 'var(--mute)' }}>%</span>
                <div style={{ flex: 1, height: 6, background: 'var(--ink-200)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, form.progressPct)}%`, height: '100%', background: STAGE_META[active]?.color, borderRadius: 3 }} />
                </div>
              </div>
            </div>
            <div>
              <label className="lbl">Est. launch date</label>
              <input type="date" className="inp mono" value={meta.estLaunchOn}
                onChange={(e) => setMeta((m) => ({ ...m, estLaunchOn: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Preview URL</label>
              <input className="inp mono" style={{ fontSize: 12 }} value={meta.previewUrl}
                onChange={(e) => setMeta((m) => ({ ...m, previewUrl: e.target.value }))} />
            </div>
          </div>

          <div className="grid g2" style={{ marginTop: 16 }}>
            <div>
              <label className="lbl">What the client reads on this stage</label>
              <textarea className="inp" rows={3} style={{ resize: 'vertical' }}
                value={form.clientNote} onChange={(e) => setForm((f) => ({ ...f, clientNote: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">
                Internal note <span style={{ color: 'var(--amber)' }}>· never shown to the client</span>
              </label>
              <textarea className="inp" rows={3} style={{ resize: 'vertical', borderColor: 'rgba(245,158,11,.25)' }}
                value={form.internalNote} onChange={(e) => setForm((f) => ({ ...f, internalNote: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card pad">
          <div className="spread" style={{ marginBottom: 15 }}>
            <div>
              <span className="eyebrow">Files on this project</span>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 4 }}>
                Toggle a file on to publish it to the client's portal. Off means internal only.
              </div>
            </div>
            <button className="btn btn-s sm">Upload</button>
          </div>

          {assets.loading && <Loading />}
          {files.length === 0 && !assets.loading && (
            <div className="note mute">No files on this project yet.</div>
          )}

          {files.length > 0 && (
            <table className="tbl">
              <thead>
                <tr><th>File</th><th>Caption</th><th>Size</th><th>Added</th><th style={{ textAlign: 'right' }}>Client can see</th></tr>
              </thead>
              <tbody>
                {files.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="row" style={{ gap: 9 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke={isImage(a.mime) ? 'var(--violet)' : 'var(--mute)'} strokeWidth="2">
                          {isImage(a.mime)
                            ? <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>
                            : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>}
                        </svg>
                        <span style={{ fontWeight: 600, color: 'var(--white)' }}>{a.filename}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--mute)', fontSize: 12 }}>{a.caption || '—'}</td>
                    <td className="mono" style={{ color: 'var(--mute)' }}>{bytes(a.bytes)}</td>
                    <td className="mono" style={{ color: 'var(--mute)' }}>{longDate(a.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={`toggle${a.visibility === 'CLIENT' ? ' on' : ''}`}
                        style={{ display: 'inline-flex' }} onClick={() => toggleVisibility(a)}>
                        <i />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}