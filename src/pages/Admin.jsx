import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import ProductsPanel from './ProductsPanel.jsx';
import '../styles/pages/admin.css';

const STATUSES = ['new', 'quoted', 'in progress', 'shipped', 'closed'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ login */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <span className="login-mark">Designher</span>
        <h1>Studio sign in</h1>
        <p className="login-sub">Orders and listings for Designher Custom Kreations.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button className="btn-admin" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link className="login-back" to="/">
          ← Back to the site
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- inquiries */
function Inquiries() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setRows(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  const newCount = rows.filter((r) => r.status === 'new').length;

  async function setStatus(id, status) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
    if (error) setError(error.message);
  }

  if (loading) return <p className="admin-note">Loading inquiries…</p>;

  return (
    <>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <div className="admin-filters">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              className={`admin-pill${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s}
              {s === 'new' && newCount > 0 && <span className="pill-count">{newCount}</span>}
            </button>
          ))}
        </div>
        <span className="admin-count">
          {shown.length} {shown.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="admin-note">
          Nothing here yet. New requests from the website land on this page
          automatically.
        </p>
      ) : (
        <ul className="inquiry-list">
          {shown.map((r) => {
            const open = openId === r.id;
            return (
              <li key={r.id} className={`inquiry${open ? ' open' : ''}`}>
                <button
                  className="inquiry-head"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                >
                  <span className={`status status-${r.status.replace(/\s+/g, '-')}`}>
                    {r.status}
                  </span>
                  <span className="inq-name">{r.full_name}</span>
                  <span className="inq-base">{r.base || '—'}</span>
                  <span className="inq-date">{formatDate(r.created_at)}</span>
                </button>

                {open && (
                  <div className="inquiry-body">
                    <dl>
                      <div>
                        <dt>Email</dt>
                        <dd>
                          <a href={`mailto:${r.email}`}>{r.email}</a>
                        </dd>
                      </div>
                      {r.phone && (
                        <div>
                          <dt>Phone</dt>
                          <dd>
                            <a href={`tel:${r.phone}`}>{r.phone}</a>
                          </dd>
                        </div>
                      )}
                      {r.ship_state && (
                        <div>
                          <dt>Ships to</dt>
                          <dd>{r.ship_state}</dd>
                        </div>
                      )}
                      {r.occasion && (
                        <div>
                          <dt>Occasion</dt>
                          <dd>{r.occasion}</dd>
                        </div>
                      )}
                      {r.palette && (
                        <div>
                          <dt>Stones</dt>
                          <dd>{r.palette}</dd>
                        </div>
                      )}
                      {r.size && (
                        <div>
                          <dt>Size</dt>
                          <dd>{r.size}</dd>
                        </div>
                      )}
                      {r.timeline && (
                        <div>
                          <dt>Timeline</dt>
                          <dd>{r.timeline}</dd>
                        </div>
                      )}
                      {r.budget && (
                        <div>
                          <dt>Budget</dt>
                          <dd>{r.budget}</dd>
                        </div>
                      )}
                      {r.reference_photo && (
                        <div>
                          <dt>Photo</dt>
                          <dd>{r.reference_photo} — ask them to email it</dd>
                        </div>
                      )}
                    </dl>

                    {r.personalization && (
                      <div className="inq-notes">
                        <dt>What they want</dt>
                        <p>{r.personalization}</p>
                      </div>
                    )}

                    <div className="inq-actions">
                      <label htmlFor={`status-${r.id}`}>Status</label>
                      <select
                        id={`status-${r.id}`}
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <a className="btn-admin small" href={`mailto:${r.email}`}>
                        Reply by email
                      </a>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ shell */
export default function Admin() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('inquiries');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="page-admin">
        <p className="admin-note">
          Supabase isn't configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, fill in the project URL and anon key, and restart
          the dev server.
        </p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="page-admin">
        <p className="admin-note">Checking your session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-admin">
        <Login />
      </div>
    );
  }

  return (
    <div className="page-admin">
      <header className="admin-header">
        <div>
          <span className="admin-mark">Designher</span>
          <span className="admin-tag">Studio</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-user">{session.user.email}</span>
          <button className="btn-admin ghost" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={tab === 'inquiries' ? 'active' : ''}
          onClick={() => setTab('inquiries')}
        >
          Requests
        </button>
        <button
          className={tab === 'products' ? 'active' : ''}
          onClick={() => setTab('products')}
        >
          Pieces
        </button>
      </nav>

      <main className="admin-main">
        {tab === 'inquiries' ? (
          <>
            <h1>Custom order requests</h1>
            <p className="admin-lede">
              Every request submitted through the website, newest first. Tap one to
              see the details and reply.
            </p>
            <Inquiries />
          </>
        ) : (
          <>
            <h1>Your pieces</h1>
            <p className="admin-lede">
              Everything on the Shop page. Add a piece, change its photos or wording,
              and drag the order with the arrows.
            </p>
            <ProductsPanel />
          </>
        )}
      </main>
    </div>
  );
}