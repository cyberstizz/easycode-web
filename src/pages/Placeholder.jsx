import { TopBar } from '../components/Shell'
import EmptyState from '../components/EmptyState'

/**
 * Every route in App.jsx resolves to a real component from day one.
 * A route that 404s because the page "isn't built yet" costs more time
 * to diagnose than this file costs to keep.
 */
export default function Placeholder({ title, note }) {
  return (
    <>
      <TopBar crumbs={[{ label: title }]} />
      <div className="wrap">
        <EmptyState
          title={`${title} — not built yet`}
          body={note || 'The route, the shell, and the nav entry are wired. The page body is next.'}
        />
      </div>
    </>
  )
}
