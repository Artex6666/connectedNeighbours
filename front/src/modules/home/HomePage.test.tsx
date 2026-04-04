import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '@/modules/home/HomePage'
import '@/shared/i18n'

describe('HomePage', () => {
  it('renders the frontend foundation content', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: /une base react propre pour construire bobconnect/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /construire le hero menu/i,
      }),
    ).toBeInTheDocument()
  })
})
