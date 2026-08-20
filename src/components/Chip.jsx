export default function Chip({ tone = 'c-done', children, live = false }) {
  return (
    <span className={`chip ${tone}`}>
      {live && <span className="dot live" />}
      {children}
    </span>
  )
}
