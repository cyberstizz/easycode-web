import { Link } from 'react-router-dom'

const Tick = ({ on = true }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={on ? 'var(--em)' : 'var(--ink-400)'} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 3 }}>
    {on ? <path d="M20 6L9 17l-5-5" /> : <path d="M5 12h14" />}
  </svg>
)

/** The floor ($100 down) is deliberately NOT published. It's a phone-only concession. */
const PLANS = [
  {
    eyebrow: 'Option one',
    name: 'Pay it off',
    amount: '$600',
    unit: 'down',
    sub: '$1,200 total — half now, half at launch',
    cta: 'btn-s',
    features: [
      ['Complete custom website, built for your business', true],
      ['Works on phones, tablets, and desktop', true],
      ['Set up on Google so people can find you', true],
      ['Client portal to watch the build', true],
      ['Yours outright at launch — no strings', true],
      ['Ongoing updates — add the plan for $50/mo any time', false],
    ],
  },
  {
    eyebrow: 'Option two',
    name: 'Build & maintain',
    amount: '$200',
    unit: 'down',
    sub: 'then $50/month on a two-year plan',
    best: true,
    flag: 'Most clients pick this',
    cta: 'btn-p',
    features: [
      ['<b>Everything in option one</b>', true],
      ['$400 less to get started', true],
      ['2 hours of changes every month, included', true],
      ['Hosting, security, and backups handled', true],
      ['Same-day answers Monday through Saturday', true],
      ['Priority when something breaks', true],
    ],
  },
]

const INCLUDED = [
  ['Changing prices, hours, or menu items', 'Hosting, domain renewal, and SSL'],
  ['Swapping photos and text', 'Security patches and weekly backups'],
  ['Adding a page or a section', 'Uptime monitoring'],
  ['Fixing anything that breaks', "Your client portal, for as long as you're with us"],
]

const FAQ = [
  ['What if I need more than two hours in a month?',
   'We tell you before we start, with a price. You approve it in the portal or you don’t. Nothing gets billed by surprise.'],
  ['Do I own the site?',
   'Yes, either way. If you leave at the end of the two years, the site goes with you.'],
  ['What happens after the two years?',
   'You can stay on at $50 a month, month to month, or stop. Nothing auto-renews for another two years.'],
  ['Is there anything else to pay for?',
   'Your domain name, if you don’t have one — usually $12 to $20 a year, paid to the registrar, not to us. Hosting is included.'],
  ['How long does it take?',
   'Most sites go live six to ten weeks after we start. You’ll see the estimated date in your portal from day one, and it updates as things move.'],
  ['Can I pay by bank instead of card?',
   'Yes, and we’d prefer it for the monthly — bank payments cost less to process and don’t stop working when a card expires.'],
]

export default function Pricing() {
  return (
    <>
      <div className="msec">
        <div className="mwrap">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 44px' }}>
            <div className="eyebrow">Pricing</div>
            <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,48px)', margin: '12px 0 16px' }}>
              One price. Two ways<br />to pay it.
            </h1>
            <p className="lede" style={{ margin: '0 auto' }}>
              A complete custom website is $1,200. What changes is how much you put down — and whether
              we stick around after launch.
            </p>
          </div>

          <div className="grid g2" style={{ gap: 18, maxWidth: 840, margin: '0 auto' }}>
            {PLANS.map((p) => (
              <div key={p.name} className={`price${p.best ? ' best' : ''}`}>
                {p.flag && <div className="price-flag">{p.flag}</div>}
                <div className="eyebrow" style={p.best ? { color: 'var(--em-hi)' } : undefined}>{p.eyebrow}</div>
                <div className="h2" style={{ fontSize: 19, marginTop: 6 }}>{p.name}</div>
                <div className="price-amt">
                  <b style={p.best ? { color: 'var(--em-hi)' } : undefined}>{p.amount}</b>
                  <span style={{ fontSize: 14, color: 'var(--mute)' }}>{p.unit}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--mute)' }}>{p.sub}</div>
                <ul className="price-list">
                  {p.features.map(([text, on]) => (
                    <li key={text} className={on ? '' : 'off'}>
                      <Tick on={on} />
                      <span dangerouslySetInnerHTML={{ __html: text }} />
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className={`btn ${p.cta} blk`} style={{ textDecoration: 'none' }}>
                  Get a quote
                </Link>
              </div>
            ))}
          </div>

          {/* Saying WHY the discount exists is the whole trick. A discount with no
              stated reason reads as a trick; a stated reason reads as a business model. */}
          <div className="card pad" style={{ maxWidth: 840, margin: '18px auto 0' }}>
            <div className="row tp" style={{ gap: 13 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--em)" strokeWidth="2"
                style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <div className="h3" style={{ marginBottom: 5 }}>Why the second one is cheaper up front</div>
                <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.62 }}>
                  Because we&apos;d rather have a client for two years than a payday once. The plan is how
                  we keep the lights on, so we&apos;ll take a smaller deposit to get you on it. You get a
                  website for $200 and someone who&apos;s still answering the phone in year two.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow">
          <div className="mrule"><span className="eyebrow">What&apos;s included in $50 a month</span><span className="rule" /></div>
          <div className="grid g2">
            {[0, 1].map((col) => (
              <div key={col} className="stack tight">
                {INCLUDED.map((row) => (
                  <div key={row[col]} className="row" style={{ gap: 10 }}>
                    <Tick />
                    <span style={{ fontSize: 13.5 }}>{row[col]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="note mute" style={{ marginTop: 20 }}>
            Bigger jobs — a whole new feature, an online store, a second site — go beyond the two included
            hours. We quote those before we start, and you approve them in your portal. We never bill you
            for something you didn&apos;t say yes to.
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow">
          <div className="mrule"><span className="eyebrow">Questions people actually ask</span><span className="rule" /></div>
          {FAQ.map(([q, a], i) => (
            <div key={q} className="faq-q" style={i === FAQ.length - 1 ? { borderBottom: 'none' } : undefined}>
              <h4>{q}</h4>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow" style={{ textAlign: 'center' }}>
          <h2 className="mhead" style={{ marginBottom: 13 }}>Still cheaper than one month of ads.</h2>
          <p className="lede" style={{ margin: '0 auto 26px' }}>
            Tell us about your business and we&apos;ll quote it, usually the same day.
          </p>
          <div className="row" style={{ gap: 11, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>Get a free quote</Link>
            <a href="tel:2125550100" className="btn btn-s btn-xl" style={{ textDecoration: 'none' }}>Call (212) 555-0100</a>
          </div>
        </div>
      </div>
    </>
  )
}