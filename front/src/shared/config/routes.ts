export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  dashboard: '/dashboard',
  services: '/services',
  serviceDetail: (id: string) => `/services/${id}`,
  events: '/events',
  documents: '/documents',
  votes: '/votes',
  groups: '/groups',
  profile: '/profile',
  admin: '/admin',
  mongoDsl: '/mongo-dsl',
  // Per-plugin admin URLs are derived from the plugin id at runtime — see
  // `pluginPath(plugin)` in `@/shared/plugins/admin-registry`.
} as const
