import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="empty-state">
      <span className="hero-badge">404</span>
      <h1>{t('errors.notFoundTitle')}</h1>
      <p>{t('errors.notFoundDescription')}</p>
      <a className="button" href="/">
        BobConnect
      </a>
    </section>
  )
}
