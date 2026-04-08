import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/shared/config/routes'
import { HomePage } from '@/modules/home/HomePage'
import { PublicLayout } from '@/shared/layout/PublicLayout'
import '@/shared/i18n'

vi.mock('@/shared/ui/NeighborhoodMap', () => ({
  NeighborhoodMap: () => <div>Carte du quartier</div>,
}))

vi.mock('@/shared/ui/ChatWidget', () => ({
  ChatWidget: () => null,
}))

describe('HomePage', () => {
  it('renders the landing page and auth entrypoints', () => {
    const router = createMemoryRouter(
      [
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
      ],
      {
        initialEntries: ['/'],
      },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: /le reseau local/i })).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /decouvrir le concept/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inscription/i })).toBeInTheDocument()
  })
})
