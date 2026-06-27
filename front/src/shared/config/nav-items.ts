export type NavItem = {
  label: string
  href: string
}

// Ancres vers les sections de la landing publique (HomePageView).
export const navItems: NavItem[] = [
  { label: 'Quartiers', href: '#quartiers' },
  { label: 'Annonces', href: '#annonces' },
  { label: 'Sondages', href: '#sondages' },
  { label: 'Événements', href: '#evenements' },
]
