import { useState, useRef, useCallback } from 'react'
import { useApi } from '../../lib/useApi'
import { post, putToR2, api } from '../../lib/api'
import { EP, adaptAssets, isImage } from '../../lib/endpoints'
import { bytes as fmtBytes, longDate, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_TYPES } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'
import EmptyState from '../../components/EmptyState'

const TILE_BG = [
  'linear-gradient(140deg,#2A1B10,#4A2C15)',
  'linear-gradient(140deg,#12291F,#1D4433)',
  'linear-gradient(140deg,#1B1330,#2E1F52)',
  'linear-gradient(140deg,#101C2E,#1D3A5C)',
]

const FileIcon = ({ mime }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5">
    {isImage(mime)
      ? <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>
      : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>}
  </svg>
)

export default function Files() {
  const projects = useApi(EP.projects())
  const projectId = projects.data?.items?.[0]?.id
  const orgId = projects.data?.items?.[0]?.orgId

  const { data, error, loading, reload } = useApi(
    projectId ? EP.assets(`?projectId=${projectId}`) : null,
    { select: adaptAssets },
  )

  const [queue, setQueue] = useState([])   // in-flight uploads
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const inputRef = useRef(null)

  const items = data?.items || []

  /**
   * Presign, PUT straight to R2, then confirm. The file never passes through
   * our API — the browser talks to storage directly with a short-lived URL,
   * which is why a 20MB photo doesn't tie up a server thread.
   */
  const upload = useCallback(async (file) => {
    const key = `${file.name}-${file.size}-${Date.now()}`
    setQueue((q) => [...q, { key, name: file.name, size: file.size, state: 'uploading' }])

    try {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(`${file.name} is ${fmtBytes(file.size)}. The limit is 25 MB — try a smaller version.`)
      }
      if (file.type && !ALLOWED_UPLOAD_TYPES.includes(file.type)) {
        throw new Error(`We can't accept ${file.type || 'that file type'}. Photos, PDFs, and Word documents work.`)
      }

      const signed = await post(EP.assetPresign(), {
        orgId,
        projectId,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        bytes: file.size,
      })

      await putToR2(signed.uploadUrl, file)
      await post(EP.assetComplete(signed.assetId))

      setQueue((q) => q.map((u) => u.key === key ? { ...u, state: 'done' } : u))
      setTimeout(() => setQueue((q) => q.filter((u) => u.key !== key)), 1200)
      reload()
    } catch (e) {
      setQueue((q) => q.filter((u) => u.key !== key))
      setUploadError(e)
    }
  }, [orgId, projectId, reload])

  const handleFiles = (fileList) => {
    setUploadError(null)
    Array.from(fileList).forEach(upload)
  }

  const openFile = async (asset) => {
    try {
      const res = await api(EP.assetUrl(asset.id))
      if (res?.url) window.open(res.url, '_blank', 'noopener')
    } catch (e) { setUploadError(e) }
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Files' }]}>
        <button className="btn btn-p sm" onClick={() => inputRef.current?.click()}>Upload files</button>
      </TopBar>

      <div className="wrap">
        <div style={{ marginBottom: 18 }}>
          <h1 className="h1">Files</h1>
          <p className="sub">
            Photos, logos, and documents you&apos;ve sent us — plus everything we&apos;ve made for you.
          </p>
        </div>

        <input ref={inputRef} type="file" multiple hidden
          accept={ALLOWED_UPLOAD_TYPES.join(',')}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }} />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className="card"
          style={{
            borderStyle: 'dashed', padding: 30, textAlign: 'center', marginBottom: 22,
            cursor: 'pointer', transition: '.15s',
            borderColor: dragging ? 'var(--em)' : 'var(--ink-300)',
            background: dragging ? 'var(--em-dim)' : 'var(--ink-050)',
          }}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="1.8" style={{ marginBottom: 11 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5-5 5 5M12 5v13" />
          </svg>
          <div className="h3" style={{ marginBottom: 4 }}>
            {dragging ? 'Drop them here' : 'Drop photos or documents here'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
            JPG, PNG, PDF, or Word · up to 25 MB each ·{' '}
            <span style={{ color: 'var(--em-hi)' }}>or browse your computer</span>
          </div>
        </div>

        {uploadError && <div style={{ marginBottom: 18 }}><ErrorNote error={uploadError} /></div>}

        {queue.length > 0 && (
          <div className="stack tight" style={{ marginBottom: 22 }}>
            {queue.map((u) => (
              <div key={u.key} className="lrow" style={{ cursor: 'default' }}>
                {u.state === 'done'
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  : <div className="dot live" style={{ width: 8, height: 8, background: 'var(--cyan)' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lrow-t">{u.name}</div>
                  <div className="lrow-s">{u.state === 'done' ? 'Uploaded' : `Uploading… ${fmtBytes(u.size)}`}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <Loading />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && items.length === 0 && queue.length === 0 && (
          <EmptyState
            title="No files yet"
            body="Send us your logo, photos of your space, and anything you want on the site."
            action={<button className="btn btn-p sm" onClick={() => inputRef.current?.click()}>Upload your first file</button>}
          />
        )}

        {items.length > 0 && (
          <div className="grid g4">
            {items.map((a, i) => (
              <button key={a.id} className="ftile" onClick={() => openFile(a)}>
                <div className="ftile-img" style={{ background: TILE_BG[i % TILE_BG.length] }}>
                  <FileIcon mime={a.mime} />
                </div>
                <div className="ftile-b" style={{ textAlign: 'left' }}>
                  <div className="ftile-n">{a.filename}</div>
                  <div className="ftile-m">{fmtBytes(a.bytes)} · {longDate(a.createdAt)}</div>
                  {a.caption && (
                    <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4, lineHeight: 1.45 }}>
                      {a.caption}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}