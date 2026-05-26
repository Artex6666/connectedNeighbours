import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { authApi } from '@/shared/lib/api'
import { routes } from '@/shared/config/routes'

export function RegisterPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Register then auto-login
      await authApi.register(form)
      await login(form.email, form.password)
      navigate(routes.dashboard, { replace: true })
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
          <h1>{t('auth.register')}</h1>
          <p>{t('auth.registerSubtitle')}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="fullName">{t('auth.modal.fullName')}</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder={t('auth.modal.fullNamePlaceholder')}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">{t('auth.modal.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t('auth.modal.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">{t('auth.modal.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t('auth.modal.passwordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">{t('auth.modal.phone')}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder={t('auth.modal.phonePlaceholder')}
              required
              autoComplete="tel"
            />
          </div>

          <div className="form-field">
            <label htmlFor="address">{t('auth.modal.address')}</label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              placeholder={t('auth.modal.addressPlaceholder')}
              required
              autoComplete="street-address"
            />
          </div>

          <button className="button button--full" type="submit" disabled={isLoading}>
            {isLoading ? t('auth.modal.loading') : t('auth.modal.submitRegister')}
          </button>
        </form>

        <p className="auth-card__footer">
          {t('auth.hasAccount')}{' '}
          <Link to={routes.login}>{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
