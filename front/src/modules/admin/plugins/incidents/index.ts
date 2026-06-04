import type { AdminPlugin } from '@/shared/plugins/types'
import { IncidentsPage } from './IncidentsPage'

const plugin: AdminPlugin = {
  id: 'incidents',
  order: 50,
  icon: '🚨',
  labelKey: 'admin.nav.incidents',
  descriptionKey: 'admin.dashboard.tiles.incidents.description',
  Page: IncidentsPage,
  allow: ['admin', 'moderator'],
}

export default plugin
