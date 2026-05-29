export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  services: '/services',
  serviceDetail: (id: string) => `/services/${id}`,
  events: '/events',
  profile: '/profile',
} as const
