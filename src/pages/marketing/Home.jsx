import { Link } from 'react-router-dom'
import StageRail from '../../components/StageRail'
import { WORK } from './work-data'

/**
 * The thesis is the portal: other agencies build in the dark, you watch ours.
 * So the hero shows a real stage rail rather than describing one — it's the
 * same component the client sees after signing in, not a picture of it.
 */
const DEMO_STAGES = [
  { stageKey: 'DISCOVERY', status: 'COMPLETE', progressPct: 100, completedAt: '2026-02-14' },
  { stageKey: 'DESIGN', status: 'COMPLETE', progressPct: 100, completedAt: '2026-02-28' },
  { stageKey: 'DEVELOPMENT', status: 'IN_PROGRESS', progressPct: 68 },
  { stageKey: 'REVIEW', status: 'PENDING', progressPct: 0, dueOn: '2026-03-20' },
  { stageKey: 'LAUNCH', status: 'PENDING', progressPct: 0, dueOn: '2026-04-01' },
  { stageKey: 'MAINTENANCE', status: 'PENDING', progressPct: 0 },
]

const PROMISES = [
  { color: 'var(--cyan)', title: 'Always know where it stands',
    body: 'Six stages, start to launch. Log in from your phone between customers and see exactly where your site is.' },
  { color: 'var(--violet)', title: 'Ask for changes in one place',
    body: "New hours, a new photo, a whole new page. Send it through the portal and watch it move. Nothing gets lost in a text thread." },
  { color: 'var(--em-hi)', title: 'No surprise invoices',
    body: "If something falls outside your plan, we quote it first and wait for you to approve. We never start work you haven't priced." },
]

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="mwrap" style={{ position: 'relative' }}>
          <div className="pill" style={{ marginBottom: 26 }}>
            <span className="dot live" />Taking on 4 more clients this quarter
          </div>
          <h1 className="display">
            Most agencies build<br />in the dark.<br /><em>You watch ours.</em>
          </h1>
          <p className="lede" style={{ marginTop: 24 }}>
            Every EasyCode client gets a login. You see what stage your site is in, what we&apos;re working
            on this week, and every file we&apos;ve made — the same day we make it. No status emails,
            no wondering.
          </p>
          <div className="row" style={{ gap: 11, marginTop: 32, flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>
              Get a free quote
            </Link>
            <Link to="/how-it-works" className="btn btn-s btn-xl" style={{ textDecoration: 'none' }}>
              See how it works
            </Link>
          </div>
          <div className="row" style={{ gap: 9, marginTop: 18 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
              Most quotes come back same day. Call{' '}
              <a href="tel:2125550100" className="mono" style={{ color: 'var(--mute-hi)', textDecoration: 'none' }}>
                (212) 555-0100
              </a>{' '}and skip the form.
            </span>
          </div>
        </div>
      </div>

      {/* Show the portal, don't describe it. */}
      <div className="msec tight">
        <div className="mwrap">
          <StageRail
            stages={DEMO_STAGES}
            currentStage="DEVELOPMENT"
            title="A real client's dashboard"
            subtitle="what you see the day you sign"
          />
          <div className="grid g3" style={{ marginTop: 14 }}>
            {PROMISES.map((p) => (
              <div key={p.title} className="card pad">
                <div className="eyebrow" style={{ color: p.color, marginBottom: 9 }}>{p.title}</div>
                <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap">
          <div className="mrule">
            <span className="eyebrow">Recent work</span>
            <span className="rule" />
            <Link to="/work" className="btn btn-g sm" style={{ textDecoration: 'none' }}>See all →</Link>
          </div>
          <div className="grid g3">
            {WORK.map((w) => (
              <Link key={w.slug} to="/work" className="case" style={{ textDecoration: 'none' }}>
                <div className="case-shot" style={{ background: w.shot }}>
                  {w.image
                    ? <img src={w.image} alt={w.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.26)" strokeWidth="1.4">
                        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                      </svg>}
                </div>
                <div className="case-b">
                  <div className="eyebrow" style={{ marginBottom: 7 }}>{w.kind}</div>
                  <div className="h2" style={{ fontSize: 16.5, marginBottom: 8 }}>{w.name}</div>
                  <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 6 }}>
                    {w.blurb}
                  </p>
                  <div className="case-metric">
                    {w.metrics.map((m) => (
                      <dl key={m.label} className="kv">
                        <dt>{m.label}</dt>
                        <dd className="num" style={{ fontSize: 16 }}>{m.value}</dd>
                      </dl>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap">
          <div className="mrule"><span className="eyebrow">What it costs</span><span className="rule" /></div>
          <div className="spread" style={{ flexWrap: 'wrap', gap: 30, alignItems: 'flex-start' }}>
            <div style={{ maxWidth: 440 }}>
              <h2 className="mhead" style={{ marginBottom: 16 }}>$1,200 for the site.<br />Or $200 down.</h2>
              <p style={{ fontSize: 14.5, color: 'var(--mute)', lineHeight: 1.68 }}>
                A complete custom website is $1,200, half up front. But if you take our maintenance plan
                for two years, your deposit drops to <b style={{ color: 'var(--em-hi)' }}>$200</b> and we
                keep the site running for <b style={{ color: 'var(--em-hi)' }}>$50 a month</b> — updates included.
              </p>
              <p style={{ fontSize: 14.5, color: 'var(--mute)', lineHeight: 1.68, marginTop: 14 }}>
                Most of our clients take the second one. It costs less to start and it means we&apos;re
                still here in year two.
              </p>
              <Link to="/pricing" className="btn btn-p" style={{ marginTop: 22, textDecoration: 'none' }}>
                See what&apos;s included
              </Link>
            </div>

            <div className="card pad" style={{ minWidth: 290, flex: 1, maxWidth: 400 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Side by side</div>
              <div className="stack tight">
                <div className="spread">
                  <span style={{ fontSize: 13.5, color: 'var(--mute)' }}>Pay in full</span>
                  <span className="mono" style={{ fontSize: 14, color: 'var(--text)' }}>$600 today</span>
                </div>
                <div className="spread">
                  <span style={{ fontSize: 13.5, color: 'var(--em-hi)', fontWeight: 600 }}>2-year plan</span>
                  <span className="mono" style={{ fontSize: 14, color: 'var(--em-hi)', fontWeight: 700 }}>$200 today</span>
                </div>
                <div className="hr" style={{ margin: '9px 0' }} />
                <div className="spread">
                  <span style={{ fontSize: 13.5, color: 'var(--mute)' }}>Monthly after</span>
                  <span className="mono" style={{ fontSize: 14, color: 'var(--text)' }}>$50</span>
                </div>
                <div className="spread">
                  <span style={{ fontSize: 13.5, color: 'var(--mute)' }}>Updates included</span>
                  <span className="mono" style={{ fontSize: 14, color: 'var(--text)' }}>2 hrs / mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow" style={{ textAlign: 'center' }}>
          <h2 className="mhead" style={{ marginBottom: 14 }}>Tell us what you need.</h2>
          <p className="lede" style={{ margin: '0 auto 28px' }}>
            Quotes are free and usually same-day. If we&apos;re not the right fit we&apos;ll tell you that too.
          </p>
          <div className="row" style={{ gap: 11, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>
              Get a free quote
            </Link>
            <a href="tel:2125550100" className="btn btn-s btn-xl" style={{ textDecoration: 'none' }}>
              Call (212) 555-0100
            </a>
          </div>
        </div>
      </div>
    </>
  )
}