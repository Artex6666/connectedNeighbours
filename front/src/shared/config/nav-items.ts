import { routes } from '@/shared/config/routes'

export type NavItem = {
  labelKey: string
  href: string
}

export const navItems: NavItem[] = [
  { labelKey: 'navigation.home', href: routes.home },
  { labelKey: 'navigation.services', href: '#services' },
  { labelKey: 'navigation.documents', href: '#documents' },
  { labelKey: 'navigation.events', href: '#events' },
  { labelKey: 'navigation.messaging', href: '#messaging' },
]
