import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../styles/pages/product.css';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { CONTACT_EMAIL } from '../lib/site.js';
import {
  categoryLabel,
  fetchProductBySlug,
  fetchPublishedProducts,
  galleryFor,
} from '../lib/products.js';

const FAQS = [
  {
    q: 'Details & Care',
    a: 'Spot clean only with a dry or barely damp cloth. Stones are hand-set with a flexible jewelry-grade adhesive built for daily wear, not full water submersion.',
  },
  {
    q: 'Shipping & Turnaround',
    a: 'Every piece is made to order, hand-set one stone at a time, and ships nationwide in about 14 days. Dianna confirms the timeline with you before starting.',
  },
  {
    q: 'Sizing',
    a: "Bring your own item or have Dianna source it. Either way she confirms sizing with you in writing before a single stone goes on \u2014 nothing is guessed.",
  },
];

function Shell({ children }) {
  return (
    <div className="page-product">
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <symbol id="gem-shape" viewBox="0 0 24 24">
          <polygon points="12,2 20,9 12,22 4,9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <polyline points="4,9 20,9" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <polyline points="8.5,9 12,2 15.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
          <polyline points="12,22 8.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
          <polyline points="12,22 15.5,9" fill="none" stroke="currentColor" strokeWidth="1" />
        </symbol>
        <symbol id="ic-plus" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="ic-truck" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M3 7h11v9H3zM14 11h4l3 3v2h-7zM7 20a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 7 20zM18 20a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z" />
        </symbol>
        <symbol id="ic-hand" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M8 12V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 12V6a1.5 1.5 0 0 1 3 0v9M8 11.5 5.8 9.3a1.4 1.4 0 0 0-2 2L8 16c1 1.4 2.6 3 5.5 3h1a5 5 0 0 0 5-5v-3" />
        </symbol>
        <symbol id="ic-cal" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M4 5h16v16H4zM4 10h16M8 3v4M16 3v4" />
        </symbol>
        <symbol id="ic-bag" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M6 8h12l1 12H5L6 8ZM9 8V6a3 3 0 0 1 6 0v2" />
        </symbol>
        <symbol id="ic-check" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2" d="M5 12l5 5L19 8" />
        </symbol>
        <symbol id="ic-cart" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M4 6h2l1.6 10.2A2 2 0 0 0 9.6 18h7.8a2 2 0 0 0 2-1.7L20.5 9H6.2" />
          <circle cx="10" cy="21" r="1.2" />
          <circle cx="17" cy="21" r="1.2" />
        </symbol>
        <symbol id="ic-img" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8.5" cy="9.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 17l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </symbol>
      </svg>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter variant="slim" />
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | unconfigured
  const [mainImage, setMainImage] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      if (!slug) {
        if (!cancelled) setStatus('missing');
        return;
      }
      const res = await fetchProductBySlug(slug);
      if (cancelled) return;

      if (res.unconfigured) return setStatus('unconfigured');
      if (res.error || !res.data) return setStatus('missing');

      setProduct(res.data);
      setMainImage(galleryFor(res.data)[0] || null);
      setStatus('ready');

      const all = await fetchPublishedProducts();
      if (cancelled || all.error) return;
      setRelated(
        all.data.filter((p) => p.slug !== res.data.slug && p.category === res.data.category).slice(0, 3)
      );
    })();

    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return <Shell><p className="pdp-message">Loading\u2026</p></Shell>;
  }

  if (status === 'unconfigured') {
    return (
      <Shell>
        <p className="pdp-message">
          The catalog isn't connected yet. Add your Supabase keys to <code>.env.local</code>.
        </p>
      </Shell>
    );
  }

  if (status === 'missing') {
    return (
      <Shell>
        <div className="pdp-message">
          <h1>That piece isn't here.</h1>
          <p>It may have sold or been renamed. Everything currently available is in the shop.</p>
          <Link className="btn btn-dark" to="/shop">Browse the collection</Link>
        </div>
      </Shell>
    );
  }

  const gallery = galleryFor(product);

  return (
    <Shell>
      <nav className="crumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`}>{categoryLabel(product.category)}</Link>
      </nav>

      <div className="pdp-wrap">
        <div className="pdp-grid">
          <div className="pdp-gallery">
            <div className="gallery-main">
              {mainImage ? (
                <img id="mainImg" src={mainImage} alt={product.title} />
              ) : (
                <div className="swatch" />
              )}
              <div className="gallery-sweep"></div>
              <span className="gallery-badge">One of One</span>
            </div>

            {gallery.length > 1 && (
              <div className="gallery-thumbs">
                {gallery.map((src) => (
                  <button
                    key={src}
                    type="button"
                    className={`thumb${src === mainImage ? ' active' : ''}`}
                    onClick={() => setMainImage(src)}
                    aria-label="Show this photo"
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            <span className="eyebrow">
              <svg className="gem" viewBox="0 0 24 24">
                <use href="#gem-shape" style={{ color: 'var(--ruby)' }} />
              </svg>
              {categoryLabel(product.category)} \u2014 Hand-Set
            </span>

            <h1>{product.title}</h1>

            <div className="price-row">
              <span className="price">Made to order</span>
              <span className="price-note">
                Dianna quotes each piece after you send the details
              </span>
            </div>

            <span className="one-of-one">One of one \u2014 once it's gone, it's gone</span>

            {product.description && (
              <p className="pdp-desc">{product.description}</p>
            )}

            <div className="cross-sell">
              <svg viewBox="0 0 24 24"><use href="#gem-shape" /></svg>
              Want different colors or your own initials instead?
              <Link to="/custom">Start a Kreation</Link>
            </div>

            <div className="pdp-actions">
              <Link className="btn btn-dark" to="/custom">Request This Piece</Link>
              <a
                className="btn btn-ghost"
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Question about ' + product.title)}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24"><use href="#ic-bag" /></svg>
                Ask a Question
              </a>
            </div>

            <div className="trust-row">
              <div className="trust-item">
                <svg viewBox="0 0 24 24"><use href="#ic-hand" /></svg>
                Hand-set in Laurelton, Queens
              </div>
              <div className="trust-item">
                <svg viewBox="0 0 24 24"><use href="#ic-truck" /></svg>
                Ships nationwide
              </div>
              <div className="trust-item">
                <svg viewBox="0 0 24 24"><use href="#ic-cal" /></svg>
                About 14 days, made to order
              </div>
            </div>

            <div className="accordions" id="pdpAccordions">
              {FAQS.map((f, i) => (
                <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={f.q}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {f.q}
                    <svg viewBox="0 0 24 24"><use href="#ic-plus" /></svg>
                  </button>
                  <div className="faq-a"><p>{f.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>You may also like</h2>
            </div>
            <div className="related-grid">
              {related.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="product-card">
                  {p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy" /> : <div className="swatch" />}
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
          </div>
        </section>
      )}
    </Shell>
  );
}