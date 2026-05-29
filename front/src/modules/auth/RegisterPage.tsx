import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { authApi } from '@/shared/lib/api'
import { routes } from '@/shared/config/routes'

const inputClass = 'h-12 px-4 rounded-xl outline-none transition-colors w-full'
const inputStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}
const labelClass = 'text-xs font-semibold uppercase tracking-wide'

export function RegisterPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', address: '' })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Link to={routes.home} className="inline-flex items-center gap-3 mb-8">
          <span className="brand__mark">BC</span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
            Connected Neighbours
          </span>
        </Link>

        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {t('auth.register')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('auth.registerSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ffb4b4' }}
              role="alert"
            >
              {error}
            </div>
          )}

          {[
            { id: 'fullName', label: t('auth.modal.fullName'), placeholder: t('auth.modal.fullNamePlaceholder'), type: 'text', autoComplete: 'name' },
            { id: 'email', label: t('auth.modal.email'), placeholder: t('auth.modal.emailPlaceholder'), type: 'email', autoComplete: 'email' },
            { id: 'password', label: t('auth.modal.password'), placeholder: '••••••••', type: 'password', autoComplete: 'new-password' },
            { id: 'phone', label: t('auth.modal.phone'), placeholder: t('auth.modal.phonePlaceholder'), type: 'tel', autoComplete: 'tel' },
            { id: 'address', label: t('auth.modal.address'), placeholder: t('auth.modal.addressPlaceholder'), type: 'text', autoComplete: 'street-address' },
          ].map(({ id, label, placeholder, type, autoComplete }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className={labelClass} style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input
                id={id}
                name={id}
                type={type}
                value={form[id as keyof typeof form]}
                onChange={handleChange}
                placeholder={placeholder}
                required
                autoComplete={autoComplete}
                autoFocus={id === 'fullName'}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          ))}

          <button type="submit" disabled={isLoading} className="button button--full mt-2">
            {isLoading ? t('auth.modal.loading') : t('auth.modal.submitRegister')}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          {t('auth.hasAccount')}{' '}
          <Link to={routes.login} className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
