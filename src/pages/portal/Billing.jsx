import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import { EP, adaptBillingSummary, adaptCard, invoiceTone, invoiceLabel, INVOICE_KIND_LABEL } from '../../lib/endpoints'
import { money, longDate } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Chip from '../../components/Chip'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * The client's money page. Three things, in the order they care about them:
 * what's due now, whether maintenance is running, and the history.
 *
 * Maintenance is started here with the card saved at deposit time — no second
 * card entry. Nothing recurs until they press the button; saving a card and
 * subscribing are deliberately separate acts.
 */
export default function Billing() {
  const { data, error, loading, reload } = useApi(EP.billingSummary(), { select: adaptBillingSummary })
  const card = useApi(EP.billingCard(), { select: adaptCard })
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(null)
  const [confirming, setConfirming] = useState(false)

  if (loading) return <><TopBar crumbs={[{ label: 'Billing' }]} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={[{ label: 'Billing' }]} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  const { amountDueCents, invoices, activeSubscription: sub, plans } = data
  const plan = plans.find((p) => p.purchasable) || plans[0]
  const due = invoices.filter((i) => i.payable)
  const nextDue = due.sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0))[0]

  const startPlan = async () => {
    if (!plan) return
    setStarting(true); setStartError(null)
    try {
      await post(EP.subscriptions(), { planId: plan.id })
      setConfirming(false)
      await reload()
    } catch (e) { setStartError(e) } finally { setStarting(false) }
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Overview', to: '/portal' }, { label: 'Billing' }]} />
      <div className="wrap">

        {/* ── What's due ─────────────────────────────────────────── */}
        <div className="card pad bill-hero">
          <div>
            <div className="eyebrow">Balance due</div>
            <div className="bill-amount">{money(amountDueCents)}</div>
            {nextDue?.dueAt && amountDueCents > 0 && (
              <div className="bill-sub">Next due {longDate(nextDue.dueAt)} · {nextDue.number}</div>
            )}
            {amountDueCents === 0 && <div className="bill-sub">Nothing outstanding. You're all set.</div>}
          </div>
          {nextDue && (
            <Link to={`/portal/invoices/${nextDue.id}/pay`} className="btn btn-p" style={{ textDecoration: 'none' }}>
              Pay {money(nextDue.balanceCents)}
            </Link>
          )}
        </div>

        {/* ── Maintenance ────────────────────────────────────────── */}
        <div className="card pad" style={{ marginTop: 14 }}>
          <div className="spread" style={{ marginBottom: 6 }}>
            <div className="eyebrow">Maintenance</div>
            {sub && <Chip tone={sub.status === 'ACTIVE' ? 'c-new' : sub.status === 'PAST_DUE' ? 'c-late' : 'c-done'} live={sub.status === 'ACTIVE'}>
              {sub.status === 'ACTIVE' ? 'Running' : sub.status === 'PAST_DUE' ? 'Payment failed' : sub.status.toLowerCase()}
            </Chip>}
          </div>

          {sub ? (
            <div style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.6 }}>
              <b style={{ color: 'var(--text)' }}>{sub.planName}</b>
              {plan && <> · {money(plan.priceCents)}/month</>}
              {sub.termMonths && <> · {sub.termMonths}-month term</>}
              {sub.currentPeriodEnd && <><br />Next charge {longDate(sub.currentPeriodEnd)}</>}
              {card.data && <><br />Charged to {card.data.brand} ····{card.data.last4}</>}
            </div>
          ) : plan ? (
            <>
              <div style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 12 }}>
                <b style={{ color: 'var(--text)' }}>{plan.name}</b> · {money(plan.priceCents)}/month
                <ul className="bill-features">
                  {(plan.features || []).map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
              {startError && <div style={{ marginBottom: 10 }}><ErrorNote error={startError} /></div>}
              {!plan.purchasable ? (
                <div className="note mute">Maintenance isn't available to start yet.</div>
              ) : confirming ? (
                <div className="bill-confirm">
                  <div>
                    Start {plan.name} at <b>{money(plan.priceCents)}/month</b>
                    {card.data ? <>, charged to your {card.data.brand} ending {card.data.last4}</> : ''}?
                    <br /><span style={{ color: 'var(--mute)' }}>First charge today, then monthly. Cancel any time by messaging us.</span>
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 10 }}>
                    <button className="btn btn-p sm" onClick={startPlan} disabled={starting}>{starting ? 'Starting…' : 'Start maintenance'}</button>
                    <button className="btn btn-g sm" onClick={() => setConfirming(false)} disabled={starting}>Not now</button>
                  </div>
                </div>
              ) : card.data ? (
                <button className="btn btn-s sm" onClick={() => setConfirming(true)}>Start maintenance</button>
              ) : (
                <div className="note mute">
                  Pay your first invoice and the card you use will be saved here for maintenance.
                </div>
              )}
            </>
          ) : (
            <div className="note mute">No maintenance plan is set up.</div>
          )}
        </div>

        {/* ── History ────────────────────────────────────────────── */}
        <div className="card pad" style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Invoices</div>
          {invoices.length === 0 ? (
            <div className="note mute">No invoices yet.</div>
          ) : (
            <div className="bill-list">
              {invoices.map((i) => (
                <Link key={i.id} to={`/portal/invoices/${i.id}`} className="bill-row">
                  <div>
                    <div className="mono" style={{ fontSize: 12.5, color: 'var(--white)' }}>{i.number}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
                      {INVOICE_KIND_LABEL[i.kind] || i.kind}{i.memo ? ` · ${i.memo}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 13.5, color: 'var(--white)' }}>{money(i.amountCents)}</div>
                    <div style={{ marginTop: 3 }}><Chip tone={invoiceTone(i.status, i.dueAt)}>{invoiceLabel(i.status, i.dueAt)}</Chip></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
