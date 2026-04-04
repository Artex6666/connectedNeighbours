import { useTranslation } from 'react-i18next'

type AuthMode = 'login' | 'register'

type AuthModalProps = {
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: () => void
}

export function AuthModal({
  mode,
  onClose,
  onModeChange,
  onSubmit,
}: AuthModalProps) {
  const { t } = useTranslation()
  const isLogin = mode === 'login'

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
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          {!isLogin ? (
            <label>
              <span>{t('auth.modal.fullName')}</span>
              <input type="text" placeholder={t('auth.modal.fullNamePlaceholder')} />
            </label>
          ) : null}

          <label>
            <span>{t('auth.modal.email')}</span>
            <input type="email" placeholder={t('auth.modal.emailPlaceholder')} />
          </label>

          <label>
            <span>{t('auth.modal.password')}</span>
            <input type="password" placeholder={t('auth.modal.passwordPlaceholder')} />
          </label>

          {!isLogin ? (
            <label>
              <span>{t('auth.modal.district')}</span>
              <input type="text" placeholder={t('auth.modal.districtPlaceholder')} />
            </label>
          ) : null}

          <button className="button auth-form__submit" type="submit">
            {isLogin ? t('auth.modal.submitLogin') : t('auth.modal.submitRegister')}
          </button>
        </form>

        <p className="auth-modal__hint">
          {t('auth.modal.hint')}
        </p>
      </div>
    </div>
  )
}
