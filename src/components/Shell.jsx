import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Avatar from './Avatar'

const I = {
  home: <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  pulse: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  folder: <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 3.6 1.65 1.65 0 0010 2.09V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 8c.14.36.44.63.81.74" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></>,
  rows: <path d="M3 5h18M3 12h18M3 19h18" />,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></>,
  team: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
}

const Icon = ({ d }) => (
  <svg className="ri" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>
)

function Item({ to, icon, label, count, hot, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => `rail-item${isActive ? ' on' : ''}`}>
      <Icon d={icon} />
      {label}
      {count > 0 && <span className={`rail-count${hot ? ' hot' : ''}`}>{count}</span>}
    </NavLink>
  )
}

export default function Shell({ counts = {} }) {
  const { user, org, isStaff, isOwner, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="shell">
      <aside className="rail">
        <Link to={isStaff ? '/admin' : '/portal'} className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-mark"><span>&lt;/&gt;</span></div>
          <div className="brand-name">easy<i>code</i></div>
          <div className="brand-badge">{isStaff ? 'Admin' : 'Portal'}</div>
        </Link>

        {isStaff ? (
          <>
            <div className="rail-group" style={{ marginBottom: 20 }}>
              <div className="rail-label">Operations</div>
              <Item to="/admin" end icon={I.clock} label="Today" count={counts.today} hot />
              <Item to="/admin/requests" icon={I.inbox} label="Requests" count={counts.requests} hot />
              <Item to="/admin/pipeline" icon={I.rows} label="Pipeline" count={counts.leads} />
            </div>
            <div className="rail-group" style={{ marginBottom: 20 }}>
              <div className="rail-label">Book of business</div>
              <Item to="/admin/clients" icon={I.users} label="Clients" count={counts.clients} />
              <Item to="/admin/projects" icon={I.pulse} label="Projects" count={counts.projects} />
              {isOwner && <Item to="/admin/invoices" icon={I.card} label="Invoices" count={counts.invoices} />}
            </div>
            {isOwner && (
              <div className="rail-group">
                <div className="rail-label">Team</div>
                <Item to="/admin/agents" icon={I.team} label="Agents" count={counts.agents} />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rail-group" style={{ marginBottom: 20 }}>
              <div className="rail-label">{org?.name || user?.orgName || 'Your project'}</div>
              <Item to="/portal" end icon={I.home} label="Overview" />
              <Item to="/portal/project" icon={I.pulse} label="Project" />
              <Item to="/portal/requests" icon={I.chat} label="Requests" count={counts.needsYou} hot />
              <Item to="/portal/files" icon={I.folder} label="Files" count={counts.files} />
            </div>
            <div className="rail-group">
              <div className="rail-label">Account</div>
              <Item to="/portal/billing" icon={I.card} label="Billing" count={counts.unpaid} hot />
              <Item to="/portal/settings" icon={I.gear} label="Settings" />
            </div>
          </>
        )}

        <div className="rail-foot">
          <button className="whoami" onClick={handleSignOut} title="Sign out">
            <Avatar name={user?.name} tone={isStaff ? 'cool' : ''} />
            <div>
              <div className="nm">{user?.name}</div>
              <div className="rl">
                {isStaff ? `${user?.role} · EasyCode` : `Client · ${org?.name || user?.orgName || ''}`}
              </div>
            </div>
          </button>
        </div>
      </aside>

      <main className="main"><Outlet /></main>
    </div>
  )
}

/** Sticky page header. Children go on the right. */
export function TopBar({ crumbs = [], children }) {
  return (
    <div className="topbar">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="sl">/</span>}
            {c.to
              ? <Link to={c.to} style={{ textDecoration: 'none', color: 'inherit' }}>{c.label}</Link>
              : <b>{c.label}</b>}
          </span>
        ))}
      </div>
      {children && <div className="topbar-r">{children}</div>}
    </div>
  )
}
