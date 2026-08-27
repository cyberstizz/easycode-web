import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WORK } from './work-data'

export default function Work() {
  const [open, setOpen] = useState(null)

  return (
    <>
      <div className="msec">
        <div className="mwrap">
          <div className="eyebrow">Work</div>
          <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,48px)', margin: '12px 0 18px' }}>
            Small businesses,<br />real software.
          </h1>
          <p className="lede" style={{ marginBottom: 34 }}>
            Every one of these was built end to end — design, front end, back end, and the
            hosting it runs on. Not templates with a logo swapped in.
          </p>

          <div className="grid g3">
            {WORK.map((w) => (
              <button key={w.slug} className="case"
                onClick={() => setOpen(open === w.slug ? null : w.slug)}
                style={{ textAlign: 'left' }}>
                <div className="case-shot" style={{ background: w.shot }}>
                  {w.image
                    ? <img src={w.image} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  {open === w.slug && w.detail && (
                    <p style={{
                      fontSize: 12.5, color: 'var(--mute-hi)', lineHeight: 1.65,
                      marginBottom: 6, paddingTop: 10, borderTop: '1px solid var(--ink-200)',
                    }}>{w.detail}</p>
                  )}
                  <div className="case-metric">
                    {w.metrics.map((m) => (
                      <dl key={m.label} className="kv">
                        <dt>{m.label}</dt>
                        <dd className="num" style={{ fontSize: 16 }}>{m.value}</dd>
                      </dl>
                    ))}
                  </div>
                  {w.detail && (
                    <div style={{ fontSize: 11.5, color: 'var(--em-hi)', marginTop: 11 }}>
                      {open === w.slug ? 'Show less' : 'What made it hard →'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow">
          <div className="mrule"><span className="eyebrow">How we work</span><span className="rule" /></div>
          <div className="grid g2">
            <div>
              <div className="h3" style={{ marginBottom: 7 }}>You own everything</div>
              <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.65 }}>
                The site, the domain, the content. If you ever leave, it goes with you — there&apos;s
                no platform to be locked into and nothing that stops working when you stop paying.
              </p>
            </div>
            <div>
              <div className="h3" style={{ marginBottom: 7 }}>Built custom, not assembled</div>
              <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.65 }}>
                No page builders, no themes bought off a marketplace. That&apos;s why these load fast
                on a phone and why we can add whatever your business actually needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="msec">
        <div className="mwrap narrow" style={{ textAlign: 'center' }}>
          <h2 className="mhead" style={{ marginBottom: 13 }}>Want yours on this page?</h2>
          <p className="lede" style={{ margin: '0 auto 26px' }}>
            Tell us what your business needs and we&apos;ll quote it, usually the same day.
          </p>
          <Link to="/contact" className="btn btn-p btn-xl" style={{ textDecoration: 'none' }}>
            Get a free quote
          </Link>
        </div>
      </div>
    </>
  )
}