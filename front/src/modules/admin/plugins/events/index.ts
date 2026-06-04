import type { AdminPlugin } from '@/shared/plugins/types'
import { EventsPage } from './EventsPage'

const plugin: AdminPlugin = {
  id: 'events',
  order: 40,
  icon: '📅',
  labelKey: 'admin.nav.events',
  descriptionKey: 'admin.dashboard.tiles.events.description',
  Page: EventsPage,
  allow: ['admin', 'moderator'],
}

export default plugin
