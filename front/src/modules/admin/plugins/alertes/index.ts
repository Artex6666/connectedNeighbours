import type { AdminPlugin } from '@/shared/plugins/types'
import { AlertesPage } from './AlertesPage'

const plugin: AdminPlugin = {
  id: 'alertes',
  order: 60,
  icon: '📣',
  labelKey: 'admin.nav.alertes',
  descriptionKey: 'admin.dashboard.tiles.alertes.description',
  Page: AlertesPage,
  allow: ['admin', 'moderator'],
}

export default plugin
