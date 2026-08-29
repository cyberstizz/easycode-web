import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { isStaff } from '../lib/endpoints'
import Loading from '../components/Loading'

/**
 * `staff` gates the admin console. A CLIENT who lands on an /admin URL is
 * sent to their own portal, not shown a 403 — telling them the console
 * exists serves no purpose.
 *
 * The reverse redirect matters just as much: staff on a /portal URL used to
 * render the portal shell and then fail, because GET /v1/portal/home rejects
 * staff accounts outright. That produced a bare "Something went wrong" under
 * an admin sidebar, which reads like a broken portal rather than what it is —
 * the wrong kind of account for this URL.
 */
export default function ProtectedRoute({ children, staff = false, owner = false }) {
  const { user, booting, isOwner } = useAuth()
  const loc = useLocation()

  if (booting) return <Loading full />
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (staff && !isStaff(user.role)) return <Navigate to="/portal" replace />
  if (!staff && isStaff(user.role) && loc.pathname.startsWith('/portal')) {
    return <Navigate to="/admin" replace />
  }
  if (owner && !isOwner) return <Navigate to="/admin" replace />
  return children
}