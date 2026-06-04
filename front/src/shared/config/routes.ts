export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  services: '/services',
  serviceDetail: (id: string) => `/services/${id}`,
  events: '/events',
  profile: '/profile',
  admin: '/admin',
  // Per-plugin admin URLs are derived from the plugin id at runtime — see
  // `pluginPath(plugin)` in `@/shared/plugins/admin-registry`.
} as const
