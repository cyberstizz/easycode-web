import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import {
  EP, adaptList, adaptInvoice, invoiceTone, invoiceLabel,
  INVOICE_KIND, INVOICE_KIND_LABEL,
} from '../../lib/endpoints'
import { money, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Chip from '../../components/Chip'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * Admin invoices: everything outstanding across every client, plus raising a
 * new one. Deliberately not a full accounting tool. You raise it, you send it,
 * the client pays it in the portal, the webhook closes it. Void is the only
 * other verb — there's no editing a sent invoice, because the client may
 * already be looking at it.
 */
const blankLine = () => ({ description: '', quantity: 1, unitDollars: '' })

export default function Invoices() {
  const [sp] = useSearchParams()
  const presetOrg = sp.get('orgId') || ''

  const { data, error, loading, reload } = useApi(EP.adminInvoices(), {
    select: (raw) => ({ items: adaptList(raw).items.map(adaptInvoice) }),
  })
  const orgs = useApi(EP.adminOrgs(), { select: adaptList })

  const [filter, setFilter] = useState('open')
  const [creating, setCreating] = useState(Boolean(presetOrg))
  const [busyId, setBusyId] = useState(null)
  const [rowError, setRowError] = useState(null)

  // ── new invoice form ──────────────────────────────────────────
  const [form, setForm] = useState({
    orgId: presetOrg, kind: INVOICE_KIND.DEPOSIT, memo: '', dueOn: '', lines: [blankLine()],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const items = data?.items || []
  const rows = useMemo(() => {
    if (filter === 'open') return items.filter((i) => i.status === 'OPEN')
    if (filter === 'paid') return items.filter((i) => i.status === 'PAID')
    if (filter === 'draft') return items.filter((i) => i.status === 'DRAFT')
    return items
  }, [items, filter])

  const orgName = (id) => (orgs.data?.items || []).find((o) => o.id === id)?.name || '—'
  const totalCents = form.lines.reduce((n, l) => n + Math.round((Number(l.unitDollars) || 0) * 100) * (Number(l.quantity) || 0), 0)
  const canSave = form.orgId && form.lines.some((l) => l.description.trim() && Number(l.unitDollars) > 0)

  const setLine = (i, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))

  const create = async (andSend) => {
    setSaving(true); setSaveError(null)
    try {
      const created = await post(EP.adminInvoices(), {
        orgId: form.orgId,
        kind: form.kind,
        memo: form.memo.trim() || null,
        // Java Instant — a bare day string is rejected before the controller runs.
        dueAt: form.dueOn ? new Date(`${form.dueOn}T12:00:00.000Z`).toISOString() : null,
        lines: form.lines
          .filter((l) => l.description.trim())
          .map((l) => ({
            description: l.description.trim(),
            quantity: Number(l.quantity) || 1,
            unitCents: Math.round((Number(l.unitDollars) || 0) * 100),
          })),
      })
      if (andSend && created?.id) await post(EP.adminInvoiceSend(created.id))
      setCreating(false)
      setForm({ orgId: '', kind: INVOICE_KIND.DEPOSIT, memo: '', dueOn: '', lines: [blankLine()] })
      await reload()
    } catch (e) { setSaveError(e) } finally { setSaving(false) }
  }

  const act = async (id, path) => {
    setBusyId(id); setRowError(null)
    try { await post(path); await reload() }
    catch (e) { setRowError(e) } finally { setBusyId(null) }
  }

  if (loading) return <><TopBar crumbs={[{ label: 'Invoices' }]} /><div className="wrap wide"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Invoices' }]} /><div className="wrap wide"><ErrorNote error={error} onRetry={reload} /></div></>

  const openCents = items.filter((i) => i.status === 'OPEN').reduce((n, i) => n + (i.balanceCents || 0), 0)
  const paidCents = items.filter((i) => i.status === 'PAID').reduce((n, i) => n + (i.amountPaidCents || 0), 0)

  return (
    <>
      <TopBar crumbs={[{ label: 'Invoices' }]}>
        <button className="btn btn-p sm" onClick={() => setCreating((c) => !c)}>{creating ? 'Cancel' : 'New invoice'}</button>
      </TopBar>

      <div className="wrap wide">
        <div className="grid g3" style={{ gap: 12, marginBottom: 16 }}>
          <div className="card pad stat"><div className="stat-l">Outstanding</div><div className="stat-n mono">{money(openCents)}</div></div>
          <div className="card pad stat"><div className="stat-l">Collected</div><div className="stat-n mono">{money(paidCents)}</div></div>
          <div className="card pad stat"><div className="stat-l">Open invoices</div><div className="stat-n mono">{items.filter((i) => i.status === 'OPEN').length}</div></div>
        </div>

        {creating && (
          <div className="card pad" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>New invoice</div>
            <div className="grid g3" style={{ gap: 10 }}>
              <div>
                <label className="lbl">Client</label>
                <select className="inp" value={form.orgId} onChange={(e) => setForm((f) => ({ ...f, orgId: e.target.value }))}>
                  <option value="">Choose…</option>
                  {(orgs.data?.items || []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Kind</label>
                <select className="inp" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                  {Object.values(INVOICE_KIND).filter((k) => k !== INVOICE_KIND.SUBSCRIPTION).map((k) => (
                    <option key={k} value={k}>{INVOICE_KIND_LABEL[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="lbl">Due</label>
                <input type="date" className="inp mono" value={form.dueOn} onChange={(e) => setForm((f) => ({ ...f, dueOn: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label className="lbl">Memo — the client sees this</label>
              <input className="inp" value={form.memo} placeholder="Deposit for the main site" onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="lbl">Lines</label>
              {form.lines.map((l, i) => (
                <div key={i} className="inv-line-edit">
                  <input className="inp" placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                  <input className="inp mono" type="number" min="0" step="0.5" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} title="Quantity" />
                  <input className="inp mono" type="number" min="0" step="0.01" placeholder="0.00" value={l.unitDollars} onChange={(e) => setLine(i, { unitDollars: e.target.value })} title="Unit price" />
                  <button className="btn btn-g sm" onClick={() => setForm((f) => ({ ...f, lines: f.lines.length > 1 ? f.lines.filter((_, j) => j !== i) : f.lines }))} disabled={form.lines.length === 1}>×</button>
                </div>
              ))}
              <button className="btn btn-g sm" style={{ marginTop: 6 }} onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, blankLine()] }))}>Add line</button>
            </div>

            {saveError && <div style={{ marginTop: 12 }}><ErrorNote error={saveError} /></div>}

            <div className="spread" style={{ marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: 'var(--mute)' }}>Total <b className="mono" style={{ color: 'var(--white)', fontSize: 15, marginLeft: 6 }}>{money(totalCents)}</b></div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-s sm" onClick={() => create(false)} disabled={!canSave || saving}>Save as draft</button>
                <button className="btn btn-p sm" onClick={() => create(true)} disabled={!canSave || saving}>{saving ? 'Saving…' : 'Create and send'}</button>
              </div>
            </div>
          </div>
        )}

        <div className="card pad">
          <div className="spread" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div className="eyebrow">Invoices</div>
            <div className="row" style={{ gap: 4 }}>
              {['open', 'draft', 'paid', 'all'].map((f) => (
                <button key={f} className={`btn btn-g sm${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)} style={filter === f ? { color: 'var(--white)', borderColor: 'var(--ink-300)' } : {}}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {rowError && <div style={{ marginBottom: 12 }}><ErrorNote error={rowError} /></div>}

          {rows.length === 0 ? (
            <div className="note mute">Nothing here.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Number</th><th>Client</th><th>Kind</th><th style={{ textAlign: 'right' }}>Amount</th><th>Status</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td className="mono" style={{ color: 'var(--white)' }}>{i.number}</td>
                    <td><Link to={`/admin/clients/${i.orgId}`}>{orgName(i.orgId)}</Link></td>
                    <td style={{ color: 'var(--mute)' }}>{INVOICE_KIND_LABEL[i.kind] || i.kind}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{money(i.amountCents)}{i.status === 'OPEN' && i.amountPaidCents > 0 && <span style={{ color: 'var(--mute)', fontSize: 11 }}> · {money(i.balanceCents)} left</span>}</td>
                    <td><Chip tone={invoiceTone(i.status, i.dueAt)}>{invoiceLabel(i.status, i.dueAt)}</Chip></td>
                    <td className="mono" style={{ fontSize: 11.5, color: 'var(--mute)' }}>{i.dueAt ? longDate(i.dueAt) : '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {i.status === 'DRAFT' && <button className="btn btn-s sm" disabled={busyId === i.id} onClick={() => act(i.id, EP.adminInvoiceSend(i.id))}>Send</button>}
                      {(i.status === 'DRAFT' || i.status === 'OPEN') && <button className="btn btn-g sm" style={{ marginLeft: 6 }} disabled={busyId === i.id} onClick={() => { if (confirm(`Void ${i.number}? The client will no longer be able to pay it.`)) act(i.id, EP.adminInvoiceVoid(i.id)) }}>Void</button>}
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
