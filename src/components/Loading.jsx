export default function Loading({ full = false, label = 'Loading' }) {
  return (
    <div style={{
      display: 'grid', placeItems: 'center',
      minHeight: full ? '60vh' : '160px', gap: 12,
    }}>
      <div className="mini-rail" style={{ width: 120 }}>
        <i className="f" /><i className="f" /><i className="a" /><i /><i /><i />
      </div>
      <span className="eyebrow">{label}</span>
    </div>
  )
}
