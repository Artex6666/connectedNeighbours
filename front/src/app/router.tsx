import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/shared/layout/PublicLayout'
import { PrivateRoute } from '@/shared/layout/PrivateRoute'
import { RoleRoute } from '@/shared/layout/RoleRoute'
import { RequireRole } from '@/shared/layout/RequireRole'
import { AdminLayout } from '@/shared/layout/AdminLayout'
import { HomePage } from '@/modules/home/HomePage'
import { LoginPage } from '@/modules/auth/LoginPage'
import { RegisterPage } from '@/modules/auth/RegisterPage'
import { VerifyEmailPage } from '@/modules/auth/VerifyEmailPage'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { ServicesPage } from '@/modules/services/ServicesPage'
import { ServiceDetailPage } from '@/modules/services/ServiceDetailPage'
import { EventsPage } from '@/modules/events/EventsPage'
import { EventDetailPage } from '@/modules/events/EventDetailPage'
import { DocumentsPage } from '@/modules/documents/DocumentsPage'
import { VotesPage } from '@/modules/votes/VotesPage'
import { GroupsPage } from '@/modules/groups/GroupsPage'
import { ProfilePage } from '@/modules/profile/ProfilePage'
import { AdminDashboardPage } from '@/modules/admin/AdminDashboardPage'
import { NotFoundPage } from '@/modules/not-found/NotFoundPage'
import { routes } from '@/shared/config/routes'
import { adminPlugins, pluginPath } from '@/shared/plugins/admin-registry'
import { MongoDslPage } from '@/modules/dsl/MongoDslPage'

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
  { path: routes.verifyEmail, element: <VerifyEmailPage /> },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      { path: routes.dashboard, element: <DashboardPage /> },
      { path: routes.services, element: <ServicesPage /> },
      { path: `${routes.services}/:id`, element: <ServiceDetailPage /> },
      { path: routes.events, element: <EventsPage /> },
      { path: `${routes.events}/:id`, element: <EventDetailPage /> },
      { path: routes.documents, element: <DocumentsPage /> },
      { path: routes.votes, element: <VotesPage /> },
      { path: routes.groups, element: <GroupsPage /> },
      { path: routes.profile, element: <ProfilePage /> },
      {path: routes.mongoDsl, element: <MongoDslPage /> },
    ],
  },

  // Admin back office — plugins are auto-discovered from
  // `modules/admin/plugins/*/index.ts`. To add a new module, drop a folder
  // there; this file does NOT need to be touched.
  {
    element: <RoleRoute allow={['admin', 'moderator']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: routes.admin, element: <AdminDashboardPage /> },
          ...adminPlugins.map((plugin) => ({
            path: pluginPath(plugin),
            element: (
              <RequireRole allow={plugin.allow ?? ['admin']}>
                <plugin.Page />
              </RequireRole>
            ),
          })),
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
