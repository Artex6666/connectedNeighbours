import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

type Role = 'resident' | 'moderator' | 'admin'

type Props = {
  allow: Role[]
  children: ReactNode
}

export function RequireRole({ allow, children }: Props) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) {
    return <Navigate to={routes.admin} replace />
  }
  return <>{children}</>
}
