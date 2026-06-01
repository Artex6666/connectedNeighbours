import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

export function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to={routes.login} state={{ from: location }} replace />
  }

  return <Outlet />
}
