import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { isStaff } from '../lib/endpoints'
import Loading from '../components/Loading'

/**
 * `staff` gates the admin console. A CLIENT who lands on an /admin URL is
 * sent to their own portal, not shown a 403 — telling them the console
 * exists serves no purpose.
 */
export default function ProtectedRoute({ children, staff = false, owner = false }) {
  const { user, booting, isOwner } = useAuth()
  const loc = useLocation()

  if (booting) return <Loading full />
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (staff && !isStaff(user.role)) return <Navigate to="/portal" replace />
  if (owner && !isOwner) return <Navigate to="/admin" replace />
  return children
}
