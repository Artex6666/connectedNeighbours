import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/shared/layout/PublicLayout'
import { PrivateRoute } from '@/shared/layout/PrivateRoute'
import { HomePage } from '@/modules/home/HomePage'
import { LoginPage } from '@/modules/auth/LoginPage'
import { RegisterPage } from '@/modules/auth/RegisterPage'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { NotFoundPage } from '@/modules/not-found/NotFoundPage'
import { routes } from '@/shared/config/routes'

export const router = createBrowserRouter([
  // Public routes (with header/footer layout)
  {
    path: routes.home,
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },

  // Auth pages (no layout — full page)
  { path: routes.login, element: <LoginPage /> },
  { path: routes.register, element: <RegisterPage /> },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      { path: routes.dashboard, element: <DashboardPage /> },
    ],
  },

  // Fallback
  { path: '*', element: <NotFoundPage /> },
])
