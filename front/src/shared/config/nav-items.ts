import { routes } from '@/shared/config/routes'

export type NavItem = {
  labelKey: string
  href: string
}

export const navItems: NavItem[] = [
  { labelKey: 'navigation.home', href: routes.home },
  { labelKey: 'navigation.concept', href: '#concept' },
  { labelKey: 'navigation.services', href: '#services' },
  { labelKey: 'navigation.events', href: '#events' },
]
