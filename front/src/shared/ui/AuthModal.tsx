import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuthFormPayload } from '@/shared/lib/api'

type AuthMode = 'login' | 'register'

type AuthModalProps = {
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (payload: AuthFormPayload) => Promise<void>
  isSubmitting: boolean
  errorMessage: string | null
}

export function AuthModal({
  mode,
  onClose,
  onModeChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: AuthModalProps) {
  const { t } = useTranslation()
  const isLogin = mode === 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (isLogin) {
      setFullName('')
      setPhone('')
      setAddress('')
    }
  }, [isLogin])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">{t('auth.modal.eyebrow')}</span>
            <h2 id="auth-modal-title">
              {isLogin ? t('auth.login') : t('auth.register')}
            </h2>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={t('auth.modal.close')}
          >
            ×
          </button>
        </div>

        <div className="auth-switch" role="tablist" aria-label={t('auth.modal.chooseForm')}>
          <button
            className={`auth-switch__button ${isLogin ? 'auth-switch__button--active' : ''}`}
            type="button"
            onClick={() => onModeChange('login')}
          >
            {t('auth.login')}
          </button>
          <button
            className={`auth-switch__button ${!isLogin ? 'auth-switch__button--active' : ''}`}
            type="button"
            onClick={() => onModeChange('register')}
          >
            {t('auth.register')}
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault()
            await onSubmit({
              fullName,
              email,
              password,
              phone,
              address,
            })
          }}
        >
          {!isLogin ? (
            <label>
              <span>{t('auth.modal.fullName')}</span>
              <input
                type="text"
                placeholder={t('auth.modal.fullNamePlaceholder')}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required={!isLogin}
              />
            </label>
          ) : null}

          <label>
            <span>{t('auth.modal.email')}</span>
            <input
              type="email"
              placeholder={t('auth.modal.emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>{t('auth.modal.password')}</span>
            <input
              type="password"
              placeholder={t('auth.modal.passwordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {!isLogin ? (
            <>
              <label>
                <span>{t('auth.modal.phone')}</span>
                <input
                  type="tel"
                  placeholder={t('auth.modal.phonePlaceholder')}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required={!isLogin}
                />
              </label>
              <label>
                <span>{t('auth.modal.address')}</span>
                <input
                  type="text"
                  placeholder={t('auth.modal.addressPlaceholder')}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required={!isLogin}
                />
              </label>
            </>
          ) : null}

          {errorMessage ? <p className="auth-modal__error">{errorMessage}</p> : null}

          <button className="button auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('auth.modal.loading')
              : isLogin
                ? t('auth.modal.submitLogin')
                : t('auth.modal.submitRegister')}
          </button>
        </form>

        <p className="auth-modal__hint">
          {t('auth.modal.hint')}
        </p>
      </div>
    </div>
  )
}
