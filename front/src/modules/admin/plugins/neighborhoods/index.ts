import type { AdminPlugin } from '@/shared/plugins/types'
import { NeighborhoodsPage } from './NeighborhoodsPage'

const plugin: AdminPlugin = {
  id: 'neighborhoods',
  order: 10,
  icon: '🗺️',
  labelKey: 'admin.nav.neighborhoods',
  descriptionKey: 'admin.dashboard.tiles.neighborhoods.description',
  Page: NeighborhoodsPage,
}

export default plugin
