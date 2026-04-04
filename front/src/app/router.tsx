import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/modules/home/HomePage'
import { NotFoundPage } from '@/modules/not-found/NotFoundPage'
import { PublicLayout } from '@/shared/layout/PublicLayout'
import { routes } from '@/shared/config/routes'

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
