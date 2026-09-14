import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useApi } from '../../lib/useApi'
import { post } from '../../lib/api'
import { EP, adaptInvoice, adaptIntent } from '../../lib/endpoints'
import { money } from '../../lib/format'
import { stripePromise, stripeConfigured } from '../../lib/stripe'
import { TopBar } from '../../components/Shell'
import Loading from '../../components/Loading'
import ErrorNote from '../../components/ErrorNote'

/**
 * Card entry, inside the portal.
 *
 * The backend creates a PaymentIntent and hands back its client_secret; Stripe's
 * Payment Element renders the card form and Stripe holds the card — it never
 * touches our server. On success we go back to the invoice page. The invoice is
 * marked paid by the webhook, not by this page, which is why the receipt says
 * "can take a few seconds" rather than assuming.
 */
export default function PayInvoice() {
  const { id } = useParams()
  const { data: inv, error, loading, reload } = useApi(EP.invoice(id), { select: adaptInvoice })
  const [intent, setIntent] = useState(null)
  const [intentError, setIntentError] = useState(null)

  // Ask for the client_secret once we know the invoice is actually payable.
  useEffect(() => {
    if (!inv?.payable || intent) return
    let cancelled = false
    post(EP.invoicePaymentIntent(id))
      .then((raw) => { if (!cancelled) setIntent(adaptIntent(raw)) })
      .catch((e) => { if (!cancelled) setIntentError(e) })
    return () => { cancelled = true }
  }, [inv?.payable, id, intent])

  const crumbs = [{ label: 'Billing', to: '/portal/billing' }, { label: inv?.number || 'Invoice', to: `/portal/invoices/${id}` }, { label: 'Pay' }]

  if (loading) return <><TopBar crumbs={crumbs} /><div className="wrap"><Loading full /></div></>
  if (error) return <><TopBar crumbs={crumbs} /><div className="wrap"><ErrorNote error={error} onRetry={reload} /></div></>

  if (!inv.payable) {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <div className="wrap">
          <div className="note mute">
            {inv.status === 'PAID' ? 'This invoice is already paid.' : 'This invoice can\'t be paid right now.'}
            {' '}<Link to={`/portal/invoices/${id}`}>View it</Link>.
          </div>
        </div>
      </>
    )
  }

  if (!stripeConfigured) {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <div className="wrap">
          <ErrorNote error={{ message: 'Card payments aren\'t switched on for this site yet. Please message us and we\'ll sort it.' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar crumbs={crumbs} />
      <div className="wrap">
        <div className="card pad pay">
          <div className="pay-head">
            <div>
              <div className="eyebrow">Pay invoice</div>
              <div className="inv-number mono">{inv.number}</div>
            </div>
            <div className="pay-amount mono">{money(inv.balanceCents)}</div>
          </div>

          {intentError && <ErrorNote error={intentError} />}
          {!intent && !intentError && <Loading />}

          {intent?.clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: intent.clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3ee0a8', colorBackground: '#0d0f12', colorText: '#dfe3ea',
                    colorDanger: '#f0555f', fontFamily: 'Outfit, system-ui, sans-serif', borderRadius: '8px',
                  },
                },
              }}
            >
              <CardForm invoiceId={id} amountCents={intent.amountCents} />
            </Elements>
          )}
        </div>
      </div>
    </>
  )
}

function CardForm({ invoiceId, amountCents }) {
  const stripe = useStripe()
  const elements = useElements()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const pay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || busy) return
    setBusy(true); setMessage(null)

    // redirect: 'if_required' keeps card payments on this page; only methods that
    // genuinely need a redirect (some bank flows) leave and come back.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/portal/invoices/${invoiceId}` },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'That didn\'t go through. Check the card details and try again.')
      setBusy(false)
      return
    }
    if (paymentIntent && ['succeeded', 'processing'].includes(paymentIntent.status)) {
      nav(`/portal/invoices/${invoiceId}`, { replace: true, state: { justPaid: true } })
      return
    }
    setMessage('The payment wasn\'t completed. Nothing was charged.')
    setBusy(false)
  }

  return (
    <form onSubmit={pay} className="pay-form">
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />
      {message && <div style={{ marginTop: 12 }}><ErrorNote error={{ message }} /></div>}
      <button type="submit" className="btn btn-p pay-btn" disabled={!stripe || !ready || busy}>
        {busy ? 'Processing…' : `Pay ${money(amountCents)}`}
      </button>
      <div className="pay-fine">
        Your card is handled by Stripe and never stored on our servers. We keep it on file with Stripe so maintenance, if you start it, doesn't ask you twice.
      </div>
    </form>
  )
}
