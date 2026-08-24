import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/pages/shop.css';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { CATEGORIES, categoryLabel, fetchPublishedProducts } from '../lib/products.js';

const FILTERS = [{ id: 'all', label: 'All' }, ...CATEGORIES];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unconfigured, setUnconfigured] = useState(false);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();

  // The category lives in the URL so /shop?category=boots is shareable and the
  // browser back button behaves the way people expect.
  const active = params.get('category') || 'all';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchPublishedProducts();
      if (cancelled) return;
      if (res.unconfigured) setUnconfigured(true);
      else if (res.error) setError(res.error.message);
      else setProducts(res.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(
    () => (active === 'all' ? products : products.filter((p) => p.category === active)),
    [products, active]
  );

  function setCategory(id) {
    if (id === 'all') setParams({}, { replace: true });
    else setParams({ category: id }, { replace: true });
  }

  return (
    <div className="page-shop">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <symbol id="gem-shape" viewBox="0 0 24 24">
          <polygon points="12,2 20,9 12,22 4,9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <polyline points="4,9 20,9" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <polyline points="8.5,9 12,2 15.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
          <polyline points="12,22 8.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
          <polyline points="12,22 15.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
        </symbol>
      </svg>

      <SiteHeader />

      <div className="page-hero">
        <span className="eyebrow">
          <svg className="gem" viewBox="0 0 24 24">
            <use href="#gem-shape" style={{ color: 'var(--champagne)' }} />
          </svg>
          The Collection
        </span>
        <h1>Shop the kreations</h1>
        <p>
          Hand-set pieces, made to order. Want your own colors, initials, or a piece
          built from scratch?{' '}
          <Link to="/custom" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Start a Kreation
          </Link>{' '}
          instead.
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-inner">
          <div className="pill-row" id="pillRow">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`pill${active === f.id ? ' active' : ''}`}
                aria-pressed={active === f.id}
                onClick={() => setCategory(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="filter-right">
            <span className="result-count" id="resultCount">
              {loading ? '\u2026' : `${shown.length} ${shown.length === 1 ? 'kreation' : 'kreations'}`}
            </span>
          </div>
        </div>
      </div>

      <div className="shop-grid-wrap">
        <div className="wrap" style={{ padding: '0', maxWidth: '1240px' }}>
          {loading ? (
            <p className="shop-message">Loading the collection\u2026</p>
          ) : unconfigured ? (
            <p className="shop-message">
              The catalog isn't connected yet. Add your Supabase keys to{' '}
              <code>.env.local</code> and restart the dev server.
            </p>
          ) : error ? (
            <p className="shop-message">Couldn't load the collection. Please refresh.</p>
          ) : shown.length === 0 ? (
            <div className="shop-message">
              <p>
                {products.length === 0
                  ? 'New pieces are being photographed right now.'
                  : `Nothing in ${categoryLabel(active)} yet.`}
              </p>
              <Link className="btn btn-primary" to="/custom">Start a Kreation instead</Link>
            </div>
          ) : (
            <div className="shop-grid" id="shopGrid">
              {shown.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="product-card" data-cat={p.category}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} loading="lazy" />
                  ) : (
                    <div className="swatch" />
                  )}
                  <div className="card-sweep"></div>
                  <div className="card-info">
                    <span className="kicker">{categoryLabel(p.category)}</span>
                    <h3>{p.title}</h3>
                    <span className="from">{p.blurb || 'Made to order'}</span>
                  </div>
                  <span className="card-link"></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}