import { Link } from 'react-router-dom'
import paramIcon from '@/assets/param.png'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

export function AdminQuickButton() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <Link
      to={routes.admin}
      className="admin-quick-button"
      aria-label="Ouvrir le back office"
      title="Back office"
    >
      <img src={paramIcon} alt="" />
    </Link>
  )
}
