import type { AdminPlugin } from '@/shared/plugins/types'
import { ServicesPage } from './ServicesPage'

const plugin: AdminPlugin = {
  id: 'services',
  order: 30,
  icon: '🤝',
  labelKey: 'admin.nav.services',
  descriptionKey: 'admin.dashboard.tiles.services.description',
  Page: ServicesPage,
  allow: ['admin', 'moderator'],
}

export default plugin
