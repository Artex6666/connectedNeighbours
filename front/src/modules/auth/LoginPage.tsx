import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? routes.dashboard

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <a className="brand" href={routes.home}>
            <span className="brand__mark">CN</span>
          </a>
          <h1>{t('auth.login')}</h1>
          <p>{t('auth.loginSubtitle')}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">{t('auth.modal.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.modal.emailPlaceholder')}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">{t('auth.modal.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.modal.passwordPlaceholder')}
              required
              autoComplete="current-password"
            />
          </div>

          <button className="button button--full" type="submit" disabled={isLoading}>
            {isLoading ? t('auth.modal.loading') : t('auth.modal.submitLogin')}
          </button>
        </form>

        <p className="auth-card__footer">
          {t('auth.noAccount')}{' '}
          <Link to={routes.register}>{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  )
}
