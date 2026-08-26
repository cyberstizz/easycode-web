import { NavLink, Link, Outlet } from 'react-router-dom'

/**
 * Public site chrome. Separate from the app Shell — no sidebar, no auth,
 * and a nav that sells rather than navigates a workspace.
 */
export function MarketingNav() {
  const link = ({ isActive }) => (isActive ? 'on' : '')
  return (
    <nav className="pnav">
      <Link to="/" className="row" style={{ gap: 8, textDecoration: 'none' }}>
        <div className="brand-mark" style={{ width: 24, height: 24, borderRadius: 7 }}>
          <span style={{ fontSize: 11 }}>&lt;/&gt;</span>
        </div>
        <span className="brand-name" style={{ fontSize: 17 }}>easy<i>code</i></span>
      </Link>

      <div className="pnav-links">
        <NavLink to="/work" className={link}>Work</NavLink>
        <NavLink to="/how-it-works" className={link}>How it works</NavLink>
        <NavLink to="/pricing" className={link}>Pricing</NavLink>
      </div>

      <div className="pnav-r">
        <Link to="/login" className="btn btn-s sm" style={{ textDecoration: 'none' }}>Client login</Link>
        <Link to="/contact" className="btn btn-p sm" style={{ textDecoration: 'none' }}>Get a quote</Link>
      </div>
    </nav>
  )
}

export function MarketingFooter() {
  return (
    <footer className="mfoot">
      <div className="mwrap">
        <div className="spread" style={{ flexWrap: 'wrap', gap: 26, alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 280 }}>
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <div className="brand-mark" style={{ width: 23, height: 23, borderRadius: 7 }}>
                <span style={{ fontSize: 10 }}>&lt;/&gt;</span>
              </div>
              <span className="brand-name" style={{ fontSize: 16 }}>easy<i>code</i></span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              Websites and web apps for small businesses. Built in Harlem, serving clients nationwide.
            </p>
          </div>

          <div className="row" style={{ gap: 52, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="stack tight">
              <div className="eyebrow" style={{ marginBottom: 4 }}>Company</div>
              <Link to="/work" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Work</Link>
              <Link to="/how-it-works" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>How it works</Link>
              <Link to="/pricing" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Pricing</Link>
            </div>
            <div className="stack tight">
              <div className="eyebrow" style={{ marginBottom: 4 }}>Get in touch</div>
              <a href="tel:2125550100" className="mono" style={{ fontSize: 12.5, color: 'var(--mute-hi)', textDecoration: 'none' }}>
                (212) 555-0100
              </a>
              <span className="mono" style={{ fontSize: 12.5, color: 'var(--mute-hi)' }}>hello@easycode.dev</span>
              <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>Mon&ndash;Sat, 9&ndash;7 ET</span>
            </div>
            <div className="stack tight">
              <div className="eyebrow" style={{ marginBottom: 4 }}>Clients</div>
              <Link to="/login" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Client login</Link>
              <Link to="/contact" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Get a quote</Link>
            </div>
          </div>
        </div>

        <div className="hr" />
        <div className="spread" style={{ flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
            &copy; {new Date().getFullYear()} EasyCode, a DBA of Lamb Services, Inc.
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>New York, NY</span>
        </div>
      </div>
    </footer>
  )
}

/** Layout wrapper — every public route renders inside this. */
export default function MarketingShell() {
  return (
    <div>
      <MarketingNav />
      <Outlet />
      <MarketingFooter />
    </div>
  )
}