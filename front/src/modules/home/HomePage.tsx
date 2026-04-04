import { useHomePageController } from '@/modules/home/controller/useHomePageController'
import { HomePageView } from '@/modules/home/view/HomePageView'

export function HomePage() {
  const content = useHomePageController()

  return <HomePageView content={content} />
}
