import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { patch, post } from '../../lib/api'
import { EP, STAGES, STAGE_META, STAGE_STATUS, adaptProject, adaptAssets, isImage } from '../../lib/endpoints'
import Prose, { firstLine } from '../../lib/markdown'
import StageThread from '../../components/StageThread'
import { useAuth } from '../../auth/AuthProvider'
import { ago } from '../../lib/format'
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
  const { data: project, error, loading, reload, setData } = useApi(EP.project(id), { select: adaptProject })
  const assets = useApi(EP.assets(`?projectId=${id}`), { select: adaptAssets })

  const [stageKey, setStageKey] = useState(null)
  const [form, setForm] = useState({ progressPct: 0, clientNote: '', internalNote: '' })
  const [meta, setMeta] = useState({ estLaunchOn: '', previewUrl: '', liveUrl: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('write')
  const [clientRead, setClientRead] = useState(null)
  const { user } = useAuth()

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
      // Refetch instead of patching local state optimistically. An optimistic
      // update shows you what the app hoped happened; a reload shows what the
      // database actually holds. When those two disagree — which is exactly the
      // failure that hid this bug — you want to see the disagreement.
      await reload()
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

  const contactName = project.orgName || 'your client'
  const live = (project.stages || []).find((s) => s.stageKey === project.currentStage)
  const activeMeta = STAGE_META[active] || {}

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
        <div className="proj-head">
          <div>
            <h1>{project.name}</h1>
            <div className="sub">
              In {STAGE_META[project.currentStage]?.label?.toLowerCase()}
              {live && <> · <b>{live.progressPct ?? 0}%</b></>}
              {project.estLaunchAt && <> · launch <b>{longDate(project.estLaunchAt)}</b></>}
              {clientRead && <> · {contactName} last read this <b>{ago(clientRead)}</b></>}
            </div>
          </div>
          {next && (
            <button className="btn btn-s push" onClick={advance} disabled={saving}>
              Advance to {STAGE_META[next].label}
            </button>
          )}
        </div>

        {saveError && <div style={{ marginBottom: 16 }}><ErrorNote error={saveError} /></div>}

        <StageRail stages={project.stages} currentStage={project.currentStage} bare />

        <div className="ctl-strip" style={{ '--c': activeMeta.color }}>
          <div className="ctl">
            <label>{activeMeta.label} progress</label>
            <div className="pct">
              <input type="range" min="0" max="100" value={form.progressPct}
                onChange={(e) => setForm((f) => ({ ...f, progressPct: e.target.value }))} />
              <input className="inp mono" type="number" min="0" max="100" value={form.progressPct}
                onChange={(e) => setForm((f) => ({ ...f, progressPct: e.target.value }))} />
            </div>
          </div>
          <div className="ctl">
            <label>Estimated launch</label>
            <input type="date" className="inp mono" value={meta.estLaunchOn}
              onChange={(e) => setMeta((m) => ({ ...m, estLaunchOn: e.target.value }))} />
          </div>
          <div className="ctl">
            <label>Preview link</label>
            <input className="inp mono" style={{ fontSize: 12 }} value={meta.previewUrl} placeholder="https://"
              onChange={(e) => setMeta((m) => ({ ...m, previewUrl: e.target.value }))} />
          </div>
        </div>

        {/* The story: one node per stage. Click any node to edit that stage —
            you often need to fix a note on one that already closed. */}
        <div className="story">
          {[...STAGES].reverse().map((key) => {
            const m = STAGE_META[key]
            const st = (project.stages || []).find((s) => s.stageKey === key) || {}
            const isOpen = key === active
            const isDone = st.status === STAGE_STATUS.COMPLETE
            const isLive = key === project.currentStage
            const kind = isDone ? 'past' : isLive ? '' : 'next'
            return (
              <div key={key} className={`stage-node ${kind}${isOpen ? ' open' : ''}`} style={{ '--c': m.color }}>
                <button className="dot" onClick={() => { setStageKey(key); setTab('write') }} title={`Edit ${m.label}`}>{m.n}</button>
                <div className="stage-head">
                  <h2 role="button" tabIndex={0} onClick={() => { setStageKey(key); setTab('write') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStageKey(key); setTab('write') } }}>{m.label}</h2>
                  <span className="when">
                    {isDone && `complete${st.completedAt ? ' · ' + longDate(st.completedAt) : ''}`}
                    {isLive && !isDone && `${st.progressPct ?? 0}% · now`}
                    {kind === 'next' && (key === 'LAUNCH' && project.estLaunchAt ? `estimated ${longDate(project.estLaunchAt)}` : 'upcoming')}
                  </span>
                </div>

                {isOpen ? (
                  <>
                    <div className="editor">
                      <div className="tabs">
                        <button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Write</button>
                        <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button>
                        <span className="hint">Headings, lists and links render for {contactName}. Start a line with ! for something you need from them.</span>
                      </div>
                      {tab === 'write' ? (
                        <textarea value={form.clientNote}
                          placeholder={`What changed, what you need from ${contactName}, what's next.\n\nWrite it the way you'd say it on the phone.`}
                          onChange={(e) => setForm((f) => ({ ...f, clientNote: e.target.value }))} />
                      ) : (
                        <div className="preview">
                          {form.clientNote.trim()
                            ? <Prose source={form.clientNote} />
                            : <div className="prose-empty">Nothing written yet.</div>}
                        </div>
                      )}
                      <div className="foot">
                        <span>{contactName} sees this the moment you save. Nothing is staged.</span>
                        <button className="btn btn-p sm" style={{ marginLeft: 'auto' }} onClick={save} disabled={saving}>
                          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
                        </button>
                      </div>
                    </div>

                    <StageThread projectId={id} stageKey={key} counterpart={contactName}
                      onLoaded={(t) => setClientRead(t.clientLastReadAt)} />

                    <div className="internal">
                      <label>Internal note — never shown to {contactName}</label>
                      <textarea value={form.internalNote} placeholder="Decisions, gotchas, things to remember."
                        onChange={(e) => setForm((f) => ({ ...f, internalNote: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  kind !== 'next' && (
                    <div className="recap">
                      {firstLine(st.clientNote) || <span style={{ fontStyle: 'italic' }}>No update written.</span>}
                      <button onClick={() => { setStageKey(key); setTab('write') }}>Open</button>
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>

        <div className="card pad" style={{ marginTop: 8 }}>
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