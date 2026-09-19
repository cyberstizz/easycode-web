import { Link, useParams, useLocation } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { EP, adaptInvoice, invoiceTone, invoiceLabel, INVOICE_KIND_LABEL } from '../../lib/endpoints'
import { money, longDate, dateTime } from '../../lib/format'
import { TopBar } from '../../components/Shell'
import Chip from '../../components/Chip'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * One invoice. Doubles as the receipt: once it's PAID the same page shows the
 * paid date and the Pay button is gone. One URL to send a client, whatever
 * state the invoice is in.
 */
export default function Invoice() {
  const { id } = useParams()
  const justPaid = useLocation().state?.justPaid
  const { data: inv, error, loading, reload } = useApi(EP.invoice(id), { select: adaptInvoice })

  const crumbs = [{ label: 'Billing', to: '/portal/billing' }, { label: inv?.number || 'Invoice' }]
  if (loading) return <><TopBar crumbs={crumbs} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={crumbs} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  const paid = inv.status === 'PAID'

  return (
    <>
      <TopBar crumbs={crumbs}>
        {inv.payable && (
          <Link to={`/portal/invoices/${inv.id}/pay`} className="btn btn-p sm" style={{ textDecoration: 'none' }}>
            Pay {money(inv.balanceCents)}
          </Link>
        )}
      </TopBar>

      <div className="wrap">
        {justPaid && (
          <div className="note" style={{ marginBottom: 14, borderColor: 'var(--em-line)', background: 'var(--em-dim)', color: 'var(--em-hi)' }}>
            Payment received. {paid ? 'This invoice is paid.' : 'It can take a few seconds to show as paid — refresh if it hasn\'t.'}
          </div>
        )}

        <div className="card pad inv">
          <div className="inv-head">
            <div>
              <div className="eyebrow">{paid ? 'Receipt' : 'Invoice'}</div>
              <div className="inv-number mono">{inv.number}</div>
              <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
                {INVOICE_KIND_LABEL[inv.kind] || inv.kind}{inv.memo ? ` · ${inv.memo}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Chip tone={invoiceTone(inv.status, inv.dueAt)}>{invoiceLabel(inv.status, inv.dueAt)}</Chip>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 8 }}>
                {paid && inv.paidAt ? <>Paid {dateTime(inv.paidAt)}</>
                  : inv.dueAt ? <>Due {longDate(inv.dueAt)}</>
                  : inv.sentAt ? <>Sent {longDate(inv.sentAt)}</>
                  : <>Created {longDate(inv.createdAt)}</>}
              </div>
            </div>
          </div>

          <table className="tbl inv-lines">
            <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.description}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{Number(l.quantity)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{money(l.unitCents)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{money(l.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            <div><span>Total</span><b className="mono">{money(inv.amountCents)}</b></div>
            {inv.amountPaidCents > 0 && <div><span>Paid</span><b className="mono">− {money(inv.amountPaidCents)}</b></div>}
            <div className="inv-balance"><span>{paid ? 'Balance' : 'Amount due'}</span><b className="mono">{money(inv.balanceCents)}</b></div>
          </div>

          {inv.payable && (
            <div className="inv-cta">
              <Link to={`/portal/invoices/${inv.id}/pay`} className="btn btn-p" style={{ textDecoration: 'none' }}>
                Pay {money(inv.balanceCents)}
              </Link>
              <span>Card payment, inside this portal. Nothing to download or print.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
