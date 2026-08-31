import { Link } from 'react-router-dom'
import StageRail from '../../components/StageRail'
import { STAGES, STAGE_META } from '../../lib/endpoints'

const DEMO = [
  { stageKey: 'DISCOVERY', status: 'COMPLETE', progressPct: 100, completedAt: '2026-02-14' },
  { stageKey: 'DESIGN', status: 'COMPLETE', progressPct: 100, completedAt: '2026-02-28' },
  { stageKey: 'DEVELOPMENT', status: 'ACTIVE', progressPct: 68 },
  { stageKey: 'REVIEW', status: 'PENDING', progressPct: 0, dueOn: '2026-03-20' },
  { stageKey: 'LAUNCH', status: 'PENDING', progressPct: 0, dueOn: '2026-04-01' },
  { stageKey: 'MAINTENANCE', status: 'PENDING', progressPct: 0 },
]

/** Written for a restaurant owner, not a developer. No jargon, no deliverable-speak. */
const DETAIL = {
  DISCOVERY: {
    dur: 'About a week',
    body: "We sit down — on the phone or in your shop — and work out what the site actually has to do. Who's coming to it, what you want them to do when they get there, and what content you already have. You get a written scope before anyone touches a keyboard.",
  },
  DESIGN: {
    dur: 'One to two weeks',
    body: 'You see real layouts of your real pages, on desktop and on a phone, before anything gets built. We go back and forth until you like it. Nothing moves forward until you say so.',
  },
  DEVELOPMENT: {
    dur: 'Two to four weeks',
    body: 'We build it. You get a live preview link the whole time, so you can check in from your phone between customers instead of waiting for a big reveal.',
  },
  REVIEW: {
    dur: 'About a week',
    body: "You walk the finished site and tell us everything you want changed. Not a formality — this is the round where we fix the things you didn't know you'd care about until you saw them.",
  },
  LAUNCH: {
    dur: 'Two to three days',
    body: 'Domain, hosting, email, Google listing, the works. We handle the technical side and you wake up with a website.',
  },
  MAINTENANCE: {
    dur: 'Ongoing',
    body: 'Where most agencies disappear. Text or email us a change, we do it. Prices, hours, photos, a new page — it goes in the portal and gets handled.',
  },
}

const SERVICES = [
  { color: 'var(--blue)', title: 'Business websites',
    body: 'Everything a customer needs to find you, trust you, and get in touch. Built to load fast on a phone.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18" /></> },
  { color: 'var(--violet)', title: 'Booking & scheduling',
    body: 'Reservations, appointments, class signups. People book at 11pm without you answering a thing.',
    icon: <><path d="M12 2l9 5-9 5-9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></> },
  { color: 'var(--em)', title: 'Online ordering & stores',
    body: "Take orders and payments online. Money lands in your account, not a middleman's.",
    icon: <><circle cx="9" cy="20" r="1.6" /><circle cx="18" cy="20" r="1.6" /><path d="M1 1h4l2.7 12.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6" /></> },
  { color: 'var(--amber)', title: 'Upkeep & support',
    body: 'Updates, security, backups, and a real person who answers when something breaks.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
]

export default function HowItWorks() {
  return (
    <>
      <div className="msec">
        <div className="mwrap">
          <div className="eyebrow">How it works</div>
          <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,48px)', margin: '12px 0 18px' }}>
            Six stages.<br />You see all of them.
          </h1>
          <p className="lede" style={{ marginBottom: 38 }}>
            Most people have been burned by someone who took a deposit and went quiet. This is how we
            make that impossible. From the day you sign, you have a login that shows exactly where your site is.
          </p>
          <StageRail stages={DEMO} currentStage="DEVELOPMENT" title="Your dashboard" subtitle="live, from day one" />
        </div>
      </div>

      <div className="msec tight">
        <div className="mwrap">
          <div className="mrule"><span className="eyebrow">Stage by stage</span><span className="rule" /></div>
          {STAGES.map((key, i) => {
            const meta = STAGE_META[key]
            const d = DETAIL[key]
            return (
              <div key={key} className="row tp" style={{
                gap: 22, padding: '26px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-200)',
              }}>
                <div style={{ flexShrink: 0, width: 52 }}>
                  <div className="mono" style={{
                    fontSize: 26, fontWeight: 700, color: meta.color, letterSpacing: '-1.5px',
                  }}>{meta.n}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                    <span className="h2">{meta.label}</span>
                    <span className="chip c-done">{d.dur}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.68, maxWidth: 620 }}>
                    {d.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="msec">
        <div className="mwrap">
          <div className="mrule"><span className="eyebrow">What we build</span><span className="rule" /></div>
          <div className="grid g4">
            {SERVICES.map((s) => (
              <div key={s.title} className="card pad">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={s.color}
                  strokeWidth="1.9" style={{ marginBottom: 13 }}>{s.icon}</svg>
                <div className="h3" style={{ marginBottom: 6 }}>{s.title}</div>
                <p style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow" style={{ textAlign: 'center' }}>
          <h2 className="mhead" style={{ marginBottom: 13 }}>Ready to start at stage one?</h2>
          <p className="lede" style={{ margin: '0 auto 26px' }}>
            Discovery is a conversation, not a commitment. Quotes are free.
          </p>
          <Link to="/contact" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>
            Get a free quote
          </Link>
        </div>
      </div>
    </>
  )
}