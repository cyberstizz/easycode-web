export default function EmptyState({ icon, title, body, action }) {
  return (
    <div className="estate">
      {icon && <div className="estate-ic">{icon}</div>}
      <div className="h3" style={{ marginBottom: 6 }}>{title}</div>
      {body && (
        <p style={{
          fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6,
          maxWidth: 300, margin: '0 auto 15px',
        }}>{body}</p>
      )}
      {action}
    </div>
  )
}
