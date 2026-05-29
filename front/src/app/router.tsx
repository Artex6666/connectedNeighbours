import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/shared/layout/PublicLayout'
import { PrivateRoute } from '@/shared/layout/PrivateRoute'
import { HomePage } from '@/modules/home/HomePage'
import { LoginPage } from '@/modules/auth/LoginPage'
import { RegisterPage } from '@/modules/auth/RegisterPage'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { ServicesPage } from '@/modules/services/ServicesPage'
import { ServiceDetailPage } from '@/modules/services/ServiceDetailPage'
import { ProfilePage } from '@/modules/profile/ProfilePage'
import { NotFoundPage } from '@/modules/not-found/NotFoundPage'
import { routes } from '@/shared/config/routes'

export const router = createBrowserRouter([
  // Public routes (landing page)
  {
    path: routes.home,
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },

  // Auth pages
  { path: routes.login, element: <LoginPage /> },
  { path: routes.register, element: <RegisterPage /> },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      { path: routes.dashboard, element: <DashboardPage /> },
      { path: routes.services, element: <ServicesPage /> },
      { path: `${routes.services}/:id`, element: <ServiceDetailPage /> },
      { path: routes.profile, element: <ProfilePage /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
