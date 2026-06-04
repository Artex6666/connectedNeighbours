import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

type Role = 'resident' | 'moderator' | 'admin'

type Props = {
  allow: Role[]
}

export function RoleRoute({ allow }: Props) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={routes.login} state={{ from: location }} replace />
  }

  if (!user || !allow.includes(user.role)) {
    return <Navigate to={routes.dashboard} replace />
  }

  return <Outlet />
}
